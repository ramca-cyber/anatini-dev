import { useState } from "react";
import { getToolSeo } from "@/lib/seo-content";
import { Braces, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, exportToParquet, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";

export default function JsonToParquetPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [view, setView] = useState<"schema" | "raw-input">("schema");
  const [compression, setCompression] = useState<"snappy" | "zstd" | "none">("snappy");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    setRawInput(null);
    setView("schema");
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
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
      const buf = await exportToParquet(db, tableName);
      const durationMs = Math.round(performance.now() - start);
      setResult({ durationMs, outputSize: buf.byteLength });
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(buf, `${baseName}.parquet`, "application/octet-stream");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSample() {
    const sample = JSON.stringify([
      { id: 1, name: "Alice", email: "alice@example.com", score: 95.5, active: true },
      { id: 2, name: "Bob", email: "bob@example.com", score: 87.3, active: false },
      { id: 3, name: "Charlie", email: "charlie@example.com", score: 92.1, active: true },
    ]);
    const blob = new Blob([sample], { type: "application/json" });
    handleFile(new File([blob], "sample.json", { type: "application/json" }));
  }

  return (
    <ToolPage icon={Braces} title="JSON to Parquet" description="Convert JSON files to Parquet with compression options." seoContent={getToolSeo("json-to-parquet")}>
      <div className="space-y-4">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".json", ".jsonl"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSample}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            {/* Row 1: File info + actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
              <div className="flex gap-2">
                <Button onClick={handleConvert} disabled={loading}>Convert to Parquet</Button>
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setResult(null); setRawInput(null); }}>New file</Button>
              </div>
            </div>

            {/* Row 2: Compression options */}
            <div className="border-2 border-border p-3">
              <label className="text-xs text-muted-foreground font-bold">Compression</label>
              <div className="flex gap-1 mt-1">
                {(["snappy", "zstd", "none"] as const).map((c) => (
                  <button key={c} onClick={() => setCompression(c)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${compression === c ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: View toggle */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {([["schema", "Schema"], ["raw-input", "Raw Input"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${view === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">· Output is binary Parquet</span>
            </div>

            {/* Conversion result */}
            {result && (
              <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(result.durationMs / 1000).toFixed(1)}s</div></div>
                <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(result.outputSize)}</div></div>
                <div><div className="text-xs text-muted-foreground">Compression ratio</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((1 - result.outputSize / file.size) * 100)}%` : "—"} smaller</div></div>
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {/* Row 4: Content */}
        {meta && view === "schema" && file && (
          <div className="border-2 border-border">
            <div className="border-b-2 border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Schema</div>
            <div className="divide-y divide-border">
              {meta.columns.map((col, i) => (
                <div key={col} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="font-medium">{col}</span>
                  <span className="font-mono text-muted-foreground">{meta.types[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === "raw-input" && (
          <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
        )}
      </div>
    </ToolPage>
  );
}
