import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Eye, FlaskConical, Search, ArrowUpDown } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { Link } from "react-router-dom";

export default function CsvViewerPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [data, setData] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [colStats, setColStats] = useState<{ col: string; stats: Record<string, string> } | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setColStats(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 500`);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  async function handleColumnClick(colIndex: number) {
    if (!db || !file || !meta) return;
    const colName = meta.columns[colIndex];
    const tableName = sanitizeTableName(file.name);
    try {
      const result = await runQuery(db, `
        SELECT
          COUNT(*) as total,
          COUNT("${colName}") as non_null,
          COUNT(DISTINCT "${colName}") as distinct_vals,
          MIN("${colName}"::VARCHAR) as min_val,
          MAX("${colName}"::VARCHAR) as max_val
        FROM "${tableName}"
      `);
      if (result.rows[0]) {
        const r = result.rows[0];
        setColStats({
          col: colName,
          stats: {
            "Total": String(r[0]),
            "Non-null": String(r[1]),
            "Distinct": String(r[2]),
            "Min": String(r[3] ?? "—"),
            "Max": String(r[4] ?? "—"),
          },
        });
      }
    } catch {
      setColStats(null);
    }
  }

  function handleSort(colIndex: number) {
    if (sortCol === colIndex) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  }

  let displayRows = data?.rows ?? [];
  if (search && data) {
    displayRows = displayRows.filter((row) =>
      row.some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
    );
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
      <div className="space-y-4">
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
              <div className="flex gap-2">
                <Link to="/sql-playground">
                  <Button variant="outline" size="sm">Open in SQL Playground</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setMeta(null); setData(null); setColStats(null); }}>New file</Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rows..." className="pl-9 border-2" />
            </div>

            {/* Column stats */}
            {colStats && (
              <div className="border-2 border-foreground bg-card p-3 space-y-1">
                <div className="text-xs font-bold">Column: {colStats.col}</div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(colStats.stats).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-mono font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Loading CSV..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {data && (
          <div className="overflow-auto border-2 border-border max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  {data.columns.map((col, i) => (
                    <th key={i} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left whitespace-nowrap">
                      <button
                        onClick={() => { handleSort(i); handleColumnClick(i); }}
                        className="flex items-center gap-1 text-xs font-bold hover:text-primary transition-colors"
                      >
                        {col}
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {data.types?.[i] && (
                        <div className="font-mono text-[10px] font-normal text-muted-foreground">{data.types[i]}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.slice(0, 500).map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    {row.map((val, j) => (
                      <td key={j} className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">
                        {val === null || val === undefined
                          ? <span className="text-muted-foreground/40">∅</span>
                          : <span className="max-w-[300px] truncate block">{String(val)}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
