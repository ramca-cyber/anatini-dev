import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Shuffle, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
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

type SampleMode = "rows" | "percent";

export default function DataSamplerPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  // Sample config
  const [sampleMode, setSampleMode] = useState<SampleMode>("rows");
  const [sampleRows, setSampleRows] = useState(1000);
  const [samplePercent, setSamplePercent] = useState(10);
  const [seed, setSeed] = useState<number | null>(null);
  const [stratifyColumn, setStratifyColumn] = useState<string>("");

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
    setStratifyColumn("");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
      // Auto-set reasonable defaults
      if (info.rowCount <= 1000) {
        setSampleRows(Math.max(1, Math.floor(info.rowCount / 2)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleSample() {
    if (!db || !meta) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();
    try {
      let sql: string;
      if (stratifyColumn) {
        // Stratified sampling: proportional sample from each group
        const limit = sampleMode === "rows" ? sampleRows : Math.ceil(meta.rowCount * samplePercent / 100);
        const seedExpr = seed !== null ? `setseed(${seed / 100});` : "";
        if (seedExpr) {
          const conn = await db.connect();
          try { await conn.query(`SELECT setseed(${seed! / 100})`); } finally { await conn.close(); }
        }
        sql = `
          WITH ranked AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY "${stratifyColumn}" ORDER BY random()) AS _rn,
                   COUNT(*) OVER (PARTITION BY "${stratifyColumn}") AS _grp_cnt,
                   COUNT(*) OVER () AS _total_cnt
            FROM "${tableName}"
          )
          SELECT * EXCLUDE (_rn, _grp_cnt, _total_cnt)
          FROM ranked
          WHERE _rn <= GREATEST(1, ROUND(_grp_cnt::DOUBLE / _total_cnt * ${limit}))
          ORDER BY random()
        `;
      } else if (sampleMode === "percent") {
        const seedClause = seed !== null ? ` REPEATABLE(${seed})` : "";
        sql = `SELECT * FROM "${tableName}" USING SAMPLE ${samplePercent} PERCENT (bernoulli${seedClause})`;
      } else {
        const seedClause = seed !== null ? ` REPEATABLE(${seed})` : "";
        const n = Math.min(sampleRows, meta.rowCount);
        sql = `SELECT * FROM "${tableName}" USING SAMPLE ${n} ROWS (reservoir${seedClause})`;
      }
      const res = await runQuery(db, sql);
      const durationMs = Math.round(performance.now() - start);
      setResult({ ...res, durationMs });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sampling failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db || !result) return;
    let sql: string;
    // Re-run the same query for full download
    if (stratifyColumn) {
      const limit = sampleMode === "rows" ? sampleRows : Math.ceil((meta?.rowCount ?? 0) * samplePercent / 100);
      sql = `
        WITH ranked AS (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY "${stratifyColumn}" ORDER BY random()) AS _rn,
                 COUNT(*) OVER (PARTITION BY "${stratifyColumn}") AS _grp_cnt,
                 COUNT(*) OVER () AS _total_cnt
          FROM "${tableName}"
        )
        SELECT * EXCLUDE (_rn, _grp_cnt, _total_cnt)
        FROM ranked
        WHERE _rn <= GREATEST(1, ROUND(_grp_cnt::DOUBLE / _total_cnt * ${limit}))
      `;
    } else if (sampleMode === "percent") {
      sql = `SELECT * FROM "${tableName}" USING SAMPLE ${samplePercent} PERCENT (bernoulli)`;
    } else {
      sql = `SELECT * FROM "${tableName}" USING SAMPLE ${Math.min(sampleRows, meta?.rowCount ?? 0)} ROWS (reservoir)`;
    }
    // For download we use the already-computed result
    const csv = await exportToCSV(db, `SELECT * FROM "${tableName}" LIMIT 0`);
    // Actually build CSV from result
    const header = result.columns.map(c => c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c).join(",");
    const rows = result.rows.map(row =>
      row.map(v => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const csvContent = header + "\n" + rows + "\n";
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "sample";
    downloadBlob(csvContent, `${baseName}_sample.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setStratifyColumn("");
  }

  return (
    <ToolPage icon={Shuffle} title="Data Sampler" description="Extract a random or stratified sample from large datasets." pageTitle="Data Sampler — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("data-sampler")} seoContent={getToolSeo("data-sampler")}>
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
                  label="Drop a data file to sample"
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

              {/* Options + Sample row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-bold">Mode</label>
                    <ToggleButton
                      options={[{ label: "N Rows", value: "rows" }, { label: "Percent", value: "percent" }]}
                      value={sampleMode}
                      onChange={setSampleMode}
                    />
                  </div>
                  {sampleMode === "rows" ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground font-bold">Rows</label>
                      <input
                        type="number"
                        min={1}
                        max={meta.rowCount}
                        value={sampleRows}
                        onChange={e => setSampleRows(Math.max(1, Number(e.target.value)))}
                        className="border border-border bg-background px-2 py-1 text-xs w-24"
                      />
                      <span className="text-xs text-muted-foreground">of {meta.rowCount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground font-bold">%</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={samplePercent}
                        onChange={e => setSamplePercent(Math.max(1, Math.min(100, Number(e.target.value))))}
                        className="border border-border bg-background px-2 py-1 text-xs w-20"
                      />
                      <span className="text-xs text-muted-foreground">≈ {Math.ceil(meta.rowCount * samplePercent / 100).toLocaleString()} rows</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-bold">Stratify</label>
                    <select
                      value={stratifyColumn}
                      onChange={e => setStratifyColumn(e.target.value)}
                      className="border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">None</option>
                      {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Seed</summary>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Random"
                      value={seed ?? ""}
                      onChange={e => setSeed(e.target.value ? Number(e.target.value) : null)}
                      className="mt-1 border border-border bg-background px-2 py-1 text-xs w-20"
                    />
                  </details>
                </div>
                <Button onClick={handleSample} disabled={loading}>
                  <Shuffle className="h-4 w-4 mr-1" /> Sample
                </Button>
              </div>

              {/* OUTPUT */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="text-muted-foreground">Sampled</span> <span className="font-bold">{result.rowCount.toLocaleString()} rows</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="font-bold">{((result.rowCount / meta.rowCount) * 100).toFixed(1)}%</span> <span className="text-muted-foreground">of original</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="text-muted-foreground">in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                    {stratifyColumn && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span><span className="text-muted-foreground">stratified by</span> <span className="font-bold">{stratifyColumn}</span></span>
                      </>
                    )}
                  </div>
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" /> Download Sample CSV
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

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/data-sampler" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
