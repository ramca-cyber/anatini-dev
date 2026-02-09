import { useState } from "react";
import { getToolSeo } from "@/lib/seo-content";
import { Braces, Download, FlaskConical, Eye } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { runQuery, exportToCSV, downloadBlob, formatBytes } from "@/lib/duckdb-helpers";
import { getSampleJSON } from "@/lib/sample-data";
import * as duckdb from "@duckdb/duckdb-wasm";

interface StructureInfo {
  rootType: string;
  objectCount: number;
  depth: number;
  paths: { path: string; type: string }[];
}

function analyzeJSON(text: string): StructureInfo {
  const parsed = JSON.parse(text);
  const isArray = Array.isArray(parsed);
  const rootObj = isArray ? parsed[0] : parsed;
  const objectCount = isArray ? parsed.length : 1;
  const paths: { path: string; type: string }[] = [];
  let maxDepth = 0;

  function walk(obj: any, prefix: string, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      paths.push({ path: prefix || "root", type: `Array[${obj.length}]` });
      if (obj.length > 0 && typeof obj[0] === "object") walk(obj[0], prefix + "[]", depth + 1);
      return;
    }
    for (const [key, val] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (val === null || val === undefined) {
        paths.push({ path: p, type: "null" });
      } else if (Array.isArray(val)) {
        paths.push({ path: p, type: `Array[${val.length}]` });
        if (val.length > 0 && typeof val[0] === "object") walk(val[0], p + "[]", depth + 1);
      } else if (typeof val === "object") {
        walk(val, p, depth + 1);
      } else {
        paths.push({ path: p, type: typeof val });
      }
    }
  }

  if (rootObj && typeof rootObj === "object") walk(rootObj, "", 1);

  return {
    rootType: isArray ? `Array of ${objectCount} objects` : "Single object",
    objectCount,
    depth: maxDepth,
    paths,
  };
}

