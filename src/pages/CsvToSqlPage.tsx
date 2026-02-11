import { useState, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Database, ArrowRightLeft, Download, Copy, Check } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { RawPreview } from "@/components/shared/RawPreview";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

type Dialect = "postgresql" | "mysql" | "sqlite" | "bigquery" | "sqlserver" | "duckdb";

const TYPE_MAP: Record<Dialect, Record<string, string>> = {
  postgresql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE PRECISION", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP" },
  mysql: { VARCHAR: "VARCHAR(255)", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "DOUBLE", BOOLEAN: "TINYINT(1)", DATE: "DATE", TIMESTAMP: "DATETIME" },
  sqlite: { VARCHAR: "TEXT", BIGINT: "INTEGER", INTEGER: "INTEGER", DOUBLE: "REAL", BOOLEAN: "INTEGER", DATE: "TEXT", TIMESTAMP: "TEXT" },
  bigquery: { VARCHAR: "STRING", BIGINT: "INT64", INTEGER: "INT64", DOUBLE: "FLOAT64", BOOLEAN: "BOOL", DATE: "DATE", TIMESTAMP: "TIMESTAMP" },
  sqlserver: { VARCHAR: "NVARCHAR(MAX)", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "FLOAT", BOOLEAN: "BIT", DATE: "DATE", TIMESTAMP: "DATETIME2" },
  duckdb: { VARCHAR: "VARCHAR", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP" },
};

const ALL_SQL_TYPES: Record<Dialect, string[]> = {
  postgresql: ["TEXT", "INTEGER", "BIGINT", "DOUBLE PRECISION", "BOOLEAN", "DATE", "TIMESTAMP", "NUMERIC", "SERIAL", "UUID", "JSONB", "VARCHAR(255)"],
  mysql: ["VARCHAR(255)", "INT", "BIGINT", "DOUBLE", "TINYINT(1)", "DATE", "DATETIME", "TEXT", "DECIMAL(10,2)", "ENUM", "JSON"],
  sqlite: ["TEXT", "INTEGER", "REAL", "BLOB", "NUMERIC"],
  bigquery: ["STRING", "INT64", "FLOAT64", "BOOL", "DATE", "TIMESTAMP", "BYTES", "NUMERIC", "JSON"],
  sqlserver: ["NVARCHAR(MAX)", "INT", "BIGINT", "FLOAT", "BIT", "DATE", "DATETIME2", "VARCHAR(255)", "DECIMAL(10,2)", "UNIQUEIDENTIFIER"],
  duckdb: ["VARCHAR", "INTEGER", "BIGINT", "DOUBLE", "BOOLEAN", "DATE", "TIMESTAMP", "HUGEINT", "BLOB", "UUID"],
};

function mapType(duckType: string, dialect: Dialect): string {
  const upper = duckType.toUpperCase();
  for (const [key, val] of Object.entries(TYPE_MAP[dialect])) {
    if (upper.includes(key)) return val;
  }
  return TYPE_MAP[dialect].VARCHAR || "TEXT";
}

interface ColumnSchema {
  name: string;
  originalType: string;
  mappedType: string;
  nullable: boolean;
}

