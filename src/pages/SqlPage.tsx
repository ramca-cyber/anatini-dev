import { useState, useCallback } from "react";
import { Terminal, Play, Download, Plus, X, Copy, Table2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, sanitizeTableName, type QueryResult } from "@/lib/duckdb-helpers";
import { toast } from "@/hooks/use-toast";

interface LoadedTable {
  name: string;
  fileName: string;
  columns: string[];
  types: string[];
  rowCount: number;
}

export default function SqlPage() {
  const { db } = useDuckDB();
  const [tables, setTables] = useState<LoadedTable[]>([]);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(true);

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
    try {
      const res = await runQuery(db, sql);
      setResult(res);
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
    const rows = result.rows.map((r) => r.map((v) => v ?? "").join("\t")).join("\n");
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
            <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Add a file" />
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
          <div className="relative">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); } }}
              placeholder="-- Write SQL here (Ctrl+Enter to run)"
              className="w-full min-h-[160px] rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground resize-y placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleRun} disabled={loading || !sql.trim()}>
              <Play className="h-4 w-4 mr-1" /> Run
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
