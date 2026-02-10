import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Database, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { ConversionStats } from "@/components/shared/ConversionStats";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

type Dialect = "postgresql" | "mysql" | "sqlite" | "bigquery";

const TYPE_MAP: Record<Dialect, Record<string, string>> = {
  postgresql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE PRECISION", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP" },
  mysql: { VARCHAR: "VARCHAR(255)", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "DOUBLE", BOOLEAN: "TINYINT(1)", DATE: "DATE", TIMESTAMP: "DATETIME" },
  sqlite: { VARCHAR: "TEXT", BIGINT: "INTEGER", INTEGER: "INTEGER", DOUBLE: "REAL", BOOLEAN: "INTEGER", DATE: "TEXT", TIMESTAMP: "TEXT" },
  bigquery: { VARCHAR: "STRING", BIGINT: "INT64", INTEGER: "INT64", DOUBLE: "FLOAT64", BOOLEAN: "BOOL", DATE: "DATE", TIMESTAMP: "TIMESTAMP" },
};

function mapType(duckType: string, dialect: Dialect): string {
  const upper = duckType.toUpperCase();
  for (const [key, val] of Object.entries(TYPE_MAP[dialect])) {
    if (upper.includes(key)) return val;
  }
  return TYPE_MAP[dialect].VARCHAR || "TEXT";
}

export default function CsvToSqlPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [output, setOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"output" | "raw-input">("output");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [batchSize, setBatchSize] = useState(100);
  const [includeDropTable, setIncludeDropTable] = useState(false);
  const [tableName, setTableName] = useState("my_table");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setOutput("");
    setRawInput(null);
    setView("output");
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      await generateSQL(tName, info);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "text/csv" });
    const f = new File([blob], "pasted_data.csv", { type: "text/csv" });
    handleFile(f);
  }

  async function generateSQL(tName?: string, info?: { columns: string[]; rowCount: number; types: string[] }) {
    if (!db || !file) return;
    const tn = tName ?? sanitizeTableName(file.name);
    const m = info ?? meta;
    if (!m) return;
    setLoading(true);
    try {
      const result = await runQuery(db, `SELECT * FROM "${tn}"`);
      const lines: string[] = [];
      if (includeDropTable) { lines.push(`DROP TABLE IF EXISTS ${tableName};`); lines.push(""); }
      const colDefs = m.columns.map((col, i) => `  ${col} ${mapType(m.types[i], dialect)}`);
      lines.push(`CREATE TABLE ${tableName} (`);
      lines.push(colDefs.join(",\n"));
      lines.push(`);`);
      lines.push("");
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        lines.push(`INSERT INTO ${tableName} (${m.columns.join(", ")}) VALUES`);
        const valueLines = batch.map((row) => {
          const vals = row.map((v) => {
            if (v === null || v === undefined) return "NULL";
            if (typeof v === "number" || typeof v === "bigint") return String(v);
            if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          return `  (${vals.join(", ")})`;
        });
        lines.push(valueLines.join(",\n") + ";");
        lines.push("");
      }
      setOutput(lines.join("\n"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    downloadBlob(output, `${tableName}.sql`, "text/sql");
  }

  const dialects: { id: Dialect; label: string }[] = [
    { id: "postgresql", label: "PostgreSQL" },
    { id: "mysql", label: "MySQL" },
    { id: "sqlite", label: "SQLite" },
    { id: "bigquery", label: "BigQuery" },
  ];

  return (
    <ToolPage icon={Database} title="CSV to SQL" description="Generate CREATE TABLE and INSERT statements from CSV data." metaDescription={getToolMetaDescription("csv-to-sql")} seoContent={getToolSeo("csv-to-sql")}>
      <DuckDBGate>
        <div className="space-y-4">
          {!file && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["file", "paste"] as const).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputMode === m ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {m === "file" ? "Upload File" : "Paste Data"}
                  </button>
                ))}
              </div>
              {inputMode === "file" ? (
                <div className="space-y-3">
                  <DropZone accept={[".csv", ".tsv"]} onFile={handleFile} label="Drop a CSV file" />
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleCSV())}>
                      <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                    </Button>
                  </div>
                </div>
              ) : (
                <PasteInput onSubmit={handlePaste} placeholder="Paste CSV data here..." label="Paste CSV data" accept={[".csv", ".tsv"]} onFile={handleFile} />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setOutput(""); setRawInput(null); }}>New file</Button>
              </div>
              {output && <ConversionStats rows={meta.rowCount} columns={meta.columns.length} inputFormat="CSV" outputFormat="SQL" />}
              <div className="border-2 border-border p-4 space-y-3">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Dialect</label>
                    <div className="flex gap-1">
                      {dialects.map((d) => (
                        <button key={d.id} onClick={() => setDialect(d.id)}
                          className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${dialect === d.id ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Table name</label>
                    <input value={tableName} onChange={(e) => setTableName(e.target.value)} className="border-2 border-border bg-background px-2 py-1 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Batch size</label>
                    <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="border-2 border-border bg-background px-2 py-1 text-xs">
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                      <option value={1000}>1000</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={includeDropTable} onChange={(e) => setIncludeDropTable(e.target.checked)} />
                  Include DROP TABLE IF EXISTS
                </label>
                <Button size="sm" onClick={() => generateSQL()}>Regenerate</Button>
              </div>
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Schema Preview</div>
                {meta.columns.map((col, i) => (
                  <div key={col} className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 text-xs">
                    <span className="font-medium">{col}</span>
                    <span className="font-mono text-muted-foreground">{mapType(meta.types[i], dialect)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {([["output", "SQL Output"], ["raw-input", "Raw Input"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${view === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <LoadingState message="Generating SQL..." />}
          {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {output && view === "output" && <CodeBlock code={output} fileName={`${tableName}.sql`} onDownload={handleDownload} />}
          {view === "raw-input" && <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