export default function CsvToSqlPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [output, setOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputView, setInputView] = useState<"table" | "raw-input">("table");
  const [inputMode, setInputMode] = useState<"file" | "paste" | "url">("file");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [batchSize, setBatchSize] = useState(100);
  const [includeDropTable, setIncludeDropTable] = useState(false);
  const [tableName, setTableName] = useState("my_table");
  const [schemaName, setSchemaName] = useState("");
  const [quotedIdentifiers, setQuotedIdentifiers] = useState(false);
  const [columnSchema, setColumnSchema] = useState<ColumnSchema[]>([]);
  const [copied, setCopied] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  function buildQualifiedName() {
    const q = quotedIdentifiers ? '"' : '';
    const tn = `${q}${tableName}${q}`;
    return schemaName ? `${q}${schemaName}${q}.${tn}` : tn;
  }

  function quoteCol(col: string) {
    return quotedIdentifiers ? `"${col}"` : col;
  }

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setOutput("");
    setRawInput(null);
    setPreview(null);
    setInputView("table");
    setConversionResult(null);
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);

      const previewRes = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setPreview(previewRes);

      const schema = info.columns.map((col, i) => ({
        name: col,
        originalType: info.types[i],
        mappedType: mapType(info.types[i], dialect),
        nullable: true,
      }));

      for (let ci = 0; ci < info.columns.length; ci++) {
        try {
          const nullRes = await runQuery(db, `SELECT COUNT(*) - COUNT("${info.columns[ci]}") FROM "${tName}"`);
          const nullCount = Number(nullRes.rows[0]?.[0] ?? 0);
          if (nullCount === 0) schema[ci].nullable = false;
        } catch {}
      }

      setColumnSchema(schema);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  useEffect(() => {
    if (meta && file && !conversionResult) {
      handleConvert();
    }
  }, [meta]);

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "text/csv" });
    const f = new File([blob], "pasted_data.csv", { type: "text/csv" });
    handleFile(f);
  }

  function updateColumnType(index: number, newType: string) {
    setColumnSchema(prev => prev.map((c, i) => i === index ? { ...c, mappedType: newType } : c));
  }

  function updateColumnNullable(index: number, nullable: boolean) {
    setColumnSchema(prev => prev.map((c, i) => i === index ? { ...c, nullable } : c));
  }

  async function handleConvert() {
    if (!db || !file) return;
    const m = meta;
    const cs = columnSchema;
    if (!m || cs.length === 0) return;
    setLoading(true);
    setConversionResult(null);
    const start = performance.now();
    try {
      const tn = sanitizeTableName(file.name);
      const result = await runQuery(db, `SELECT * FROM "${tn}"`);
      const lines: string[] = [];
      const fqn = buildQualifiedName();
      if (includeDropTable) { lines.push(`DROP TABLE IF EXISTS ${fqn};`); lines.push(""); }
      const colDefs = cs.map(c => `  ${quoteCol(c.name)} ${c.mappedType}${!c.nullable ? " NOT NULL" : ""}`);
      lines.push(`CREATE TABLE ${fqn} (`);
      lines.push(colDefs.join(",\n"));
      lines.push(`);`);
      lines.push("");
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        lines.push(`INSERT INTO ${fqn} (${m.columns.map(c => quoteCol(c)).join(", ")}) VALUES`);
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
      const sql = lines.join("\n");
      setOutput(sql);
      const outputSize = new Blob([sql]).size;
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDialectChange(d: Dialect) {
    setDialect(d);
    setColumnSchema(prev => prev.map(c => ({ ...c, mappedType: mapType(c.originalType, d) })));
  }

  function handleDownload() {
    downloadBlob(output, `${tableName}.sql`, "text/sql");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function resetAll() {
    setFile(null); setMeta(null); setOutput(""); setRawInput(null);
    setColumnSchema([]); setPreview(null); setConversionResult(null);
    setStoredFileId(null);
  }

  const dialects: { id: Dialect; label: string }[] = [
    { id: "postgresql", label: "PostgreSQL" },
    { id: "mysql", label: "MySQL" },
    { id: "sqlite", label: "SQLite" },
    { id: "bigquery", label: "BigQuery" },
    { id: "sqlserver", label: "SQL Server" },
    { id: "duckdb", label: "DuckDB" },
  ];

  return (
    <ToolPage icon={Database} title="CSV to SQL" description="Generate CREATE TABLE and INSERT statements from CSV data." metaDescription={getToolMetaDescription("csv-to-sql")} seoContent={getToolSeo("csv-to-sql")}>
      <DuckDBGate>
        <div className="space-y-4">
          {!file && (
            <div className="space-y-4">
              <ToggleButton
                options={[{ label: "Upload File", value: "file" }, { label: "Paste Data", value: "paste" }, { label: "From URL", value: "url" }]}
                value={inputMode}
                onChange={setInputMode}
              />
              {inputMode === "file" ? (
                <DropZone
                  accept={[".csv", ".tsv"]}
                  onFile={handleFile}
                  label="Drop a CSV file"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
              ) : inputMode === "paste" ? (
                <PasteInput onSubmit={handlePaste} placeholder="Paste CSV data here..." label="Paste CSV data" accept={[".csv", ".tsv"]} onFile={handleFile} />
              ) : (
                <UrlInput onFile={handleFile} accept={[".csv", ".tsv"]} placeholder="https://example.com/data.csv" label="Load CSV from URL" />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format="csv" />}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConvert} disabled={loading}>
                    <ArrowRightLeft className="h-4 w-4 mr-1" /> {output ? "Re-convert" : "Convert to SQL"}
                  </Button>
                  <Button variant="outline" onClick={resetAll}>New file</Button>
                </div>
              </div>

              {/* Options panel */}
              <div className="border border-border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Dialect</label>
                    <ToggleButton
                      options={dialects.map(d => ({ label: d.label, value: d.id }))}
                      value={dialect}
                      onChange={handleDialectChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Table name</label>
                    <input value={tableName} onChange={(e) => setTableName(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Schema</label>
                    <input value={schemaName} onChange={(e) => setSchemaName(e.target.value)} placeholder="(none)" className="border border-border bg-background px-2 py-1 text-xs w-24" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Batch size</label>
                    <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value={50}>50</option><option value={100}>100</option><option value={500}>500</option><option value={1000}>1000</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={includeDropTable} onChange={(e) => setIncludeDropTable(e.target.checked)} />
                    Include DROP TABLE IF EXISTS
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={quotedIdentifiers} onChange={(e) => setQuotedIdentifiers(e.target.checked)} />
                    Quoted identifiers
                  </label>
                </div>
              </div>

              {/* Schema editor */}
              <div className="border border-border">
                <div className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Schema Editor — click types to change
                </div>
                <div className="divide-y divide-border/50">
                  {columnSchema.map((col, i) => (
                    <div key={col.name} className="flex items-center gap-3 px-3 py-2 text-xs">
                      <span className="font-medium w-40 truncate" title={col.name}>{col.name}</span>
                      <select
                        value={col.mappedType}
                        onChange={(e) => updateColumnType(i, e.target.value)}
                        className="border border-border bg-background px-2 py-1 text-xs font-mono flex-1 max-w-[200px]"
                      >
                        {ALL_SQL_TYPES[dialect].map(t => <option key={t} value={t}>{t}</option>)}
                        {!ALL_SQL_TYPES[dialect].includes(col.mappedType) && <option value={col.mappedType}>{col.mappedType}</option>}
                      </select>
                      <label className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                        <input type="checkbox" checked={!col.nullable} onChange={(e) => updateColumnNullable(i, !e.target.checked)} />
                        NOT NULL
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* INPUT SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
                  <ToggleButton
                    options={[{ label: "Table View", value: "table" }, { label: "Raw Input", value: "raw-input" }]}
                    value={inputView}
                    onChange={setInputView}
                  />
                </div>

                {preview && inputView === "table" && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                {inputView === "raw-input" && (
                  <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                )}
              </div>

              {/* OUTPUT SECTION */}
              {output && conversionResult && (
                <div className="space-y-3 border-t-2 border-border pt-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" /> Download SQL
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/30 px-4 py-2 flex items-center gap-6 flex-wrap">
                    <span className="text-xs"><span className="text-muted-foreground">Time:</span> <span className="font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</span></span>
                    <span className="text-xs"><span className="text-muted-foreground">Output:</span> <span className="font-bold">{formatBytes(conversionResult.outputSize)}</span></span>
                    <span className="text-xs"><span className="text-muted-foreground">Change:</span> <span className="font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                  </div>

                  <RawPreview content={output} label="Raw Output" fileName={`${tableName}.sql`} onDownload={handleDownload} />
                </div>
              )}

              <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} excludeRoute="/csv-to-sql" />
            </div>
          )}

          {loading && <LoadingState message="Generating SQL..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}