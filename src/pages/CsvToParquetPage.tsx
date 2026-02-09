import { useState } from "react";
import { getToolSeo } from "@/lib/seo-content";
import { FileSpreadsheet, ArrowRightLeft, FlaskConical, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToParquet, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

export default function CsvToParquetPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [compression, setCompression] = useState<"snappy" | "zstd" | "none">("snappy");
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setConversionResult(null);
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
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const buf = await exportToParquet(db, tableName);
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize: buf.byteLength });
      downloadBlob(buf, `${baseName}.parquet`, "application/octet-stream");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPage
      icon={FileSpreadsheet}
      title="CSV to Parquet"
      description="Convert CSV files to columnar Parquet format with compression."
      pageTitle="CSV to Parquet — Free, Offline | Anatini.dev"
      seoContent={getToolSeo("csv-to-parquet")}
    >
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".csv", ".tsv"]} onFile={handleFile} label="Drop a CSV file" />
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
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> Convert to Parquet
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setPreview(null); setConversionResult(null); }}>New file</Button>
              </div>
            </div>

            <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-4 w-4" /> Compression Options
              {showOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showOptions && (
              <div className="border-2 border-border p-4 space-y-2">
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

            {conversionResult && (
              <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</div></div>
                <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(conversionResult.outputSize)}</div></div>
                <div><div className="text-xs text-muted-foreground">Compression</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((1 - conversionResult.outputSize / file.size) * 100)}% smaller` : "—"}</div></div>
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {preview && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Preview (first 100 rows)</h3>
            <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
