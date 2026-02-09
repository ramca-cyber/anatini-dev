import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Eye, FlaskConical, Search } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";

export default function ParquetViewerPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"data" | "schema" | "metadata">("data");
  const [search, setSearch] = useState("");
  const [parquetMeta, setParquetMeta] = useState<{ columns: string[]; rows: any[][] } | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 200`);
      setPreview(result);

      // Try to get parquet metadata
      try {
        const metaResult = await runQuery(db, `SELECT * FROM parquet_metadata('${f.name}')`);
        setParquetMeta({ columns: metaResult.columns, rows: metaResult.rows });
      } catch {
        setParquetMeta(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    if (!db || !file) return;
    const tableName = sanitizeTableName(file.name);
    const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
    downloadBlob(csv, `${file.name.replace(/\.[^.]+$/, "")}.csv`, "text/csv");
  }

  async function handleExportJSON() {
    if (!db || !file) return;
    const tableName = sanitizeTableName(file.name);
    const result = await runQuery(db, `SELECT * FROM "${tableName}"`);
    const records = result.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      result.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    downloadBlob(JSON.stringify(records, null, 2), `${file.name.replace(/\.[^.]+$/, "")}.json`, "application/json");
  }

  const filteredRows = preview && search
    ? preview.rows.filter((row) => row.some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase())))
    : preview?.rows ?? [];

  const tabs = ["data", "schema", "metadata"] as const;

  return (
    <ToolPage icon={Eye} title="Parquet Viewer" description="Explore Parquet files — data, schema, and metadata." metaDescription={getToolMetaDescription("parquet-viewer")} seoContent={getToolSeo("parquet-viewer")}>
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON}>Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setMeta(null); setPreview(null); }}>New file</Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-border">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px] ${
                    tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {tab === "data" && preview && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rows..." className="pl-9 border-2" />
                </div>
                <DataTable columns={preview.columns} rows={filteredRows} types={preview.types} className="max-h-[500px]" maxRows={200} />
              </div>
            )}

            {tab === "schema" && meta && (
              <div className="border-2 border-border">
                <div className="grid grid-cols-3 border-b-2 border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>#</span><span>Column</span><span>Type</span>
                </div>
                {meta.columns.map((col, i) => (
                  <div key={col} className="grid grid-cols-3 border-b border-border/50 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">{i + 1}</span>
                    <span className="font-medium">{col}</span>
                    <span className="font-mono text-muted-foreground">{meta.types[i]}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "metadata" && (
              <div className="space-y-4">
                <div className="border-2 border-border p-4 space-y-2">
                  <div className="text-xs"><strong>Rows:</strong> {meta.rowCount.toLocaleString()}</div>
                  <div className="text-xs"><strong>Columns:</strong> {meta.columns.length}</div>
                  <div className="text-xs"><strong>File size:</strong> {formatBytes(file.size)}</div>
                </div>
                {parquetMeta && (
                  <DataTable columns={parquetMeta.columns} rows={parquetMeta.rows} className="max-h-[400px]" />
                )}
                {!parquetMeta && (
                  <p className="text-xs text-muted-foreground">Detailed Parquet metadata not available for this file.</p>
                )}
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Loading Parquet file..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
    </ToolPage>
  );
}
