import { useState } from "react";
import { FileSpreadsheet, Download, ArrowRightLeft, FlaskConical } from "lucide-react";
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

  const inputExt = file?.name.split(".").pop()?.toLowerCase();
  const outputFormat = inputExt === "parquet" ? "CSV" : "Parquet";

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
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
    try {
      const tableName = sanitizeTableName(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (outputFormat === "CSV") {
        const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
        downloadBlob(csv, `${baseName}.csv`, "text/csv");
      } else {
        const buf = await exportToParquet(db, tableName);
        downloadBlob(buf, `${baseName}.parquet`, "application/octet-stream");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPage
      icon={FileSpreadsheet}
      title="CSV ↔ Parquet Converter"
      description="Convert between CSV and Parquet with type preservation and compression."
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
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setPreview(null); }}>
                  New file
                </Button>
              </div>
            </div>
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
