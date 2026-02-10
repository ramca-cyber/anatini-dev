import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Search, AlertTriangle, Info, XCircle, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

interface FileIdentity {
  encoding: string;
  bom: string | null;
  lineEndings: string;
  charSet: string;
}

interface CsvStructure {
  delimiter: string;
  quoteChar: string;
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nulls: number;
  unique: number;
  sample: string;
}

interface Warning {
  level: "error" | "warning" | "info";
  message: string;
  detail?: string;
  expandable?: boolean;
  expandedContent?: string;
}

interface DataPattern {
  label: string;
  column: string;
  count: number;
  detail: string;
}

function detectFileIdentity(bytes: Uint8Array): FileIdentity {
  let bom: string | null = null;
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) bom = "UTF-8 BOM (EF BB BF)";
  else if (bytes[0] === 0xFF && bytes[1] === 0xFE) bom = "UTF-16 LE BOM (FF FE)";
  else if (bytes[0] === 0xFE && bytes[1] === 0xFF) bom = "UTF-16 BE BOM (FE FF)";
  const encoding = bom?.includes("UTF-16") ? "UTF-16" : "UTF-8";

  let crlf = 0, lf = 0, cr = 0;
  const len = Math.min(bytes.length, 8192);
  for (let i = 0; i < len; i++) {
    if (bytes[i] === 0x0D) { if (i + 1 < len && bytes[i + 1] === 0x0A) { crlf++; i++; } else cr++; }
    else if (bytes[i] === 0x0A) lf++;
  }
  let lineEndings = "Unknown";
  if (crlf > 0 && lf === 0 && cr === 0) lineEndings = "CRLF (Windows)";
  else if (lf > 0 && crlf === 0 && cr === 0) lineEndings = "LF (Unix/Mac)";
  else if (cr > 0 && lf === 0 && crlf === 0) lineEndings = "CR (Classic Mac)";
  else if (crlf + lf + cr > 0) lineEndings = "Mixed (CRLF + LF)";

  let hasExtended = false;
  for (let i = 0; i < len; i++) { if (bytes[i] > 127) { hasExtended = true; break; } }

  return {
    encoding: bom ? `${encoding} (with BOM)` : `${encoding} (no BOM)`,
    bom,
    lineEndings,
    charSet: hasExtended ? "ASCII + Extended" : "ASCII only",
  };
}

const WarningIcon = ({ level }: { level: string }) => {
  if (level === "error") return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
  if (level === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  return <Info className="h-4 w-4 text-primary flex-shrink-0" />;
};

function ExpandableWarning({ w }: { w: Warning }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => w.expandable && setOpen(!open)}>
        <WarningIcon level={w.level} />
        <div className="flex-1">
          <div className="text-sm font-medium">{w.message}</div>
          {w.detail && <div className="text-xs text-muted-foreground mt-0.5">{w.detail}</div>}
        </div>
        {w.expandable && (
          <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
        )}
      </div>
      {open && w.expandedContent && (
        <pre className="mt-2 ml-7 p-2 text-xs font-mono bg-muted/30 border border-border rounded overflow-auto max-h-[120px]">
          {w.expandedContent}
        </pre>
      )}
    </div>
  );
}

