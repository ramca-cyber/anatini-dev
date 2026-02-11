import { useState, useCallback, useRef } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Terminal, Play, Download, Plus, Copy, Table2, History, X, ChevronDown } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { DataTable } from "@/components/shared/DataTable";
import { SqlEditor } from "@/components/shared/SqlEditor";
import { LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, exportToParquet, exportQueryToJSON, downloadBlob, sanitizeTableName, type QueryResult } from "@/lib/duckdb-helpers";
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
  timestamp: string;
  rowCount: number;
  durationMs: number;
}

const MAX_HISTORY = 20;

function getSampleQueries(tables: LoadedTable[]): { label: string; sql: string }[] {
  if (tables.length === 0) return [];
  const t = tables[0];
  const queries = [
    { label: "Select all (limit 10)", sql: `SELECT * FROM "${t.name}" LIMIT 10;` },
    { label: "Row count", sql: `SELECT COUNT(*) AS total_rows FROM "${t.name}";` },
  ];
  if (t.columns.length > 0) {
    queries.push({ label: `Distinct values of "${t.columns[0]}"`, sql: `SELECT "${t.columns[0]}", COUNT(*) AS cnt FROM "${t.name}" GROUP BY "${t.columns[0]}" ORDER BY cnt DESC LIMIT 20;` });
  }
  if (t.columns.length > 1) {
    queries.push({ label: "Describe table", sql: `DESCRIBE "${t.name}";` });
  }
  return queries;
}

export default function SqlPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [tables, setTables] = useState<LoadedTable[]>([]);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const editorInsertRef = useRef<((text: string) => void) | null>(null);

  useAutoLoadFile(handleFile, !!db);

  async function handleFile(f: File) {
    if (!db) return;
    addFile(f);
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
      const entry: HistoryEntry = { sql: sql.trim(), timestamp: new Date().toISOString(), rowCount: res.rowCount, durationMs };
      const updated = [entry, ...history.filter(h => h.sql !== sql.trim()).slice(0, MAX_HISTORY - 1)];
      setHistory(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [db, sql, history]);

  async function handleExportCSV() {
    if (!db || !sql.trim()) return;
    try {
      const csv = await exportToCSV(db, sql);
      downloadBlob(csv, "query_result.csv", "text/csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function handleExportParquet() {
    if (!db || !result) return;
    try {
      const conn = await db.connect();
      try {
        await conn.query(`CREATE OR REPLACE TABLE __export_tmp AS ${sql}`);
        const buf = await exportToParquet(db, "__export_tmp");
        downloadBlob(buf, "query_result.parquet", "application/octet-stream");
        await conn.query(`DROP TABLE IF EXISTS __export_tmp`);
      } finally {
        await conn.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parquet export failed");
    }
  }

  async function handleExportJSON() {
    if (!db || !sql.trim()) return;
    try {
      const json = await exportQueryToJSON(db, sql);
      downloadBlob(json, "query_result.json", "application/json");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON export failed");
    }
  }

  function handleCopy() {
    if (!result) return;
    const header = result.columns.join("\t");
    const rows = result.rows.map((r) => r.map((v) => (typeof v === "bigint" ? v.toString() : v) ?? "").join("\t")).join("\n");
    navigator.clipboard.writeText(header + "\n" + rows);
    toast({ title: "Copied to clipboard" });
  }

  function insertColumn(col: string) {
    if (editorInsertRef.current) {
      editorInsertRef.current(`"${col}"`);
    } else {
      setSql((prev) => prev + `"${col}" `);
    }
  }

  const sampleQueries = getSampleQueries(tables);

  return (
    <ToolPage icon={Terminal} title="SQL Playground" description="Run SQL queries against local files using DuckDB."
      pageTitle="SQL Playground — Query Files Offline | SwiftDataTools.com" metaDescription={getToolMetaDescription("sql-playground")} seoContent={getToolSeo("sql-playground")}>
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
            <div className="space-y-2">
              <DropZone
                accept={[".csv", ".parquet", ".json"]}
                onFile={handleFile}
                label="Add a file"
                sampleAction={tables.length === 0 ? { label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) } : undefined}
              />
              <UrlInput onFile={handleFile} accept={[".csv", ".parquet", ".json"]} placeholder="https://example.com/data.csv" label="Or load from URL" />
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
                  <button
                    key={col}
                    onClick={() => insertColumn(col)}
                    className="w-full flex items-center justify-between text-xs hover:bg-muted/30 rounded px-1 py-0.5 transition-colors cursor-pointer"
                    title={`Click to insert "${col}"`}
                  >
                    <span className="font-mono text-muted-foreground hover:text-primary transition-colors">{col}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">{t.types[i]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="space-y-4">
          <SqlEditor value={sql} onChange={setSql} onRun={handleRun} onInsertRef={editorInsertRef} />

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleRun} disabled={loading || !sql.trim()}>
              <Play className="h-4 w-4 mr-1" /> Run
            </Button>
            {/* Sample queries dropdown */}
            {sampleQueries.length > 0 && (
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowSamples(!showSamples)}>
                  Sample Queries <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                {showSamples && (
                  <div className="absolute top-full left-0 mt-1 z-10 border-2 border-border bg-card rounded-md shadow-lg min-w-[250px]">
                    {sampleQueries.map((q, i) => (
                      <button key={i} onClick={() => { setSql(q.sql); setShowSamples(false); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                        <div className="font-medium">{q.label}</div>
                        <div className="font-mono text-muted-foreground truncate">{q.sql}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                <Button variant="outline" size="sm" onClick={handleExportParquet}>
                  <Download className="h-4 w-4 mr-1" /> Parquet
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-1" /> JSON
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
                        <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
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
