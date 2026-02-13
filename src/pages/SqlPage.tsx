import { useState, useCallback, useRef, useMemo } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Terminal, Play, Download, Plus, Copy, Table2, History, X, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { DataTable } from "@/components/shared/DataTable";
import { SqlEditor } from "@/components/shared/SqlEditor";
import { LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { registerFile, runQuery, exportToCSV, exportToParquet, exportQueryToJSON, downloadBlob, sanitizeTableName, warnLargeFile, type QueryResult } from "@/lib/duckdb-helpers";
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

interface QueryTab {
  id: string;
  label: string;
  sql: string;
  result: QueryResult | null;
  error: string | null;
  loading: boolean;
}

const MAX_HISTORY = 20;
let tabCounter = 1;

function createTab(initialSql = ""): QueryTab {
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const label = `Query ${tabCounter++}`;
  return { id, label, sql: initialSql, result: null, error: null, loading: false };
}

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

/** Parse an Excel file into multiple CSV Files, one per sheet */
async function excelToSheetFiles(file: File): Promise<{ name: string; file: File }[]> {
  const { read, utils } = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = read(buf);
  const results: { name: string; file: File }[] = [];
  for (const sheetName of wb.SheetNames) {
    const csv = utils.sheet_to_csv(wb.Sheets[sheetName]);
    const blob = new Blob([csv], { type: "text/csv" });
    const csvFile = new File([blob], `${sanitizeTableName(file.name)}_${sanitizeTableName(sheetName)}.csv`, { type: "text/csv" });
    results.push({ name: `${sanitizeTableName(file.name)}_${sanitizeTableName(sheetName)}`, file: csvFile });
  }
  return results;
}

export default function SqlPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [tables, setTables] = useState<LoadedTable[]>([]);
  const [tabs, setTabs] = useState<QueryTab[]>(() => [createTab()]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? "");
  const [showDropZone, setShowDropZone] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [renamingTable, setRenamingTable] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const editorInsertRef = useRef<((text: string) => void) | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];

  const editorSchema = useMemo(() => {
    const s: Record<string, string[]> = {};
    for (const t of tables) s[t.name] = t.columns;
    return s;
  }, [tables]);

  function updateTab(id: string, patch: Partial<QueryTab>) {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleFile(f: File) {
    if (!db) return;
    const ext = f.name.split(".").pop()?.toLowerCase();

    // Excel: split into per-sheet CSV files
    if (ext === "xlsx" || ext === "xls") {
      warnLargeFile(f);
      addFile(f);
      updateTab(activeTab.id, { loading: true, error: null });
      try {
        const sheets = await excelToSheetFiles(f);
        if (sheets.length === 0) throw new Error("No sheets found in Excel file");
        let firstTable = "";
        for (const sheet of sheets) {
          const info = await registerFile(db, sheet.file, sheet.name);
          const newTable: LoadedTable = { name: sheet.name, fileName: `${f.name} → ${sheet.name}`, ...info };
          setTables(prev => [...prev.filter(t => t.name !== sheet.name), newTable]);
          if (!firstTable) firstTable = sheet.name;
        }
        if (!activeTab.sql && firstTable) updateTab(activeTab.id, { sql: `SELECT * FROM "${firstTable}" LIMIT 100;` });
        setShowDropZone(false);
        toast({ title: `Loaded ${sheets.length} sheet(s) from Excel` });
      } catch (e) {
        updateTab(activeTab.id, { error: e instanceof Error ? e.message : "Failed to load Excel file" });
      } finally {
        updateTab(activeTab.id, { loading: false });
      }
      return;
    }

    warnLargeFile(f);
    addFile(f);
    updateTab(activeTab.id, { loading: true, error: null });
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      const newTable: LoadedTable = { name: tableName, fileName: f.name, ...info };
      setTables((prev) => [...prev.filter((t) => t.name !== tableName), newTable]);
      if (!activeTab.sql) updateTab(activeTab.id, { sql: `SELECT * FROM "${tableName}" LIMIT 100;` });
      setShowDropZone(false);
    } catch (e) {
      updateTab(activeTab.id, { error: e instanceof Error ? e.message : "Failed to load file" });
    } finally {
      updateTab(activeTab.id, { loading: false });
    }
  }

  const handleRun = useCallback(async (selectedText?: string) => {
    if (!db) return;
    const queryText = selectedText?.trim() || activeTab.sql.trim();
    if (!queryText) return;
    updateTab(activeTab.id, { loading: true, error: null });
    const start = performance.now();
    try {
      const res = await runQuery(db, queryText);
      const durationMs = Math.round(performance.now() - start);
      updateTab(activeTab.id, { result: res, loading: false });
      const entry: HistoryEntry = { sql: queryText, timestamp: new Date().toISOString(), rowCount: res.rowCount, durationMs };
      setHistory(prev => [entry, ...prev.filter(h => h.sql !== queryText).slice(0, MAX_HISTORY - 1)]);
    } catch (e) {
      updateTab(activeTab.id, { error: e instanceof Error ? e.message : "Query failed", result: null, loading: false });
    }
  }, [db, activeTab.id, activeTab.sql]);

  async function handleRemoveTable(tableName: string) {
    if (!db) return;
    try {
      const conn = await db.connect();
      try {
        await conn.query(`DROP TABLE IF EXISTS "${tableName}"`);
      } finally {
        await conn.close();
      }
      setTables(prev => prev.filter(t => t.name !== tableName));
      toast({ title: `Removed table "${tableName}"` });
    } catch (e) {
      toast({ title: "Failed to remove table", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  }

  async function handleRenameTable(oldName: string, newName: string) {
    if (!db || !newName.trim() || newName === oldName) {
      setRenamingTable(null);
      return;
    }
    const safeName = sanitizeTableName(newName);
    if (tables.some(t => t.name === safeName && t.name !== oldName)) {
      toast({ title: "Table name already exists", variant: "destructive" });
      return;
    }
    try {
      const conn = await db.connect();
      try {
        await conn.query(`ALTER TABLE "${oldName}" RENAME TO "${safeName}"`);
      } finally {
        await conn.close();
      }
      setTables(prev => prev.map(t => t.name === oldName ? { ...t, name: safeName } : t));
      setRenamingTable(null);
      toast({ title: `Renamed "${oldName}" → "${safeName}"` });
    } catch (e) {
      toast({ title: "Rename failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  }

  async function handleExportCSV() {
    if (!db || !activeTab.sql.trim()) return;
    try {
      const csv = await exportToCSV(db, activeTab.sql);
      downloadBlob(csv, "query_result.csv", "text/csv");
    } catch (e) {
      updateTab(activeTab.id, { error: e instanceof Error ? e.message : "Export failed" });
    }
  }

  async function handleExportParquet() {
    if (!db || !activeTab.result) return;
    try {
      const conn = await db.connect();
      try {
        await conn.query(`CREATE OR REPLACE TABLE __export_tmp AS ${activeTab.sql}`);
      } catch {
        await conn.close();
        toast({ title: "Parquet export failed", description: "Parquet export only works with SELECT queries.", variant: "destructive" });
        return;
      }
      try {
        const buf = await exportToParquet(db, "__export_tmp");
        downloadBlob(buf, "query_result.parquet", "application/octet-stream");
        await conn.query(`DROP TABLE IF EXISTS __export_tmp`);
      } finally {
        await conn.close();
      }
    } catch (e) {
      updateTab(activeTab.id, { error: e instanceof Error ? e.message : "Parquet export failed" });
    }
  }

  async function handleExportJSON() {
    if (!db || !activeTab.sql.trim()) return;
    try {
      const json = await exportQueryToJSON(db, activeTab.sql);
      downloadBlob(json, "query_result.json", "application/json");
    } catch (e) {
      updateTab(activeTab.id, { error: e instanceof Error ? e.message : "JSON export failed" });
    }
  }

  function handleCopy() {
    if (!activeTab.result) return;
    const header = activeTab.result.columns.join("\t");
    const rows = activeTab.result.rows.map((r) => r.map((v) => (typeof v === "bigint" ? v.toString() : v) ?? "").join("\t")).join("\n");
    navigator.clipboard.writeText(header + "\n" + rows);
    toast({ title: "Copied to clipboard" });
  }

  function insertColumn(col: string) {
    if (editorInsertRef.current) {
      editorInsertRef.current(`"${col}"`);
    } else {
      updateTab(activeTab.id, { sql: activeTab.sql + `"${col}" ` });
    }
  }

  function addTab() {
    const t = createTab();
    setTabs(prev => [...prev, t]);
    setActiveTabId(t.id);
  }

  function closeTab(id: string) {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const next = tabs.filter(t => t.id !== id);
    setTabs(next);
    if (activeTabId === id) {
      setActiveTabId(next[Math.min(idx, next.length - 1)].id);
    }
  }

  const sampleQueries = getSampleQueries(tables);

  return (
    <ToolPage icon={Terminal} title="SQL Playground" description="Run SQL queries against local files using DuckDB."
      pageTitle="SQL Playground — Query Files Offline | Anatini.dev" metaDescription={getToolMetaDescription("sql-playground")} seoContent={getToolSeo("sql-playground")}>
      <div className="relative grid gap-6 lg:grid-cols-[280px_1fr]">
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
                accept={[".csv", ".parquet", ".json", ".xlsx", ".xls"]}
                onFile={handleFile}
                label="Add a file (CSV, Parquet, JSON, Excel)"
                sampleAction={tables.length === 0 ? { label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) } : undefined}
              />
              <UrlInput onFile={handleFile} accept={[".csv", ".parquet", ".json", ".xlsx", ".xls"]} placeholder="https://example.com/data.csv" label="Or load from URL" />
            </div>
          )}

          {tables.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary shrink-0" />
                {renamingTable === t.name ? (
                  <form
                    className="flex-1 flex items-center gap-1"
                    onSubmit={(e) => { e.preventDefault(); handleRenameTable(t.name, renameValue); }}
                  >
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-6 text-xs font-mono px-1"
                      autoFocus
                      onBlur={() => handleRenameTable(t.name, renameValue)}
                      onKeyDown={(e) => { if (e.key === "Escape") setRenamingTable(null); }}
                    />
                  </form>
                ) : (
                  <>
                    <span className="font-mono text-sm font-medium truncate">{t.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{t.rowCount.toLocaleString()} rows</span>
                    <button
                      onClick={() => { setRenamingTable(t.name); setRenameValue(t.name); }}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                      title="Rename table"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveTable(t.name)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                      title="Remove table"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground/60 truncate">{t.fileName}</div>
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
        <div className="space-y-2">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border pb-1 overflow-x-auto">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`group flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t-md cursor-pointer transition-colors ${
                  tab.id === activeTabId
                    ? "bg-card border border-border border-b-transparent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.label}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={addTab}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Resizable editor + results */}
          <ResizablePanelGroup direction="vertical" className="min-h-[500px] rounded-lg border border-border">
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full">
                <SqlEditor
                  value={activeTab.sql}
                  onChange={(v) => updateTab(activeTab.id, { sql: v })}
                  onRun={handleRun}
                  onInsertRef={editorInsertRef}
                  schema={editorSchema}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className="h-full overflow-auto p-3 space-y-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleRun()} disabled={activeTab.loading || !activeTab.sql.trim()}>
                    <Play className="h-4 w-4 mr-1" /> Run
                  </Button>
                  {sampleQueries.length > 0 && (
                    <div className="relative">
                      <Button variant="outline" size="sm" onClick={() => setShowSamples(!showSamples)}>
                        Samples <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                      {showSamples && (
                        <div className="absolute top-full left-0 mt-1 z-10 border-2 border-border bg-card rounded-md shadow-lg min-w-[250px]">
                          {sampleQueries.map((q, i) => (
                            <button key={i} onClick={() => { updateTab(activeTab.id, { sql: q.sql }); setShowSamples(false); }}
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
                  >
                    <History className="h-4 w-4 mr-1" /> History
                    {history.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                        {history.length}
                      </span>
                    )}
                  </Button>
                  {activeTab.result && (
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
                        {activeTab.result.rowCount.toLocaleString()} rows
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
                      <div className="max-h-[200px] overflow-auto divide-y divide-border/50">
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => { updateTab(activeTab.id, { sql: h.sql }); setShowHistory(false); }}
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

                {activeTab.loading && <LoadingState message="Running query..." />}
                {activeTab.error && <ErrorAlert message={activeTab.error} />}

                {activeTab.result && (
                  <DataTable columns={activeTab.result.columns} rows={activeTab.result.rows} types={activeTab.result.types} className="max-h-[400px]" />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </ToolPage>
  );
}
