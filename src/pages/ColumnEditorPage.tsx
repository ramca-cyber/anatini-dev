import { useState, useCallback } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Columns3, Download, CheckCircle2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

interface ColumnDef {
  name: string;
  type: string;
  enabled: boolean;
  alias: string; // rename
}

export default function ColumnEditorPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");
  const [meta, setMeta] = useState<{ rowCount: number } | null>(null);

  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Result
  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; types: string[]; rowCount: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [inputPreview, setInputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);

  const fileExt = file?.name.split(".").pop()?.toLowerCase() ?? "csv";
  const format = fileExt === "parquet" ? "parquet" : fileExt === "json" || fileExt === "jsonl" ? "json" : "csv";

  const handleFile = useCallback(async (f: File) => {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta({ rowCount: info.rowCount });
      setColumns(info.columns.map((name, i) => ({ name, type: info.types[i], enabled: true, alias: "" })));
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, [db, addFile]);

  useAutoLoadFile(handleFile, !!db);

  function toggleColumn(idx: number) {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c));
  }

  function renameColumn(idx: number, alias: string) {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, alias } : c));
  }

  function toggleAll(enabled: boolean) {
    setColumns(prev => prev.map(c => ({ ...c, enabled })));
  }

  // Drag and drop reordering
  function handleDragStart(idx: number) {
    setDragIndex(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setColumns(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIndex(idx);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  const enabledColumns = columns.filter(c => c.enabled);

  async function handleApply() {
    if (!db || enabledColumns.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const selectParts = enabledColumns.map(c => {
        const alias = c.alias.trim();
        return alias ? `"${c.name}" AS "${alias}"` : `"${c.name}"`;
      });
      const sql = `SELECT ${selectParts.join(", ")} FROM "${tableName}"`;
      const res = await runQuery(db, sql + " LIMIT 500");
      const countRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}"`);
      setResult({ ...res, rowCount: Number(countRes.rows[0][0]) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply column changes");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db || enabledColumns.length === 0) return;
    const selectParts = enabledColumns.map(c => {
      const alias = c.alias.trim();
      return alias ? `"${c.name}" AS "${alias}"` : `"${c.name}"`;
    });
    const sql = `SELECT ${selectParts.join(", ")} FROM "${tableName}"`;
    const csv = await exportToCSV(db, sql);
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "output";
    downloadBlob(csv, `${baseName}_edited.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setColumns([]);
  }

  return (
    <ToolPage icon={Columns3} title="Column Editor" description="Select, reorder, and rename columns visually. Export the result."
      pageTitle="Column Editor — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("column-editor")} seoContent={getToolSeo("column-editor")}>
      <DuckDBGate>
        <div className="relative space-y-4">
          {!file && (
            <div className="space-y-4">
              <ToggleButton
                options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
                value={inputMode}
                onChange={setInputMode}
              />
              {inputMode === "file" ? (
                <DropZone
                  accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]}
                  onFile={handleFile}
                  label="Drop a data file to edit columns"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
              ) : (
                <UrlInput onFile={handleFile} accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} placeholder="https://example.com/data.csv" label="Load data from URL" />
              )}
            </div>
          )}

          {file && meta && columns.length > 0 && (
            <div className="space-y-4">
              {/* File info bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format={format} />}
                </div>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>

              {/* Column list */}
              <div className="border-2 border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Columns ({enabledColumns.length}/{columns.length} selected)
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAll(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Select all</button>
                    <button onClick={() => toggleAll(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Deselect all</button>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {columns.map((col, idx) => (
                    <div
                      key={col.name}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                        dragIndex === idx ? "bg-primary/10" : col.enabled ? "" : "opacity-50"
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                      <button onClick={() => toggleColumn(idx)} className="shrink-0">
                        {col.enabled ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <span className="font-mono text-sm font-medium min-w-[100px]">{col.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{col.type}</span>
                      <Input
                        placeholder="Rename..."
                        value={col.alias}
                        onChange={(e) => renameColumn(idx, e.target.value)}
                        className="ml-auto h-7 w-40 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <div className="flex gap-2">
                <Button onClick={handleApply} disabled={loading || enabledColumns.length === 0}>
                  Apply Changes
                </Button>
                <span className="self-center text-xs text-muted-foreground">
                  {enabledColumns.length} column{enabledColumns.length !== 1 ? "s" : ""} · drag rows to reorder
                </span>
              </div>

              {/* OUTPUT */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="font-bold">{result.columns.length}</span> <span className="text-muted-foreground">columns</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="font-bold">{result.rowCount.toLocaleString()}</span> <span className="text-muted-foreground">rows</span></span>
                  </div>
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" /> Download Edited CSV
                  </Button>
                  <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
                </div>
              )}

              {/* INPUT PREVIEW */}
              <Collapsible open={showPreview} onOpenChange={setShowPreview}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="text-xs font-bold uppercase tracking-widest">Input Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {inputPreview && <DataTable columns={inputPreview.columns} rows={inputPreview.rows} types={inputPreview.types} className="max-h-[500px]" />}
                </CollapsibleContent>
              </Collapsible>

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/column-editor" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
