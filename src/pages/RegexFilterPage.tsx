import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Filter, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
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
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

export default function RegexFilterPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  // Filter config
  const [filterColumn, setFilterColumn] = useState("");
  const [pattern, setPattern] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [invertMatch, setInvertMatch] = useState(false);

  // Result
  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; types: string[]; rowCount: number; durationMs: number } | null>(null);
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
    setResult(null);
    setInputPreview(null);
    setFilterColumn("");
    setPattern("");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
      if (info.columns.length > 0) setFilterColumn(info.columns[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleFilter() {
    if (!db || !meta || !filterColumn || !pattern.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();
    try {
      const safePattern = pattern.replace(/'/g, "''");
      const flags = caseSensitive ? "'c'" : "'i'";
      const matchExpr = `regexp_matches(CAST("${filterColumn}" AS VARCHAR), '${safePattern}', ${flags})`;
      const whereClause = invertMatch ? `NOT ${matchExpr}` : matchExpr;
      const sql = `SELECT * FROM "${tableName}" WHERE ${whereClause}`;
      const res = await runQuery(db, sql);
      const durationMs = Math.round(performance.now() - start);
      setResult({ ...res, durationMs });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Filter failed — check your regex pattern");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    const header = result.columns.map(c => c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c).join(",");
    const rows = result.rows.map(row =>
      row.map(v => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const csv = header + "\n" + rows + "\n";
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "filtered";
    downloadBlob(csv, `${baseName}_filtered.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setFilterColumn(""); setPattern("");
  }

  return (
    <ToolPage icon={Filter} title="Regex Row Filter" description="Filter rows by regex pattern on any column. Preview and download matches." pageTitle="Regex Row Filter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("regex-filter")} seoContent={getToolSeo("regex-filter")}>
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
                <DropZone accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} onFile={handleFile} label="Drop a data file to filter" sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }} />
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

              {/* Filter config */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Column</label>
                    <select value={filterColumn} onChange={e => setFilterColumn(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                      {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Regex Pattern</label>
                    <input
                      type="text"
                      value={pattern}
                      onChange={e => setPattern(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleFilter(); }}
                      placeholder="e.g. ^[A-Z]{2}\\d+"
                      className="border border-border bg-background px-2 py-1 text-xs font-mono w-56"
                      spellCheck={false}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} className="accent-primary" />
                    Case sensitive
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={invertMatch} onChange={e => setInvertMatch(e.target.checked)} className="accent-primary" />
                    Invert (exclude matches)
                  </label>
                </div>
                <Button onClick={handleFilter} disabled={loading || !pattern.trim()}>
                  <Filter className="h-4 w-4 mr-1" /> Filter
                </Button>
              </div>

              {/* OUTPUT */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="font-bold">{result.rowCount.toLocaleString()} rows</span> <span className="text-muted-foreground">matched</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="font-bold">{((result.rowCount / meta.rowCount) * 100).toFixed(1)}%</span> <span className="text-muted-foreground">of original</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="text-muted-foreground">in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono text-muted-foreground">/{pattern}/</span>
                  </div>
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" /> Download Filtered CSV
                  </Button>
                  <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
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

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/regex-filter" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