export default function FlattenPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [structure, setStructure] = useState<StructureInfo | null>(null);
  const [naming, setNaming] = useState<"dot" | "underscore">("underscore");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setStructure(null);
    try {
      const text = await f.text();
      setFileText(text);
      const info = analyzeJSON(text);
      setStructure(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read JSON");
    } finally {
      setLoading(false);
    }
  }

  async function handleFlatten() {
    if (!db || !file) return;
    setLoading(true);
    setError(null);
    try {
      await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
      const conn = await db.connect();
      try {
        const sep = naming === "dot" ? "." : "_";

        // Load JSON with full depth
        await conn.query(`CREATE OR REPLACE TABLE __raw_json AS SELECT * FROM read_json_auto('${file.name}', maximum_depth=-1)`);

        // Iteratively expand STRUCTs and UNNEST arrays
        let currentTable = "__raw_json";
        for (let iter = 0; iter < 10; iter++) {
          const descRes = await conn.query(`DESCRIBE "${currentTable}"`);
          const nameCol = descRes.getChildAt(0);
          const typeCol = descRes.getChildAt(1);

          const cols: { name: string; type: string }[] = [];
          for (let i = 0; i < descRes.numRows; i++) {
            cols.push({ name: String(nameCol?.get(i)), type: String(typeCol?.get(i)) });
          }

          const hasStruct = cols.some(c => c.type.startsWith("STRUCT"));
          const hasArray = cols.some(c => c.type.endsWith("[]"));

          if (!hasStruct && !hasArray) break;

          // Build SELECT: expand structs with renamed fields, unnest arrays
          const selectParts: string[] = [];
          const unnestParts: string[] = [];

          for (const col of cols) {
            if (col.type.startsWith("STRUCT")) {
              // Use struct.* expansion — DuckDB supports this natively
              // But we need to rename, so extract keys from the type string
              // Safer: query one row to get field names
              try {
                const fieldsQuery = `SELECT json_keys(to_json("${col.name}")) as keys FROM "${currentTable}" WHERE "${col.name}" IS NOT NULL LIMIT 1`;
                const fieldsRes = await conn.query(fieldsQuery);
                if (fieldsRes.numRows > 0) {
                  const keysArr = fieldsRes.getChildAt(0)?.get(0);
                  // keysArr is a DuckDB list, iterate
                  const keys: string[] = [];
                  if (keysArr && typeof keysArr === "object" && "toArray" in keysArr) {
                    for (const k of (keysArr as any).toArray()) keys.push(String(k));
                  } else if (Array.isArray(keysArr)) {
                    for (const k of keysArr) keys.push(String(k));
                  } else {
                    // Fallback: use struct.* without renaming
                    selectParts.push(`"${col.name}".*`);
                    continue;
                  }
                  for (const key of keys) {
                    const newName = `${col.name}${sep}${key}`;
                    selectParts.push(`struct_extract("${col.name}", '${key}') AS "${newName}"`);
                  }
                } else {
                  // All nulls, just drop
                  selectParts.push(`NULL AS "${col.name}"`);
                }
              } catch {
                // Fallback: just expand with .*
                selectParts.push(`"${col.name}".*`);
              }
            } else if (col.type.endsWith("[]")) {
              // Array column — unnest it
              const innerType = col.type.slice(0, -2);
              if (innerType.startsWith("STRUCT")) {
                // Array of structs: unnest then expand struct in next iteration
                unnestParts.push(`UNNEST("${col.name}") AS "${col.name}"`);
              } else {
                // Array of primitives: unnest to rows
                unnestParts.push(`UNNEST("${col.name}") AS "${col.name}"`);
              }
            } else {
              selectParts.push(`"${col.name}"`);
            }
          }

          // If we have arrays to unnest, we need LATERAL UNNEST via comma-join syntax
          const nextTable = `__flat_${iter}`;
          if (unnestParts.length > 0) {
            // Combine: select non-array cols + unnested array cols
            const allSelect = [...selectParts, ...unnestParts].join(", ");
            await conn.query(`CREATE OR REPLACE TABLE "${nextTable}" AS SELECT ${allSelect} FROM "${currentTable}"`);
          } else {
            await conn.query(`CREATE OR REPLACE TABLE "${nextTable}" AS SELECT ${selectParts.join(", ")} FROM "${currentTable}"`);
          }

          if (currentTable !== "__raw_json") {
            await conn.query(`DROP TABLE IF EXISTS "${currentTable}"`);
          }
          currentTable = nextTable;
        }

        await conn.query(`CREATE OR REPLACE TABLE flattened AS SELECT * FROM "${currentTable}"`);
        if (currentTable !== "__raw_json") await conn.query(`DROP TABLE IF EXISTS "${currentTable}"`);
        await conn.query(`DROP TABLE IF EXISTS __raw_json`);

        const countRes = await conn.query(`SELECT COUNT(*) as cnt FROM flattened`);
        const count = Number(countRes.getChildAt(0)?.get(0) ?? 0);
        setRowCount(count);
      } finally {
        await conn.close();
      }
      const result = await runQuery(db, `SELECT * FROM flattened LIMIT 100`);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to flatten JSON");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db) return;
    try {
      const csv = await exportToCSV(db, `SELECT * FROM flattened`);
      downloadBlob(csv, file!.name.replace(/\.[^.]+$/, "") + "_flat.csv", "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <ToolPage
      icon={Braces}
      title="JSON Flattener"
      description="Flatten nested JSON/JSONL into tabular format for analysis."
      pageTitle="Flatten JSON Online — Free, Offline | Anatini.dev"
      seoContent={getToolSeo("json-flattener")}
    >
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".json", ".jsonl"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleJSON())}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {/* Structure Detection Panel */}
        {file && structure && !preview && (
          <div className="space-y-4">
            <FileInfo name={file.name} size={formatBytes(file.size)} />

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Structure Detected</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Root type</div>
                  <div className="text-sm font-medium">{structure.rootType}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Nesting depth</div>
                  <div className="text-sm font-medium">{structure.depth} levels</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Detected paths</div>
                  <div className="text-sm font-medium">{structure.paths.length}</div>
                </div>
              </div>

              <div className="max-h-[200px] overflow-auto rounded border border-border/50 bg-background">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Path</th>
                      <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.paths.map((p, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-1 font-mono text-foreground">{p.path}</td>
                        <td className="px-3 py-1 font-mono text-muted-foreground">{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Naming convention */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Naming:</span>
                <div className="flex gap-1">
                  {(["underscore", "dot"] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setNaming(n)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        naming === n
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {n === "dot" ? "address.city" : "address_city"}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleFlatten} disabled={loading}>
                <Braces className="h-4 w-4 mr-1" /> Flatten
              </Button>
            </div>
          </div>
        )}

        {file && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={rowCount} columns={preview.columns.length} />
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download CSV
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setStructure(null); }}>New file</Button>
              </div>
            </div>
            <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
          </div>
        )}

        {loading && <LoadingState message="Processing JSON..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      </div>
    </ToolPage>
  );
}
