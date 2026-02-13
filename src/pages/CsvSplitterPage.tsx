import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Scissors, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
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

type SplitMode = "rows" | "column";

interface SplitPart {
  label: string;
  rowCount: number;
  sql: string;
}

export default function CsvSplitterPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  const [splitMode, setSplitMode] = useState<SplitMode>("rows");
  const [chunkSize, setChunkSize] = useState(1000);
  const [splitColumn, setSplitColumn] = useState("");

  const [parts, setParts] = useState<SplitPart[] | null>(null);
  const [previewPart, setPreviewPart] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [showInputPreview, setShowInputPreview] = useState(false);
  const [inputPreview, setInputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);

  const fileExt = file?.name.split(".").pop()?.toLowerCase() ?? "csv";
  const format = fileExt === "parquet" ? "parquet" : fileExt === "json" || fileExt === "jsonl" ? "json" : "csv";

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setParts(null);
    setPreviewPart(null);
    setPreviewData(null);
    setInputPreview(null);
    setSplitColumn("");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
      if (info.rowCount <= 1000) setChunkSize(Math.max(1, Math.floor(info.rowCount / 2)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleSplit() {
    if (!db || !meta) return;
    setLoading(true);
    setError(null);
    setParts(null);
    setPreviewPart(null);
    setPreviewData(null);
    try {
      const splitParts: SplitPart[] = [];
      if (splitMode === "rows") {
        const numParts = Math.ceil(meta.rowCount / chunkSize);
        for (let i = 0; i < numParts; i++) {
          const offset = i * chunkSize;
          const sql = `SELECT * FROM "${tableName}" LIMIT ${chunkSize} OFFSET ${offset}`;
          const countRes = await runQuery(db, `SELECT COUNT(*) as cnt FROM (${sql})`);
          const cnt = Number(countRes.rows[0][0]);
          splitParts.push({ label: `Part ${i + 1} (rows ${offset + 1}–${offset + cnt})`, rowCount: cnt, sql });
        }
      } else {
        if (!splitColumn) { setError("Select a column to split by"); setLoading(false); return; }
        const distinctRes = await runQuery(db, `SELECT DISTINCT "${splitColumn}" FROM "${tableName}" ORDER BY "${splitColumn}"`);
        for (const row of distinctRes.rows) {
          const val = row[0];
          const valStr = val === null ? "NULL" : String(val);
          const condition = val === null ? `"${splitColumn}" IS NULL` : `"${splitColumn}"::VARCHAR = '${String(val).replace(/'/g, "''")}'`;
          const sql = `SELECT * FROM "${tableName}" WHERE ${condition}`;
          const countRes = await runQuery(db, `SELECT COUNT(*) FROM (${sql})`);
          const cnt = Number(countRes.rows[0][0]);
          splitParts.push({ label: `${splitColumn} = ${valStr} (${cnt} rows)`, rowCount: cnt, sql });
        }
      }
      setParts(splitParts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePreviewPart(idx: number) {
    if (!db || !parts) return;
    if (previewPart === idx) { setPreviewPart(null); setPreviewData(null); return; }
    setPreviewPart(idx);
    const res = await runQuery(db, parts[idx].sql + " LIMIT 100");
    setPreviewData(res);
  }

  async function handleDownloadPart(idx: number) {
    if (!db || !parts) return;
    const csv = await exportToCSV(db, parts[idx].sql);
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "split";
    downloadBlob(csv, `${baseName}_part${idx + 1}.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setParts(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setPreviewPart(null); setPreviewData(null);
  }

  return (
    <ToolPage icon={Scissors} title="CSV Splitter" description="Split large datasets by row count or column value into smaller files." pageTitle="CSV Splitter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("csv-splitter")} seoContent={getToolSeo("csv-splitter")}>
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
                  label="Drop a data file to split"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
              ) : (
                <UrlInput onFile={handleFile} accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} placeholder="https://example.com/data.csv" label="Load data from URL" />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format={format} />}
                </div>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>

              {/* Options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-bold">Split by</label>
                    <ToggleButton
                      options={[{ label: "Row Count", value: "rows" }, { label: "Column Value", value: "column" }]}
                      value={splitMode}
                      onChange={(v) => setSplitMode(v as SplitMode)}
                    />
                  </div>
                  {splitMode === "rows" ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground font-bold">Rows per file</label>
                      <input
                        type="number"
                        min={1}
                        max={meta.rowCount}
                        value={chunkSize}
                        onChange={e => setChunkSize(Math.max(1, Number(e.target.value)))}
                        className="border border-border bg-background px-2 py-1 text-xs w-24"
                      />
                      <span className="text-xs text-muted-foreground">→ {Math.ceil(meta.rowCount / chunkSize)} parts</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground font-bold">Column</label>
                      <select
                        value={splitColumn}
                        onChange={e => setSplitColumn(e.target.value)}
                        className="border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="">Select…</option>
                        {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <Button onClick={handleSplit} disabled={loading}>
                  <Scissors className="h-4 w-4 mr-1" /> Split
                </Button>
              </div>

              {/* OUTPUT */}
              {parts && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Split Result</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="font-bold">{parts.length}</span> <span className="text-muted-foreground">parts</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="font-bold">{meta.rowCount.toLocaleString()}</span> <span className="text-muted-foreground">total rows</span></span>
                  </div>
                  <div className="space-y-2">
                    {parts.map((part, i) => (
                      <div key={i} className="border border-border">
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
                          <button onClick={() => handlePreviewPart(i)} className="text-xs font-mono hover:text-primary transition-colors flex items-center gap-1">
                            {previewPart === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {part.label}
                          </button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPart(i)}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                        </div>
                        {previewPart === i && previewData && (
                          <div className="p-2">
                            <DataTable columns={previewData.columns} rows={previewData.rows} types={previewData.types} className="max-h-[300px]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/csv-splitter" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
