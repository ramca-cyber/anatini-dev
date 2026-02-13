import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { TableProperties, Download, CheckCircle2, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
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
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile, bigIntReplacer } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

type AggFn = "count" | "sum" | "avg" | "min" | "max";
const AGG_OPTIONS: { label: string; value: AggFn }[] = [
  { label: "Count", value: "count" },
  { label: "Sum", value: "sum" },
  { label: "Average", value: "avg" },
  { label: "Min", value: "min" },
  { label: "Max", value: "max" },
];

export default function PivotTablePage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  // Pivot config
  const [rowFields, setRowFields] = useState<string[]>([]);
  const [pivotColumn, setPivotColumn] = useState("");
  const [valueColumn, setValueColumn] = useState("");
  const [aggFn, setAggFn] = useState<AggFn>("count");

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
    setRowFields([]);
    setPivotColumn("");
    setValueColumn("");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
      // Auto-select first column as row field
      if (info.columns.length >= 3) {
        setRowFields([info.columns[0]]);
        setPivotColumn(info.columns[1]);
        setValueColumn(info.columns[2]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handlePivot() {
    if (!db || !meta || !pivotColumn) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();
    try {
      // Build a GROUP BY pivot using CASE WHEN for broad compatibility
      // First get distinct pivot values
      const pivotVals = await runQuery(db, `SELECT DISTINCT "${pivotColumn}" FROM "${tableName}" WHERE "${pivotColumn}" IS NOT NULL ORDER BY "${pivotColumn}" LIMIT 50`);
      const pivotValues = pivotVals.rows.map(r => r[0]);

      if (pivotValues.length === 0) throw new Error("No distinct values found in pivot column");
      if (pivotValues.length > 50) throw new Error("Pivot column has too many distinct values (max 50)");

      const groupBy = rowFields.length > 0 ? rowFields.map(f => `"${f}"`).join(", ") : "";
      const valExpr = valueColumn ? `"${valueColumn}"` : "1";

      const pivotCols = pivotValues.map(v => {
        const safeAlias = String(v).replace(/"/g, '""');
        const safeVal = typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v;
        return `${aggFn}(CASE WHEN "${pivotColumn}" = ${safeVal} THEN ${valExpr} END) AS "${safeAlias}"`;
      }).join(",\n  ");

      const sql = groupBy
        ? `SELECT ${groupBy}, ${pivotCols} FROM "${tableName}" GROUP BY ${groupBy} ORDER BY ${groupBy}`
        : `SELECT ${pivotCols} FROM "${tableName}"`;

      const res = await runQuery(db, sql);
      const durationMs = Math.round(performance.now() - start);
      setResult({ ...res, durationMs });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pivot failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db || !result) return;
    const header = result.columns.map(c => c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c).join(",");
    const rows = result.rows.map(row =>
      row.map(v => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const csv = header + "\n" + rows + "\n";
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "pivot";
    downloadBlob(csv, `${baseName}_pivot.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setRowFields([]); setPivotColumn(""); setValueColumn("");
  }

  const availableForRow = meta?.columns.filter(c => c !== pivotColumn && c !== valueColumn) ?? [];

  return (
    <ToolPage icon={TableProperties} title="Pivot Table Builder" description="Build pivot tables with configurable row, column, and value fields." pageTitle="Pivot Table Builder — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("pivot-table")} seoContent={getToolSeo("pivot-table")}>
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
                <DropZone accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} onFile={handleFile} label="Drop a data file to pivot" sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }} />
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

              {/* Pivot config */}
              <div className="space-y-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Row Fields (GROUP BY)</label>
                    <div className="flex flex-wrap items-center gap-1">
                      {rowFields.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 border border-border bg-background px-2 py-0.5 text-xs">
                          {f}
                          <button onClick={() => setRowFields(prev => prev.filter(x => x !== f))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                      {availableForRow.length > 0 && (
                        <select
                          value=""
                          onChange={e => { if (e.target.value) setRowFields(prev => [...prev, e.target.value]); }}
                          className="border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="">+ Add</option>
                          {availableForRow.filter(c => !rowFields.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Pivot Column (spread)</label>
                    <select value={pivotColumn} onChange={e => setPivotColumn(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value="">Select…</option>
                      {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Value Column</label>
                    <select value={valueColumn} onChange={e => setValueColumn(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value="">(count rows)</option>
                      {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Aggregation</label>
                    <select value={aggFn} onChange={e => setAggFn(e.target.value as AggFn)} className="border border-border bg-background px-2 py-1 text-xs">
                      {AGG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handlePivot} disabled={loading || !pivotColumn}>
                    <TableProperties className="h-4 w-4 mr-1" /> Build Pivot
                  </Button>
                </div>
              </div>

              {/* OUTPUT */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="font-bold">{result.rowCount.toLocaleString()} rows</span> <span className="text-muted-foreground">×</span> <span className="font-bold">{result.columns.length} columns</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span><span className="text-muted-foreground">in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                  </div>
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" /> Download Pivot CSV
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

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/pivot-table" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