export default function CsvInspectorPage() {
  const { db } = useDuckDB();
  const { addFile, getFile } = useFileStore();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<FileIdentity | null>(null);
  const [structure, setStructure] = useState<CsvStructure | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [patterns, setPatterns] = useState<DataPattern[]>([]);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const autoLoaded = useRef(false);

  useEffect(() => {
    if (autoLoaded.current || !db) return;
    const fileId = searchParams.get("fileId");
    if (fileId) {
      const stored = getFile(fileId);
      if (stored) { autoLoaded.current = true; setStoredFileId(fileId); processFile(stored.file); }
    }
  }, [db]);

  async function processFile(f: File) {
    if (!db) return;
    setFile(f); setLoading(true); setError(null);
    setIdentity(null); setStructure(null); setColumns([]); setWarnings([]); setPreview(null); setPatterns([]);
    try {
      const slice = await f.slice(0, 8192).arrayBuffer();
      const id = detectFileIdentity(new Uint8Array(slice));
      setIdentity(id);

      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);

      let delimLabel = "Auto-detected";
      let quoteChar = '"';
      try {
        const sniff = await runQuery(db, `SELECT * FROM sniff_csv('${f.name}')`);
        const dIdx = sniff.columns.indexOf("Delimiter");
        const qIdx = sniff.columns.indexOf("Quote");
        if (dIdx >= 0 && sniff.rows[0]) {
          const d = String(sniff.rows[0][dIdx]);
          delimLabel = d === "," ? "Comma (,)" : d === "\t" ? "Tab (\\t)" : d === ";" ? "Semicolon (;)" : d === "|" ? "Pipe (|)" : d;
        }
        if (qIdx >= 0 && sniff.rows[0]) quoteChar = String(sniff.rows[0][qIdx]);
      } catch {}

      let duplicateRows = 0;
      try {
        const dupRes = await runQuery(db, `SELECT COUNT(*) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY * ORDER BY 1) as rn FROM "${tableName}") WHERE rn > 1`);
        duplicateRows = Number(dupRes.rows[0]?.[0] ?? 0);
      } catch {}

      setStructure({ delimiter: delimLabel, quoteChar, rowCount: info.rowCount, columnCount: info.columns.length, duplicateRows });

      const colInfos: ColumnInfo[] = [];
      for (let i = 0; i < info.columns.length; i++) {
        const col = info.columns[i];
        try {
          const r = await runQuery(db, `SELECT COUNT(*) - COUNT("${col}") as nulls, COUNT(DISTINCT "${col}") as uniq FROM "${tableName}"`);
          let sample = "";
          try { const s = await runQuery(db, `SELECT "${col}"::VARCHAR FROM "${tableName}" WHERE "${col}" IS NOT NULL LIMIT 1`); sample = String(s.rows[0]?.[0] ?? ""); } catch {}
          colInfos.push({ name: col, type: info.types[i], nulls: Number(r.rows[0]?.[0] ?? 0), unique: Number(r.rows[0]?.[1] ?? 0), sample });
        } catch { colInfos.push({ name: col, type: info.types[i], nulls: 0, unique: 0, sample: "" }); }
      }
      setColumns(colInfos);

      const prev = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 50`);
      setPreview(prev);

      // Data patterns detection
      const detectedPatterns: DataPattern[] = [];
      const stringCols = colInfos.filter((c, i) => info.types[i].includes("VARCHAR"));
      for (const col of stringCols) {
        try {
          const patRes = await runQuery(db, `
            SELECT
              COUNT(CASE WHEN "${col.name}" IN ('NULL', 'null', 'NA', 'N/A', 'None', 'none', 'n/a', '#N/A') THEN 1 END) as null_strings,
              COUNT(CASE WHEN "${col.name}" = '' THEN 1 END) as empty_strings
            FROM "${tableName}"
          `);
          const nullStrings = Number(patRes.rows[0]?.[0] ?? 0);
          const emptyStrings = Number(patRes.rows[0]?.[1] ?? 0);
          if (nullStrings > 0) detectedPatterns.push({ label: "Null-like strings", column: col.name, count: nullStrings, detail: `Values like "NULL", "NA", "N/A", "None" in "${col.name}"` });
          if (emptyStrings > 0) detectedPatterns.push({ label: "Empty strings", column: col.name, count: emptyStrings, detail: `Empty string values in "${col.name}"` });
        } catch {}
      }

      // Header whitespace check
      for (const col of colInfos) {
        if (col.name !== col.name.trim()) {
          detectedPatterns.push({ label: "Header whitespace", column: col.name, count: 1, detail: `Column header "${col.name}" has leading/trailing whitespace` });
        }
      }
      setPatterns(detectedPatterns);

      // Max line length
      let maxLineLen = 0;
      try {
        const text = await f.slice(0, 100_000).text();
        const lines = text.split(/\r?\n/);
        maxLineLen = Math.max(...lines.map(l => l.length));
      } catch {}

      // Field count consistency
      let inconsistentRows = 0;
      try {
        const text = await f.slice(0, 500_000).text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 1) {
          const headerFields = lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).length;
          inconsistentRows = lines.slice(1).filter(l => l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).length !== headerFields).length;
        }
      } catch {}

      const warns: Warning[] = [];
      if (id.bom) warns.push({ level: "info", message: "File has BOM marker", detail: `${id.bom}. Some tools may show extra characters at the start.` });
      if (id.lineEndings.includes("Mixed")) warns.push({ level: "warning", message: "Mixed line endings detected", detail: "File contains both CRLF and LF. Consider standardizing." });
      if (duplicateRows > 0) warns.push({ level: "info", message: `${duplicateRows.toLocaleString()} duplicate rows (${((duplicateRows / info.rowCount) * 100).toFixed(1)}%)` });
      if (inconsistentRows > 0) warns.push({ level: "warning", message: `${inconsistentRows} rows have inconsistent field count`, detail: "Some rows have a different number of fields than the header." });
      if (maxLineLen > 10000) warns.push({ level: "info", message: `Max line length: ${maxLineLen.toLocaleString()} characters`, detail: "Very long lines may cause issues in some tools." });
      for (const col of colInfos) {
        if (col.name !== col.name.trim()) warns.push({ level: "warning", message: `Column "${col.name}" has whitespace in header` });
        if (info.rowCount > 0 && col.nulls / info.rowCount > 0.5) warns.push({ level: "warning", message: `"${col.name}" is >50% null (${col.nulls.toLocaleString()} nulls)` });
      }
      setWarnings(warns);
    } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); } finally { setLoading(false); }
  }

  function handleFile(f: File) {
    const stored = addFile(f);
    setStoredFileId(stored.id);
    processFile(f);
  }

  function handlePaste(text: string) {
    handleFile(new File([new Blob([text], { type: "text/csv" })], "pasted_data.csv", { type: "text/csv" }));
  }

  const typeGroups = columns.reduce((acc, c) => {
    const t = c.type.includes("INT") || c.type.includes("DOUBLE") || c.type.includes("FLOAT") || c.type.includes("DECIMAL") ? "Numeric"
      : c.type.includes("DATE") || c.type.includes("TIME") ? "Date/Time"
      : c.type.includes("BOOL") ? "Boolean" : "Text";
    acc[t] = (acc[t] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const done = file && identity && structure && !loading;

  return (
    <ToolPage icon={Search} title="CSV Inspector" description="Analyze CSV file encoding, structure, and data quality." metaDescription={getToolMetaDescription("csv-inspector")} seoContent={getToolSeo("csv-inspector")}>
      <DuckDBGate>
        <div className="space-y-6">
          {!file && !loading && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["file", "paste"] as const).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)} className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputMode === m ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {m === "file" ? "Upload File" : "Paste Data"}
                  </button>
                ))}
              </div>
              {inputMode === "file" ? (
                <div className="space-y-3">
                  <DropZone accept={[".csv", ".tsv", ".txt"]} onFile={handleFile} label="Drop a CSV or TSV file" />
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

          {loading && <LoadingState message="Analyzing file structure..." />}
          {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {done && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={structure.rowCount} columns={structure.columnCount} />
                <Button variant="outline" onClick={() => { setFile(null); setIdentity(null); setStructure(null); setColumns([]); setWarnings([]); setPreview(null); setPatterns([]); }}>New file</Button>
              </div>

              {/* File Identity */}
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">File Identity</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                  {[["File name", file.name], ["File size", formatBytes(file.size)], ["Encoding", identity.encoding], ["Line endings", identity.lineEndings], ["BOM present", identity.bom ? "Yes" : "No"], ["Character set", identity.charSet]].map(([k, v]) => (
                    <div key={k} className="bg-card px-4 py-3"><div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div><div className="text-sm font-medium font-mono">{v}</div></div>
                  ))}
                </div>
              </div>

              {/* CSV Structure */}
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">CSV Structure</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                  {[["Delimiter", structure.delimiter], ["Quote character", `${structure.quoteChar === '"' ? 'Double quote (")' : structure.quoteChar}`], ["Row count", structure.rowCount.toLocaleString()], ["Column count", String(structure.columnCount)], ["Duplicate rows", `${structure.duplicateRows.toLocaleString()} (${structure.rowCount > 0 ? ((structure.duplicateRows / structure.rowCount) * 100).toFixed(1) : 0}%)`]].map(([k, v]) => (
                    <div key={k} className="bg-card px-4 py-3"><div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div><div className="text-sm font-medium font-mono">{v}</div></div>
                  ))}
                </div>
              </div>

              {/* Column Overview */}
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Column Overview</span>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {Object.entries(typeGroups).map(([t, n]) => <span key={t}><span className="font-bold">{n}</span> {t}</span>)}
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border bg-muted/30">{["#", "Name", "Type", "Nulls", "Unique", "Sample"].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={col.name} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium">{col.name}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{col.type}</td>
                          <td className={`px-3 py-1.5 font-mono ${col.nulls > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{col.nulls.toLocaleString()}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{col.unique.toLocaleString()}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground max-w-[150px] truncate">{col.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Patterns */}
              {patterns.length > 0 && (
                <div className="border-2 border-border">
                  <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Patterns ({patterns.length})</div>
                  <div className="overflow-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border bg-muted/30">{["Pattern", "Column", "Count", "Detail"].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>)}</tr></thead>
                      <tbody>
                        {patterns.map((p, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-3 py-1.5 font-medium">{p.label}</td>
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{p.column}</td>
                            <td className="px-3 py-1.5 font-mono text-amber-500">{p.count.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{p.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="border-2 border-border">
                  <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Issues Found ({warnings.length})</div>
                  <div className="divide-y divide-border/50">
                    {warnings.map((w, i) => (
                      <ExpandableWarning key={i} w={w} />
                    ))}
                  </div>
                </div>
              )}
              {warnings.length === 0 && patterns.length === 0 && (
                <div className="border-2 border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary font-medium">✓ No issues detected</div>
              )}

              {/* Data Preview */}
              {preview && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Preview (first 50 rows)</h3>
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[400px]" maxRows={50} />
                </div>
              )}

              {/* Actions */}
              <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} />
            </div>
          )}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
