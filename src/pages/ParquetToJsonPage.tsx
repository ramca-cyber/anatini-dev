import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Braces, ArrowRightLeft, Download, Copy, Check } from "lucide-react";
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
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
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
        output = objects.map((o) => JSON.stringify(o)).join("\n") + "\n";
      } else {
        output = pretty ? JSON.stringify(objects, null, 2) : JSON.stringify(objects);
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="parquet" />}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleConvert} disabled={loading}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> {result ? "Re-convert" : "Convert to JSON"}
                </Button>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>
            </div>

            {/* Format options */}
            <div className="border border-border p-3 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold">Output Format</label>
                <ToggleButton
                  options={[{ label: "JSON Array", value: "array" }, { label: "NDJSON", value: "ndjson" }]}
                  value={format}
                  onChange={setFormat}
                  className="mt-1"
                />
              </div>
              {format === "array" && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-primary" />
                  Pretty-print output
                </label>
              )}
            </div>

            {/* Input data */}
            {preview && (
              <div className="space-y-2">
                <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                <p className="text-xs text-muted-foreground">· Input is binary Parquet — showing first 100 rows</p>
              </div>
            )}

            {/* OUTPUT SECTION */}
            {result && jsonOutput && (
              <div className="space-y-3 border-t-2 border-border pt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDownloadJson}>
                      <Download className="h-4 w-4 mr-1" /> Download {format === "ndjson" ? "JSONL" : "JSON"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Compact conversion stats */}
                <div className="flex items-center gap-4 flex-wrap border border-border bg-muted/30 px-4 py-2 text-xs">
                  <span><span className="text-muted-foreground">Time:</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                  <span><span className="text-muted-foreground">Output:</span> <span className="font-bold">{formatBytes(result.outputSize)}</span></span>
                  <span><span className="text-muted-foreground">Change:</span> <span className="font-bold">{file.size > 0 ? `${Math.round((result.outputSize / file.size - 1) * 100)}% ${result.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                </div>

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
              </div>
            )}

            <div className="border border-border p-4 space-y-4">
              <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} excludeRoute="/parquet-to-json" heading={result ? "Source file" : undefined} inline />
              {result && (
                <CrossToolLinks format="json" excludeRoute="/parquet-to-json" heading="Converted output" inline />
              )}
            </div>
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
