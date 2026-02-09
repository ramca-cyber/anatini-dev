import { useState } from "react";
import { FileSpreadsheet, Download, ArrowRightLeft, FlaskConical, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, exportToParquet, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

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

  const inputExt = file?.name.split(".").pop()?.toLowerCase();
  const outputFormat = inputExt === "parquet" ? "CSV" : "Parquet";

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
      let outputSize = 0;
      if (outputFormat === "CSV") {
        const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
        outputSize = new Blob([csv]).size;
        downloadBlob(csv, `${baseName}.csv`, "text/csv");
      } else {
        const buf = await exportToParquet(db, tableName);
        outputSize = buf.byteLength;
        downloadBlob(buf, `${baseName}.parquet`, "application/octet-stream");
      }
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  const compressionOptions = [
    { id: "snappy" as const, label: "Snappy" },
    { id: "zstd" as const, label: "Zstd" },
    { id: "none" as const, label: "None" },
  ];

  return (
    <ToolPage
      icon={FileSpreadsheet}
      title="CSV ↔ Parquet Converter"
      description="Convert between CSV and Parquet with type preservation and compression."
      pageTitle="Convert CSV to Parquet Online — Free, Offline | DuckTools"
    >
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone
              accept={[".csv", ".parquet"]}
              onFile={handleFile}
              label="Drop a CSV or Parquet file"
            />
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
                  Convert to {outputFormat}
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setPreview(null); setConversionResult(null); }}>
                  New file
                </Button>
              </div>
            </div>

            {/* Options panel */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="h-4 w-4" />
              Conversion Options
              {showOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showOptions && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {inputExt === "csv" && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Delimiter</label>
                      <select
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value)}
                        className="block rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value=",">Comma (,)</option>
                        <option value="\t">Tab</option>
                        <option value=";">Semicolon (;)</option>
                        <option value="|">Pipe (|)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Header row</label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="rounded" />
                        First row is header
                      </label>
                    </div>
                  </div>
                )}
                {outputFormat === "Parquet" && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Parquet Compression</label>
                    <div className="flex gap-2">
                      {compressionOptions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCompression(c.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            compression === c.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conversion result */}
            {conversionResult && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 flex items-center gap-6 flex-wrap">
                <div>
                  <div className="text-xs text-muted-foreground">Converted in</div>
                  <div className="text-lg font-bold text-success">{(conversionResult.durationMs / 1000).toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Output size</div>
                  <div className="text-lg font-bold">{formatBytes(conversionResult.outputSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Size change</div>
                  <div className="text-lg font-bold text-primary">
                    {file.size > 0
                      ? `${Math.round((1 - conversionResult.outputSize / file.size) * 100)}% ${conversionResult.outputSize < file.size ? "smaller" : "larger"}`
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

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
