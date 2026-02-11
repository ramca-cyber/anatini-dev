import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Eye, Search, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 200;

export default function ParquetViewerPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"data" | "schema" | "metadata">("data");
  const [search, setSearch] = useState("");
  const [searchCol, setSearchCol] = useState("__all__");
  const [parquetMeta, setParquetMeta] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [page, setPage] = useState(0);
  const [tableName, setTableName] = useState("");
  const [ddlCopied, setDdlCopied] = useState(false);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  async function loadPage(tName: string, pageNum: number) {
    if (!db) return;
    const offset = pageNum * PAGE_SIZE;
    const result = await runQuery(db, `SELECT * FROM "${tName}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
    setPreview(result);
    setPage(pageNum);
  }

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setPage(0);
    setSearch("");
    setSearchCol("__all__");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      await loadPage(tName, 0);

      try {
        const metaResult = await runQuery(db, `SELECT * FROM parquet_metadata('${f.name}')`);
        setParquetMeta({ columns: metaResult.columns, rows: metaResult.rows });
      } catch { setParquetMeta(null); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleExportCSV() {
    if (!db || !file) return;
    const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
    downloadBlob(csv, `${file.name.replace(/\.[^.]+$/, "")}.csv`, "text/csv");
  }

  async function handleExportJSON() {
    if (!db || !file) return;
    const result = await runQuery(db, `SELECT * FROM "${tableName}"`);
    const records = result.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      result.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    downloadBlob(JSON.stringify(records, null, 2), `${file.name.replace(/\.[^.]+$/, "")}.json`, "application/json");
  }

  function generateSchemaDDL(): string {
    if (!meta) return "";
    const typeMap: Record<string, string> = {
      VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE PRECISION",
      BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP", FLOAT: "REAL",
    };
    const mapType = (t: string) => {
      const upper = t.toUpperCase();
      for (const [k, v] of Object.entries(typeMap)) {
        if (upper.includes(k)) return v;
      }
      return "TEXT";
    };
    const cols = meta.columns.map((col, i) => `  "${col}" ${mapType(meta.types[i])}`).join(",\n");
    return `CREATE TABLE "${tableName}" (\n${cols}\n);`;
  }

  async function handleCopyDDL() {
    const ddl = generateSchemaDDL();
    await navigator.clipboard.writeText(ddl);
    setDdlCopied(true);
    toast({ title: "Schema DDL copied to clipboard" });
    setTimeout(() => setDdlCopied(false), 2000);
  }

  const totalPages = meta ? Math.ceil(meta.rowCount / PAGE_SIZE) : 0;

  const filteredRows = preview && search
    ? preview.rows.filter((row) => {
        if (searchCol === "__all__") return row.some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()));
        const idx = preview.columns.indexOf(searchCol);
        return idx >= 0 && String(row[idx] ?? "").toLowerCase().includes(search.toLowerCase());
      })
    : preview?.rows ?? [];

  const tabs = ["data", "schema", "metadata"] as const;

  return (
    <ToolPage icon={Eye} title="Parquet Viewer" description="Explore Parquet files — data, schema, and metadata." metaDescription={getToolMetaDescription("parquet-viewer")} seoContent={getToolSeo("parquet-viewer")}>
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="parquet" />}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON}>Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setMeta(null); setPreview(null); setStoredFileId(null); }}>New file</Button>
              </div>
            </div>

            <div className="flex border-b-2 border-border">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px] ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>

            {tab === "data" && preview && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rows..." className="pl-9 border-2" />
                  </div>
                  <select value={searchCol} onChange={(e) => setSearchCol(e.target.value)} className="border-2 border-border bg-background px-2 py-1 text-xs rounded-md">
                    <option value="__all__">All columns</option>
                    {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <DataTable columns={preview.columns} rows={filteredRows} types={preview.types} className="max-h-[500px]" maxRows={PAGE_SIZE} />
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => loadPage(tableName, page - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => loadPage(tableName, page + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === "schema" && meta && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleCopyDDL}>
                    {ddlCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {ddlCopied ? "Copied" : "Copy Schema as SQL DDL"}
                  </Button>
                </div>
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
              </div>
            )}

            {tab === "metadata" && (
              <div className="space-y-4">
                <div className="border-2 border-border p-4 space-y-2">
                  <div className="text-xs"><strong>Rows:</strong> {meta.rowCount.toLocaleString()}</div>
                  <div className="text-xs"><strong>Columns:</strong> {meta.columns.length}</div>
                  <div className="text-xs"><strong>File size:</strong> {formatBytes(file.size)}</div>
                </div>
                {parquetMeta && <DataTable columns={parquetMeta.columns} rows={parquetMeta.rows} className="max-h-[400px]" />}
                {!parquetMeta && <p className="text-xs text-muted-foreground">Detailed Parquet metadata not available for this file.</p>}
              </div>
            )}

            <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} excludeRoute="/parquet-viewer" />
          </div>
        )}

        {loading && <LoadingState message="Loading Parquet file..." />}
        {error && <ErrorAlert message={error} />}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
