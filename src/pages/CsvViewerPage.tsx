import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Eye, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { Link } from "react-router-dom";

const PAGE_SIZE = 200;

export default function CsvViewerPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [data, setData] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchCol, setSearchCol] = useState("__all__");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [colStats, setColStats] = useState<{ col: string; stats: Record<string, string> } | null>(null);
  const [page, setPage] = useState(0);
  const [tableName, setTableName] = useState("");
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  async function loadPage(tName: string, pageNum: number) {
    if (!db) return;
    const offset = pageNum * PAGE_SIZE;
    const result = await runQuery(db, `SELECT * FROM "${tName}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
    setData(result);
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
    setColStats(null);
    setPage(0);
    setSearch("");
    setSearchCol("__all__");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      await loadPage(tName, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleColumnClick(colIndex: number) {
    if (!db || !file || !meta) return;
    const colName = meta.columns[colIndex];
    try {
      const result = await runQuery(db, `
        SELECT COUNT(*) as total, COUNT("${colName}") as non_null,
          COUNT(DISTINCT "${colName}") as distinct_vals,
          MIN("${colName}"::VARCHAR) as min_val, MAX("${colName}"::VARCHAR) as max_val
        FROM "${tableName}"
      `);
      if (result.rows[0]) {
        const r = result.rows[0];
        setColStats({ col: colName, stats: { "Total": String(r[0]), "Non-null": String(r[1]), "Distinct": String(r[2]), "Min": String(r[3] ?? "—"), "Max": String(r[4] ?? "—") } });
      }
    } catch { setColStats(null); }
  }

  function handleSort(colIndex: number) {
    if (sortCol === colIndex) setSortAsc(!sortAsc);
    else { setSortCol(colIndex); setSortAsc(true); }
  }

  async function handleDownloadFiltered() {
    if (!db || !meta) return;
    try {
      let sql = `SELECT * FROM "${tableName}"`;
      if (search) {
        if (searchCol === "__all__") {
          const conditions = meta.columns.map(c => `"${c}"::VARCHAR ILIKE '%${search.replace(/'/g, "''")}%'`);
          sql += ` WHERE ${conditions.join(" OR ")}`;
        } else {
          sql += ` WHERE "${searchCol}"::VARCHAR ILIKE '%${search.replace(/'/g, "''")}%'`;
        }
      }
      const csv = await exportToCSV(db, sql);
      downloadBlob(csv, `${file?.name.replace(/\.[^.]+$/, "")}_filtered.csv`, "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  const totalPages = meta ? Math.ceil(meta.rowCount / PAGE_SIZE) : 0;

  let displayRows = data?.rows ?? [];
  if (search && data) {
    displayRows = displayRows.filter((row) => {
      if (searchCol === "__all__") return row.some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()));
      const idx = data.columns.indexOf(searchCol);
      return idx >= 0 && String(row[idx] ?? "").toLowerCase().includes(search.toLowerCase());
    });
  }
  if (sortCol !== null && data) {
    displayRows = [...displayRows].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
  }

  return (
    <ToolPage icon={Eye} title="CSV Viewer" description="View, search, filter, and sort CSV data with column statistics." metaDescription={getToolMetaDescription("csv-viewer")} seoContent={getToolSeo("csv-viewer")}>
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
                accept={[".csv", ".tsv"]}
                onFile={handleFile}
                label="Drop a CSV file"
                sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
              />
            ) : (
              <UrlInput onFile={handleFile} accept={[".csv", ".tsv"]} placeholder="https://example.com/data.csv" label="Load CSV from URL" />
            )}
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="csv" />}
              </div>
              <div className="flex gap-2">
                <Link to="/sql-playground"><Button variant="outline" size="sm">Open in SQL Playground</Button></Link>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setMeta(null); setData(null); setColStats(null); setStoredFileId(null); }}>New file</Button>
              </div>
            </div>

            {/* Search with column selector */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rows..." className="pl-9" />
              </div>
              <select value={searchCol} onChange={(e) => setSearchCol(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                <option value="__all__">All columns</option>
                {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {search && (
                <Button variant="outline" size="sm" onClick={handleDownloadFiltered}>
                  <Download className="h-4 w-4 mr-1" /> Download filtered
                </Button>
              )}
            </div>

            {colStats && (
              <div className="border border-border bg-muted/30 p-3 space-y-1">
                <div className="text-xs font-bold">Column: {colStats.col}</div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(colStats.stats).map(([k, v]) => (
                    <div key={k} className="text-xs"><span className="text-muted-foreground">{k}: </span><span className="font-mono font-bold">{v}</span></div>
                  ))}
                </div>
              </div>
            )}

            <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} excludeRoute="/csv-viewer" />
          </div>
        )}

        {loading && <LoadingState message="Loading CSV..." />}
        {error && <ErrorAlert message={error} />}

        {data && (
          <>
            <div className="overflow-auto border-2 border-border max-h-[500px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    {data.columns.map((col, i) => (
                      <th key={i} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left whitespace-nowrap">
                        <button onClick={() => { handleSort(i); handleColumnClick(i); }} className="flex items-center gap-1 text-xs font-bold hover:text-primary transition-colors">
                          {col}
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                        {data.types?.[i] && <div className="font-mono text-[10px] font-normal text-muted-foreground">{data.types[i]}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} className={`border-b border-border/50 hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      {row.map((val, j) => (
                        <td key={j} className={`px-3 py-1.5 whitespace-nowrap font-mono text-xs ${val === null || val === undefined || val === "" ? "bg-destructive/5" : ""}`}>
                          {val === null || val === undefined ? <span className="text-destructive/40">∅</span>
                            : val === "" ? <span className="text-destructive/40 italic">empty</span>
                            : <span className="max-w-[300px] truncate block">{String(val)}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </>
        )}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}