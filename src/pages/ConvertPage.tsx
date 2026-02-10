import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileSpreadsheet, Download, ArrowRightLeft, FlaskConical, Settings2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, exportToParquet, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

export default function ConvertPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [showOptions, setShowOptions] = useState(false);
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [compression, setCompression] = useState<"snappy" | "zstd" | "none">("snappy");

  // Conversion result
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [outputBlob, setOutputBlob] = useState<{ data: Uint8Array | string; name: string; mime: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const inputExt = file?.name.split(".").pop()?.toLowerCase();
  const outputFormat = inputExt === "parquet" ? "CSV" : "Parquet";
  const isBinaryOutput = outputFormat === "Parquet";

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setConversionResult(null);
    setOutputBlob(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setConversionResult(null);
    setOutputBlob(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      let outputSize = 0;
      if (outputFormat === "CSV") {
        const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
        outputSize = new Blob([csv]).size;
        setOutputBlob({ data: csv, name: `${baseName}.csv`, mime: "text/csv" });
      } else {
        const buf = await exportToParquet(db, tableName);
        outputSize = buf.byteLength;
        setOutputBlob({ data: buf, name: `${baseName}.parquet`, mime: "application/octet-stream" });
      }
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!outputBlob) return;
    downloadBlob(outputBlob.data, outputBlob.name, outputBlob.mime);
  }

  async function handleCopy() {
    if (!outputBlob || typeof outputBlob.data !== "string") return;
    await navigator.clipboard.writeText(outputBlob.data);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function resetAll() {
    setFile(null); setMeta(null); setPreview(null);
    setConversionResult(null); setOutputBlob(null);
  }

  return (
    <ToolPage
      icon={FileSpreadsheet}
      title="CSV ↔ Parquet Converter"
      description="Convert between CSV and Parquet with type preservation and compression."
      pageTitle="Convert CSV to Parquet Online — Free, Offline | Anatini.dev"
      metaDescription={getToolMetaDescription("csv-to-parquet")}
      seoContent={getToolSeo("csv-to-parquet")}
    >
      <DuckDBGate>
      <div className="space-y-4">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".csv", ".parquet"]} onFile={handleFile} label="Drop a CSV or Parquet file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleCSV())}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
              <div className="flex items-center gap-2">
                <Button onClick={handleConvert} disabled={loading}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  {conversionResult ? "Re-convert" : `Convert to ${outputFormat}`}
                </Button>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>
            </div>

            {/* Options panel */}
            <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-4 w-4" /> Conversion Options
              {showOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showOptions && (
              <div className="border-2 border-border p-4 space-y-4">
                {inputExt === "csv" && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-bold">Delimiter</label>
                      <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className="border-2 border-border bg-background px-2 py-1 text-xs">
                        <option value=",">Comma (,)</option>
                        <option value="\t">Tab</option>
                        <option value=";">Semicolon (;)</option>
                        <option value="|">Pipe (|)</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
                      First row is header
                    </label>
                  </div>
                )}
                {outputFormat === "Parquet" && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Parquet Compression</label>
                    <div className="flex gap-1">
                      {(["snappy", "zstd", "none"] as const).map((c) => (
                        <button key={c} onClick={() => setCompression(c)}
                          className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${compression === c ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INPUT SECTION */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
              {preview && (
                <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
              )}
            </div>

            {/* OUTPUT SECTION */}
            {conversionResult && (
              <div className="space-y-3 border-t-2 border-border pt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" /> Download {outputFormat}
                    </Button>
                    {!isBinaryOutput && (
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                  <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</div></div>
                  <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(conversionResult.outputSize)}</div></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Size change</div>
                    <div className="text-lg font-bold">
                      {file.size > 0
                        ? `${Math.round((1 - conversionResult.outputSize / file.size) * 100)}% ${conversionResult.outputSize < file.size ? "smaller" : "larger"}`
                        : "—"}
                    </div>
                  </div>
                </div>

                {isBinaryOutput ? (
                  <RawPreview content={null} label="Raw Output" binary />
                ) : (
                  <RawPreview
                    content={typeof outputBlob?.data === "string" ? outputBlob.data : null}
                    label="Raw Output"
                    fileName={outputBlob?.name}
                    onDownload={handleDownload}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
