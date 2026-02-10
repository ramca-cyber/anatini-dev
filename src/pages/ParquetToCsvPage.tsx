import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileSpreadsheet, ArrowRightLeft, FlaskConical, Copy, Check, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

const DELIMITERS = [
  { label: "Comma", value: "," },
  { label: "Tab", value: "\t" },
  { label: "Semicolon", value: ";" },
  { label: "Pipe", value: "|" },
];

const NULL_REPRS = [
  { label: "(empty)", value: "" },
  { label: "NULL", value: "NULL" },
  { label: "null", value: "null" },
  { label: "NA", value: "NA" },
  { label: "N/A", value: "N/A" },
];

export default function ParquetToCsvPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [csvOutput, setCsvOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [nullRepr, setNullRepr] = useState("");
  const [parquetInfo, setParquetInfo] = useState<{ rowGroups: number; compression: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputView, setOutputView] = useState<"table" | "raw">("table");
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setCsvOutput(null);
    setConversionResult(null);
    setParquetInfo(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(result);
      try {
        const metaRes = await runQuery(db, `SELECT COUNT(DISTINCT row_group_id) as rg, MAX(compression)::VARCHAR as comp FROM parquet_metadata('${f.name}')`);
        if (metaRes.rows[0]) {
          setParquetInfo({ rowGroups: Number(metaRes.rows[0][0]), compression: String(metaRes.rows[0][1] ?? "unknown") });
        }
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setConversionResult(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`, { delimiter, header: includeHeader, nullValue: nullRepr });
      setCsvOutput(csv);
      const outputSize = new Blob([csv]).size;
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
      const outPreview = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setOutputPreview(outPreview);
      setOutputView("table");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadCsv() {
    if (!csvOutput || !file) return;
    downloadBlob(csvOutput, `${file.name.replace(/\.[^.]+$/, "")}.csv`, "text/csv");
  }

  async function handleCopy() {
    if (!csvOutput) return;
    await navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function resetAll() {
    setFile(null); setMeta(null); setPreview(null); setCsvOutput(null);
    setConversionResult(null); setParquetInfo(null); setStoredFileId(null);
  }

  return (
    <ToolPage icon={FileSpreadsheet} title="Parquet to CSV" description="Export Parquet files to CSV format." pageTitle="Parquet to CSV — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("parquet-to-csv")} seoContent={getToolSeo("parquet-to-csv")}>
      <DuckDBGate>
      <div className="space-y-4">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".parquet"]} onFile={handleFile} label="Drop a Parquet file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={async () => { if (db) { const f = await generateSampleParquet(db); handleFile(f); } }}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="parquet" />}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleConvert} disabled={loading}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> {conversionResult ? "Re-convert" : "Convert to CSV"}
                </Button>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>
            </div>

            {parquetInfo && (
              <div className="border-2 border-border p-3 flex flex-wrap gap-6 text-xs">
                <div><span className="text-muted-foreground font-bold">Row Groups:</span> <span className="font-mono">{parquetInfo.rowGroups}</span></div>
                <div><span className="text-muted-foreground font-bold">Compression:</span> <span className="font-mono">{parquetInfo.compression}</span></div>
              </div>
            )}

            {/* Options */}
            <div className="border-2 border-border p-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-bold">Delimiter:</label>
                <div className="flex gap-1">
                  {DELIMITERS.map((d) => (
                    <button key={d.value} onClick={() => setDelimiter(d.value)}
                      className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${delimiter === d.value ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} className="rounded" />
                <span className="font-bold">Include header</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-bold">Null as:</label>
                <select value={nullRepr} onChange={(e) => setNullRepr(e.target.value)} className="border-2 border-border bg-background px-2 py-1 text-xs">
                  {NULL_REPRS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>

            {/* INPUT SECTION */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
              {preview && (
                <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
              )}
              <p className="text-xs text-muted-foreground">· Input is binary Parquet — showing first 100 rows</p>
            </div>

            {/* OUTPUT SECTION */}
            {conversionResult && csvOutput && (
              <div className="space-y-3 border-t-2 border-border pt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDownloadCsv}>
                      <Download className="h-4 w-4 mr-1" /> Download CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                  <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</div></div>
                  <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(conversionResult.outputSize)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Size change</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</div></div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {([["table", "Table View"], ["raw", "Raw Output"]] as ["table" | "raw", string][]).map(([v, label]) => (
                      <button key={v} onClick={() => setOutputView(v)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputView === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {outputView === "table" && outputPreview && (
                  <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                )}
                {outputView === "raw" && (
                  <RawPreview content={csvOutput} label="Raw CSV Output" fileName="output.csv" />
                )}
              </div>
            )}

            <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} />
            {conversionResult && <CrossToolLinks format="csv" />}
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}