import { useState, useCallback } from "react";
import { Terminal, Play, Download, Plus, Copy, Table2, FlaskConical, History, X } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { SqlEditor } from "@/components/shared/SqlEditor";
import { LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, sanitizeTableName, type QueryResult } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

interface LoadedTable {
  name: string;
  fileName: string;
  columns: string[];
  types: string[];
  rowCount: number;
}

interface HistoryEntry {
  sql: string;
  timestamp: Date;
  rowCount: number;
  durationMs: number;
}

export default function SqlPage() {
  const { db } = useDuckDB();
  const [tables, setTables] = useState<LoadedTable[]>([]);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  async function handleFile(f: File) {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      const newTable: LoadedTable = { name: tableName, fileName: f.name, ...info };
      setTables((prev) => [...prev.filter((t) => t.name !== tableName), newTable]);
      if (!sql) setSql(`SELECT * FROM "${tableName}" LIMIT 100;`);
      setShowDropZone(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  const handleRun = useCallback(async () => {
    if (!db || !sql.trim()) return;
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await runQuery(db, sql);
      const durationMs = Math.round(performance.now() - start);
      setResult(res);
      setHistory((prev) => [
        { sql: sql.trim(), timestamp: new Date(), rowCount: res.rowCount, durationMs },
        ...prev.slice(0, 49),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [db, sql]);

  async function handleExportCSV() {
    if (!db || !sql.trim()) return;
    try {
      const csv = await exportToCSV(db, sql);
      downloadBlob(csv, "query_result.csv", "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  function handleCopy() {
    if (!result) return;
    const header = result.columns.join("\t");
    const rows = result.rows.map((r) => r.map((v) => (typeof v === "bigint" ? v.toString() : v) ?? "").join("\t")).join("\n");
    navigator.clipboard.writeText(header + "\n" + rows);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <ToolPage icon={Terminal} title="SQL Playground" description="Run SQL queries against local files using DuckDB.">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Tables</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDropZone(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showDropZone && (
            <div className="space-y-3">
              <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Add a file" />
              {tables.length === 0 && (
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleCSV())}>
                    <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                  </Button>
                </div>
              )}
            </div>
          )}

          {tables.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-medium">{t.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{t.rowCount.toLocaleString()} rows</span>
              </div>
              <div className="space-y-0.5">
                {t.columns.map((col, i) => (
                  <div key={col} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{col}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">{t.types[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="space-y-4">
          <SqlEditor value={sql} onChange={setSql} onRun={handleRun} />

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleRun} disabled={loading || !sql.trim()}>
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
            <Button
              variant={showHistory ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="relative"
            >
              <History className="h-4 w-4 mr-1" /> History
              {history.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                  {history.length}
                </span>
              )}
            </Button>
            {result && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  {result.rowCount.toLocaleString()} rows
                </span>
              </>
            )}
          </div>

          {/* History panel */}
          {showHistory && (
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h4 className="text-sm font-medium text-muted-foreground">Query History</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {history.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No queries yet</div>
              ) : (
                <div className="max-h-[240px] overflow-auto divide-y divide-border/50">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setSql(h.sql); setShowHistory(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-mono text-xs text-foreground truncate">{h.sql}</div>
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{h.rowCount} rows</span>
                        <span>{h.durationMs}ms</span>
                        <span>{h.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && <LoadingState message="Running query..." />}
          {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          {result && (
            <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
          )}
        </div>
      </div>
    </ToolPage>
  );
}
