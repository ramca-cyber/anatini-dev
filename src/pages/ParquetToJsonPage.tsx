import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Braces, ArrowRightLeft, FlaskConical, Download, Copy, Check } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

export default function ParquetToJsonPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [format, setFormat] = useState<"array" | "ndjson">("array");
  const [pretty, setPretty] = useState(true);
  const [copied, setCopied] = useState(false);

  async function handleFile(f: File) {
    if (!db) return;
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
    setJsonOutput(null); setResult(null);
  }

  return (
    <ToolPage icon={Braces} title="Parquet to JSON" description="Export Parquet files to JSON or NDJSON format." pageTitle="Parquet to JSON — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("parquet-to-json")} seoContent={getToolSeo("parquet-to-json")}>
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
            {/* File info + actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
              <div className="flex items-center gap-2">
                <Button onClick={handleConvert} disabled={loading}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> {result ? "Re-convert" : "Convert to JSON"}
                </Button>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>
            </div>

            {/* Format options */}
            <div className="border-2 border-border p-3 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold">Output Format</label>
                <div className="flex gap-1 mt-1">
                  {([["array", "JSON Array"], ["ndjson", "NDJSON"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setFormat(val)}
                      className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${format === val ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {format === "array" && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-primary" />
                  Pretty-print output
                </label>
              )}
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
            {result && jsonOutput && (
              <div className="space-y-3 border-t-2 border-border pt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
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

                <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                  <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(result.durationMs / 1000).toFixed(1)}s</div></div>
                  <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(result.outputSize)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Size change</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((result.outputSize / file.size - 1) * 100)}% ${result.outputSize > file.size ? "larger" : "smaller"}` : "—"}</div></div>
                </div>

                <RawPreview content={jsonOutput} label="Raw JSON Output" fileName={`output.${format === "ndjson" ? "jsonl" : "json"}`} />
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
    </ToolPage>
  );
}
