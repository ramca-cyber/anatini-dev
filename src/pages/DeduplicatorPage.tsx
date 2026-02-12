import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Copy, Download, CheckCircle2, ChevronDown, ChevronUp, Eye } from "lucide-react";
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

type KeepStrategy = "first" | "last";

export default function DeduplicatorPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  // Dedup config
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [keepStrategy, setKeepStrategy] = useState<KeepStrategy>("first");

  // Result
  const [result, setResult] = useState<{
    dedupedCount: number;
    duplicateCount: number;
    durationMs: number;
    preview: { columns: string[]; rows: any[][]; types: string[] };
  } | null>(null);
  const [duplicatePreview, setDuplicatePreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showInputPreview, setShowInputPreview] = useState(false);
  const [inputPreview, setInputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);

  const fileExt = file?.name.split(".").pop()?.toLowerCase() ?? "csv";
  const format = fileExt === "parquet" ? "parquet" : fileExt === "json" || fileExt === "jsonl" ? "json" : "csv";

  // Use all columns or selected subset
  const dedupColumns = selectedColumns.length > 0 ? selectedColumns : meta?.columns ?? [];

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    setDuplicatePreview(null);
    setSelectedColumns([]);
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  function toggleColumn(col: string) {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  }

  function selectAllColumns() {
    if (!meta) return;
    setSelectedColumns(selectedColumns.length === meta.columns.length ? [] : [...meta.columns]);
  }

  function buildDedupSQL(limit?: number) {
    const colList = dedupColumns.map(c => `"${c}"`).join(", ");
    const orderDir = keepStrategy === "first" ? "ASC" : "DESC";
    const limitClause = limit ? ` LIMIT ${limit}` : "";
    return `
      WITH ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY ${colList} ORDER BY rowid ${orderDir}) AS _dedup_rn
        FROM "${tableName}"
      )
      SELECT * EXCLUDE (_dedup_rn) FROM ranked WHERE _dedup_rn = 1${limitClause}
    `;
  }

  function buildDuplicatesSQL(limit: number) {
    const colList = dedupColumns.map(c => `"${c}"`).join(", ");
    const orderDir = keepStrategy === "first" ? "ASC" : "DESC";
    return `
      WITH ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY ${colList} ORDER BY rowid ${orderDir}) AS _dedup_rn
        FROM "${tableName}"
      )
      SELECT * EXCLUDE (_dedup_rn) FROM ranked WHERE _dedup_rn > 1 LIMIT ${limit}
    `;
  }

  async function handleDeduplicate() {
    if (!db || !meta) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDuplicatePreview(null);
    const start = performance.now();
    try {
      // Get deduped count
      const countSQL = `SELECT COUNT(*) FROM (${buildDedupSQL()})`;
      const countRes = await runQuery(db, countSQL);
      const dedupedCount = Number(countRes.rows[0][0]);
      const duplicateCount = meta.rowCount - dedupedCount;

      // Preview deduped
      const previewRes = await runQuery(db, buildDedupSQL(100));

      // Preview duplicates
      const dupRes = duplicateCount > 0 ? await runQuery(db, buildDuplicatesSQL(100)) : null;

      const durationMs = Math.round(performance.now() - start);
      setResult({ dedupedCount, duplicateCount, durationMs, preview: previewRes });
      if (dupRes) setDuplicatePreview(dupRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deduplication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db || !result) return;
    const csv = await exportToCSV(db, buildDedupSQL());
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "data";
    downloadBlob(csv, `${baseName}_deduped.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setDuplicatePreview(null);
    setInputPreview(null); setStoredFileId(null); setError(null); setSelectedColumns([]);
  }

  return (
    <ToolPage icon={Copy} title="Deduplicator" description="Find and remove duplicate rows from your datasets." pageTitle="Deduplicator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("deduplicator")} seoContent={getToolSeo("deduplicator")}>
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
                  label="Drop a data file to deduplicate"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
              ) : (
                <UrlInput onFile={handleFile} accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} placeholder="https://example.com/data.csv" label="Load data from URL" />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              {/* File info bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format={format} />}
                </div>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>

              {/* Column selection */}
              <div className="border border-border bg-muted/30 px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Uniqueness Columns</label>
                  <button onClick={selectAllColumns} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                    {selectedColumns.length === meta.columns.length ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedColumns.length === 0
                    ? "All columns will be used to determine uniqueness."
                    : `${selectedColumns.length} column${selectedColumns.length !== 1 ? "s" : ""} selected.`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.columns.map(col => (
                    <button
                      key={col}
                      onClick={() => toggleColumn(col)}
                      className={`px-2.5 py-1 text-xs border transition-colors ${
                        selectedColumns.includes(col) || selectedColumns.length === 0
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50"
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-bold">Keep</label>
                    <ToggleButton
                      options={[{ label: "First", value: "first" }, { label: "Last", value: "last" }]}
                      value={keepStrategy}
                      onChange={setKeepStrategy}
                    />
                  </div>
                  <Button onClick={handleDeduplicate} disabled={loading}>
                    <Copy className="h-4 w-4 mr-1" /> Find Duplicates
                  </Button>
                </div>
              </div>

              {/* OUTPUT */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="font-bold">{result.duplicateCount.toLocaleString()}</span> <span className="text-muted-foreground">duplicate{result.duplicateCount !== 1 ? "s" : ""} found</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="font-bold">{result.dedupedCount.toLocaleString()}</span> <span className="text-muted-foreground">unique rows</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="text-muted-foreground">in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                  </div>

                  <Button onClick={handleDownload} className="w-full" size="lg" disabled={result.duplicateCount === 0}>
                    <Download className="h-5 w-5 mr-2" /> Download Deduplicated CSV ({result.dedupedCount.toLocaleString()} rows)
                  </Button>

                  {/* Duplicate preview */}
                  {duplicatePreview && duplicatePreview.rows.length > 0 && (
                    <Collapsible open={showDuplicates} onOpenChange={setShowDuplicates}>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                        {showDuplicates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <Eye className="h-3 w-3" />
                        <span className="text-xs font-bold uppercase tracking-widest">Preview duplicates ({result.duplicateCount.toLocaleString()})</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <DataTable columns={duplicatePreview.columns} rows={duplicatePreview.rows} types={duplicatePreview.types} className="max-h-[400px]" />
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Deduped preview */}
                  <DataTable columns={result.preview.columns} rows={result.preview.rows} types={result.preview.types} className="max-h-[500px]" />
                </div>
              )}

              {/* INPUT PREVIEW */}
              <Collapsible open={showInputPreview} onOpenChange={setShowInputPreview}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showInputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="text-xs font-bold uppercase tracking-widest">Input Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {inputPreview && <DataTable columns={inputPreview.columns} rows={inputPreview.rows} types={inputPreview.types} className="max-h-[500px]" />}
                </CollapsibleContent>
              </Collapsible>

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/deduplicator" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
