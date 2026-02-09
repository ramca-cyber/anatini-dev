import { useState } from "react";
import { Braces, Download, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { runQuery, exportToCSV, downloadBlob, formatBytes } from "@/lib/duckdb-helpers";
import { getSampleJSON } from "@/lib/sample-data";
import * as duckdb from "@duckdb/duckdb-wasm";

export default function FlattenPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      await db.registerFileHandle(f.name, f, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
      const conn = await db.connect();
      try {
        await conn.query(`CREATE OR REPLACE TABLE flattened AS SELECT * FROM read_json_auto('${f.name}', maximum_depth=-1)`);
        const countRes = await conn.query(`SELECT COUNT(*) as cnt FROM flattened`);
        const count = Number(countRes.getChildAt(0)?.get(0) ?? 0);
        setRowCount(count);
      } finally {
        await conn.close();
      }
      const result = await runQuery(db, `SELECT * FROM flattened LIMIT 100`);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to flatten JSON");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db) return;
    try {
      const csv = await exportToCSV(db, `SELECT * FROM flattened`);
      downloadBlob(csv, file!.name.replace(/\.[^.]+$/, "") + "_flat.csv", "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <ToolPage
      icon={Braces}
      title="JSON Flattener"
      description="Flatten nested JSON/JSONL into tabular format for analysis."
    >
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".json", ".jsonl"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleJSON())}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {file && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={rowCount} columns={preview.columns.length} />
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download CSV
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); }}>New file</Button>
              </div>
            </div>
            <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
          </div>
        )}

        {loading && <LoadingState message="Flattening JSON..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      </div>
    </ToolPage>
  );
}
