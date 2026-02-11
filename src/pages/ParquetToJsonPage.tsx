import { useState, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Braces, ArrowRightLeft, Download, Copy, Check, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile, bigIntReplacer } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

export default function ParquetToJsonPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [format, setFormat] = useState<"array" | "ndjson">("array");
  const [pretty, setPretty] = useState(true);
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
    setJsonOutput(null);
    setResult(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const res = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  useEffect(() => {
    if (meta && file && !result) {
      handleConvert();
    }
  }, [meta]);

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setResult(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const res = await runQuery(db, `SELECT * FROM "${tableName}"`);
      const objects = res.rows.map((row) => {
        const obj: Record<string, any> = {};
        res.columns.forEach((col, i) => (obj[col] = row[i]));
        return obj;
      });
      let output: string;
      if (format === "ndjson") {
        output = objects.map((o) => JSON.stringify(o, bigIntReplacer)).join("\n") + "\n";
      } else {
        output = pretty ? JSON.stringify(objects, bigIntReplacer, 2) : JSON.stringify(objects, bigIntReplacer);
      }
      setJsonOutput(output);
      const outputSize = new Blob([output]).size;
      const durationMs = Math.round(performance.now() - start);
      setResult({ durationMs, outputSize });
      const outPreview = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setOutputPreview(outPreview);
      setOutputView("table");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadJson() {
    if (!jsonOutput || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = format === "ndjson" ? "jsonl" : "json";
    downloadBlob(jsonOutput, `${baseName}.${ext}`, "application/json");
  }

  async function handleCopy() {
    if (!jsonOutput) return;
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function resetAll() {
    setFile(null); setMeta(null); setPreview(null);
    setJsonOutput(null); setResult(null); setStoredFileId(null);
  }

  return (
    <ToolPage icon={Braces} title="Parquet to JSON" description="Export Parquet files to JSON or NDJSON format." pageTitle="Parquet to JSON — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("parquet-to-json")} seoContent={getToolSeo("parquet-to-json")}>
      <DuckDBGate>
      <div className="relative space-y-4">
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
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="parquet" />}
              </div>
              <Button variant="outline" onClick={resetAll}>New file</Button>
            </div>

            {/* 2. Options + Convert row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Format</label>
                  <ToggleButton
                    options={[{ label: "JSON Array", value: "array" }, { label: "NDJSON", value: "ndjson" }]}
                    value={format}
                    onChange={setFormat}
                  />
                </div>
                {format === "array" && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-primary" />
                    Pretty-print
                  </label>
                )}
              </div>
              <Button onClick={handleConvert} disabled={loading}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Convert to JSON
              </Button>
            </div>

            {/* 3. OUTPUT section (primary) */}
            {result && jsonOutput && (
              <div className="space-y-3 border-2 border-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>

                <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span><span className="text-muted-foreground">Converted in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{formatBytes(result.outputSize)}</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{file.size > 0 ? `${Math.round((result.outputSize / file.size - 1) * 100)}% ${result.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                </div>

                <Button onClick={handleDownloadJson} className="w-full" size="lg">
                  <Download className="h-5 w-5 mr-2" /> Download {format === "ndjson" ? "JSONL" : "JSON"}
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
                      <RawPreview content={jsonOutput} label="Raw JSON Output" fileName={`output.${format === "ndjson" ? "jsonl" : "json"}`} />
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
            <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} excludeRoute="/parquet-to-json" />
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <ErrorAlert message={error} />}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
