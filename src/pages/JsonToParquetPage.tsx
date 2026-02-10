import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Braces, FlaskConical, Download, ArrowRightLeft } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToParquet, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";

interface ParquetMeta {
  rowGroups: number;
  totalCompressed: number;
  totalUncompressed: number;
}

export default function JsonToParquetPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [inputView, setInputView] = useState<"data" | "schema" | "raw-input">("data");
  const [outputView, setOutputView] = useState<"preview" | "raw">("preview");
  const [compression, setCompression] = useState<"snappy" | "zstd" | "gzip" | "none">("snappy");
  const [rowGroupSize, setRowGroupSize] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [nullableInfo, setNullableInfo] = useState<boolean[]>([]);
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [parquetMeta, setParquetMeta] = useState<ParquetMeta | null>(null);
  const [outputBuf, setOutputBuf] = useState<Uint8Array | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    setRawInput(null);
    setPreview(null);
    setInputView("data");
    setNullableInfo([]);
    setOutputPreview(null);
    setParquetMeta(null);
    setOutputBuf(null);
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const dataPreview = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 50`);
      setPreview(dataPreview);
      const checks: boolean[] = [];
      for (const col of info.columns) {
        try {
          const r = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" IS NULL`);
          checks.push(Number(r.rows[0][0]) > 0);
        } catch { checks.push(true); }
      }
      setNullableInfo(checks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "application/json" });
    const f = new File([blob], "pasted_data.json", { type: "application/json" });
    handleFile(f);
  }

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setResult(null);
    setOutputPreview(null);
    setParquetMeta(null);
    setOutputBuf(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const buf = await exportToParquet(db, tableName, { compression, rowGroupSize });
      const durationMs = Math.round(performance.now() - start);
      setResult({ durationMs, outputSize: buf.byteLength });
      setOutputBuf(buf);
      setOutputView("preview");

      const outName = `${tableName}_export.parquet`;
      try {
        const outData = await runQuery(db, `SELECT * FROM read_parquet('${outName}') LIMIT 100`);
        setOutputPreview(outData);
        const metaResult = await runQuery(db, `SELECT * FROM parquet_metadata('${outName}')`);
        const rowGroups = metaResult.rowCount;
        let totalCompressed = 0;
        let totalUncompressed = 0;
        const compressedIdx = metaResult.columns.indexOf("total_compressed_size");
        const uncompressedIdx = metaResult.columns.indexOf("total_uncompressed_size");
        if (compressedIdx >= 0 && uncompressedIdx >= 0) {
          for (const row of metaResult.rows) {
            totalCompressed += Number(row[compressedIdx] ?? 0);
            totalUncompressed += Number(row[uncompressedIdx] ?? 0);
          }
        }
        setParquetMeta({ rowGroups, totalCompressed, totalUncompressed });
      } catch {}
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

  function handleDownload() {
    if (!outputBuf || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(outputBuf, `${baseName}.parquet`, "application/octet-stream");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setRawInput(null);
    setPreview(null); setNullableInfo([]); setOutputPreview(null);
    setParquetMeta(null); setOutputBuf(null);
  }

  const inputTabs: ["data" | "schema" | "raw-input", string][] = [
    ["data", "Data Preview"],
    ["schema", "Schema"],
    ["raw-input", "Raw Input"],
  ];

  return (
    <ToolPage icon={Braces} title="JSON to Parquet" description="Convert JSON files to Parquet with compression options." metaDescription={getToolMetaDescription("json-to-parquet")} seoContent={getToolSeo("json-to-parquet")}>
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
                  <DropZone accept={[".json", ".jsonl"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSample}>
                      <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                    </Button>
                  </div>
                </div>
              ) : (
                <PasteInput
                  onSubmit={handlePaste}
                  placeholder='Paste JSON here... e.g. [{"name": "Alice", "score": 95.5}]'
                  label="Paste JSON data"
                  accept={[".json", ".jsonl"]}
                  onFile={handleFile}
                />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              {/* File info + actions */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                <div className="flex gap-2">
                  <Button onClick={handleConvert} disabled={loading}>
                    <ArrowRightLeft className="h-4 w-4 mr-1" /> {result ? "Re-convert" : "Convert to Parquet"}
                  </Button>
                  <Button variant="outline" onClick={resetAll}>New file</Button>
                </div>
              </div>

              {/* Options */}
              <div className="border-2 border-border p-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-bold">Compression</label>
                  <div className="flex gap-1">
                    {(["snappy", "zstd", "gzip", "none"] as const).map((c) => (
                      <button key={c} onClick={() => setCompression(c)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${compression === c ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {c === "gzip" ? "GZIP" : c.charAt(0).toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-bold">Row Group Size</label>
                  <select value={rowGroupSize ?? ""} onChange={(e) => setRowGroupSize(e.target.value ? Number(e.target.value) : null)} className="border-2 border-border bg-background px-2 py-1 text-xs">
                    <option value="">Default</option>
                    <option value={10000}>10,000</option>
                    <option value={100000}>100,000</option>
                    <option value={1000000}>1,000,000</option>
                  </select>
                </div>
              </div>

              {/* INPUT SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
                  <div className="flex gap-1">
                    {inputTabs.map(([v, label]) => (
                      <button key={v} onClick={() => setInputView(v)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputView === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {preview && inputView === "data" && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                {meta && inputView === "schema" && (
                  <div className="border-2 border-border">
                    <div className="grid grid-cols-3 border-b-2 border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Column</span><span>Type</span><span>Nullable</span>
                    </div>
                    {meta.columns.map((col, i) => (
                      <div key={col} className="grid grid-cols-3 border-b border-border/50 px-3 py-2 text-xs">
                        <span className="font-medium">{col}</span>
                        <span className="font-mono text-muted-foreground">{meta.types[i]}</span>
                        <span className={nullableInfo[i] ? "text-amber-500" : "text-muted-foreground"}>{nullableInfo[i] ? "YES" : "NO"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {inputView === "raw-input" && (
                  <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                )}
              </div>

              {/* OUTPUT SECTION */}
              {result && (
                <div className="space-y-3 border-t-2 border-border pt-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" /> Download Parquet
                    </Button>
                  </div>

                  <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                    <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(result.durationMs / 1000).toFixed(1)}s</div></div>
                    <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(result.outputSize)}</div></div>
                    <div><div className="text-xs text-muted-foreground">Compression ratio</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((1 - result.outputSize / file.size) * 100)}%` : "—"} smaller</div></div>
                  </div>

                  {/* Output tabs */}
                  <div className="flex gap-1">
                    {([["preview", "Output Preview"], ["raw", "Raw Output"]] as ["preview" | "raw", string][]).map(([v, label]) => (
                      <button key={v} onClick={() => setOutputView(v)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputView === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {outputView === "preview" && outputPreview && (
                    <div className="space-y-3">
                      {parquetMeta && (
                        <div className="border-2 border-border bg-card p-4 flex items-center gap-6 flex-wrap">
                          <div><div className="text-xs text-muted-foreground">Row Groups</div><div className="text-lg font-bold">{parquetMeta.rowGroups}</div></div>
                          <div><div className="text-xs text-muted-foreground">Compressed Size</div><div className="text-lg font-bold">{formatBytes(parquetMeta.totalCompressed)}</div></div>
                          <div><div className="text-xs text-muted-foreground">Uncompressed Size</div><div className="text-lg font-bold">{formatBytes(parquetMeta.totalUncompressed)}</div></div>
                          <div><div className="text-xs text-muted-foreground">Codec</div><div className="text-lg font-bold">{compression === "none" ? "None" : compression.toUpperCase()}</div></div>
                        </div>
                      )}
                      <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                    </div>
                  )}
                  {outputView === "raw" && (
                    <RawPreview content={null} label="Raw Output" binary />
                  )}
                </div>
              )}
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
