import { useState, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileSpreadsheet, ArrowRightLeft, Download, Copy, Check, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
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
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
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
  const [showInputPreview, setShowInputPreview] = useState(true);
  const [showOutputPreview, setShowOutputPreview] = useState(false);

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
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

  useEffect(() => {
    if (meta && file && !conversionResult) {
      handleConvert();
    }
  }, [meta]);

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

  const fileInfoExtras = parquetInfo ? [
    { label: "Row groups", value: parquetInfo.rowGroups },
    { label: "Compression", value: parquetInfo.compression },
  ] : undefined;

  return (
    <ToolPage icon={FileSpreadsheet} title="Parquet to CSV" description="Export Parquet files to CSV format." pageTitle="Parquet to CSV — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("parquet-to-csv")} seoContent={getToolSeo("parquet-to-csv")}>
      <DuckDBGate>
      <div className="space-y-4">
        {!file && (
          <div className="space-y-4">
            <ToggleButton
              options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
              value={inputMode}
              onChange={setInputMode}
            />
            {inputMode === "file" ? (
              <DropZone
                accept={[".parquet"]}
                onFile={handleFile}
                label="Drop a Parquet file"
                sampleAction={{ label: "⚗ Try with sample data", onClick: async () => { if (db) { const f = await generateSampleParquet(db); handleFile(f); } } }}
              />
            ) : (
              <UrlInput onFile={handleFile} accept={[".parquet"]} placeholder="https://example.com/data.parquet" label="Load Parquet from URL" />
            )}
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            {/* 1. File info bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} extras={fileInfoExtras} />
                {storedFileId && <InspectLink fileId={storedFileId} format="parquet" />}
              </div>
              <Button variant="outline" onClick={resetAll}>New file</Button>
            </div>

            {/* 2. Options + Convert row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Delimiter</label>
                  <ToggleButton options={DELIMITERS} value={delimiter} onChange={setDelimiter} />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} className="rounded" />
                  <span className="font-bold">Include header</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Null as</label>
                  <select value={nullRepr} onChange={(e) => setNullRepr(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                    {NULL_REPRS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={handleConvert} disabled={loading}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Convert to CSV
              </Button>
            </div>

            {/* 3. OUTPUT section (primary) */}
            {conversionResult && csvOutput && (
              <div className="space-y-3 border-2 border-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>

                <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span><span className="text-muted-foreground">Converted in</span> <span className="font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{formatBytes(conversionResult.outputSize)}</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                </div>

                <Button onClick={handleDownloadCsv} className="w-full" size="lg">
                  <Download className="h-5 w-5 mr-2" /> Download CSV
                </Button>

                <Button variant="outline" onClick={handleCopy} className="w-full">
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy to clipboard"}
                </Button>

                <Collapsible open={showOutputPreview} onOpenChange={setShowOutputPreview}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                    {showOutputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span className="text-xs font-bold uppercase tracking-widest">Preview output data</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <ToggleButton
                      options={[{ label: "Table View", value: "table" }, { label: "Raw Output", value: "raw" }]}
                      value={outputView}
                      onChange={setOutputView}
                    />
                    {outputView === "table" && outputPreview && (
                      <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                    )}
                    {outputView === "raw" && (
                      <RawPreview content={csvOutput} label="Raw CSV Output" fileName="output.csv" />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* 4. INPUT PREVIEW section (secondary, collapsible) */}
            <Collapsible open={showInputPreview} onOpenChange={setShowInputPreview}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {showInputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <h3 className="text-xs font-bold uppercase tracking-widest">Input Preview</h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {preview && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                <p className="text-xs text-muted-foreground">· Input is binary Parquet — showing first 100 rows</p>
              </CollapsibleContent>
            </Collapsible>

            {/* 5. CrossToolLinks */}
            <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} excludeRoute="/parquet-to-csv" />
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <ErrorAlert message={error} />}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
