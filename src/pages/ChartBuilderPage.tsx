import { useState, useRef, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { BarChart3, Download, ChevronDown, ChevronUp, Image } from "lucide-react";
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
import { registerFile, runQuery, formatBytes, sanitizeTableName, warnLargeFile, bigIntReplacer } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";

type ChartType = "bar" | "line" | "area" | "pie" | "scatter";
const CHART_TYPES: { label: string; value: ChartType }[] = [
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
  { label: "Area", value: "area" },
  { label: "Pie", value: "pie" },
  { label: "Scatter", value: "scatter" },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210 70% 50%)",
  "hsl(150 60% 40%)",
  "hsl(30 80% 55%)",
  "hsl(340 70% 50%)",
  "hsl(270 60% 55%)",
  "hsl(180 50% 45%)",
  "hsl(60 70% 45%)",
];

export default function ChartBuilderPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  // Chart config
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xColumn, setXColumn] = useState("");
  const [yColumns, setYColumns] = useState<string[]>([]);
  const [limit, setLimit] = useState(100);

  // Data
  const [chartData, setChartData] = useState<Record<string, any>[] | null>(null);
  const [showInputPreview, setShowInputPreview] = useState(false);
  const [inputPreview, setInputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

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
    setChartData(null);
    setInputPreview(null);
    setYColumns([]);
    setXColumn("");
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
      // Auto-select: first string-like col as X, first numeric as Y
      const numericTypes = ["BIGINT", "INTEGER", "DOUBLE", "FLOAT", "DECIMAL", "SMALLINT", "TINYINT", "HUGEINT"];
      const firstStr = info.columns.find((_, i) => !numericTypes.some(t => info.types[i].toUpperCase().includes(t)));
      const firstNum = info.columns.find((_, i) => numericTypes.some(t => info.types[i].toUpperCase().includes(t)));
      if (firstStr) setXColumn(firstStr);
      else if (info.columns.length > 0) setXColumn(info.columns[0]);
      if (firstNum) setYColumns([firstNum]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  const handleBuildChart = useCallback(async () => {
    if (!db || !meta || !xColumn || yColumns.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const cols = [xColumn, ...yColumns].map(c => `"${c}"`).join(", ");
      const sql = `SELECT ${cols} FROM "${tableName}" LIMIT ${limit}`;
      const res = await runQuery(db, sql);
      const data = res.rows.map(row => {
        const obj: Record<string, any> = {};
        res.columns.forEach((col, i) => {
          const v = row[i];
          obj[col] = typeof v === "bigint" ? Number(v) : v;
        });
        return obj;
      });
      setChartData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build chart");
    } finally {
      setLoading(false);
    }
  }, [db, meta, xColumn, yColumns, tableName, limit]);

  // Auto-rebuild chart when config changes
  useEffect(() => {
    if (db && meta && xColumn && yColumns.length > 0 && tableName) {
      handleBuildChart();
    }
  }, [chartType, xColumn, yColumns, limit, tableName, handleBuildChart]);

  async function handleExportPng() {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const bbox = svg.getBoundingClientRect();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${file?.name.replace(/\.[^.]+$/, "") ?? "chart"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function resetAll() {
    setFile(null); setMeta(null); setChartData(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setYColumns([]); setXColumn("");
  }

  const toggleYColumn = (col: string) => {
    setYColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <ToolPage icon={BarChart3} title="Chart Builder" description="Create interactive charts from CSV, JSON, or Parquet data." pageTitle="Chart Builder — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("chart-builder")} seoContent={getToolSeo("chart-builder")}>
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
                <DropZone accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} onFile={handleFile} label="Drop a data file to chart" sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }} />
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

              {/* Chart config */}
              <div className="space-y-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Chart Type</label>
                    <select value={chartType} onChange={e => setChartType(e.target.value as ChartType)} className="border border-border bg-background px-2 py-1 text-xs">
                      {CHART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">X Axis / Label</label>
                    <select value={xColumn} onChange={e => setXColumn(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value="">Select…</option>
                      {meta.columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Y Axis / Values (select multiple)</label>
                    <div className="flex flex-wrap gap-1">
                      {meta.columns.filter(c => c !== xColumn).map(c => (
                        <button
                          key={c}
                          onClick={() => toggleYColumn(c)}
                          className={`border px-2 py-0.5 text-xs transition-colors ${
                            yColumns.includes(c)
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-bold">Max Rows</label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={limit}
                      onChange={e => setLimit(Math.max(10, Number(e.target.value)))}
                      className="border border-border bg-background px-2 py-1 text-xs w-24"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleBuildChart} disabled={loading || !xColumn || yColumns.length === 0}>
                    <BarChart3 className="h-4 w-4 mr-1" /> Build Chart
                  </Button>
                </div>
              </div>

              {/* Chart output */}
              {chartData && (
                <div className="space-y-3 border-2 border-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Chart</h3>
                    <Button variant="outline" size="sm" onClick={handleExportPng}>
                      <Image className="h-3 w-3 mr-1" /> Export PNG
                    </Button>
                  </div>
                  <div ref={chartRef} className="w-full h-[400px] bg-background">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey={xColumn} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <Tooltip />
                          <Legend />
                          {yColumns.map((col, i) => (
                            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </BarChart>
                      ) : chartType === "line" ? (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey={xColumn} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <Tooltip />
                          <Legend />
                          {yColumns.map((col, i) => (
                            <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} dot={false} />
                          ))}
                        </LineChart>
                      ) : chartType === "area" ? (
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey={xColumn} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <Tooltip />
                          <Legend />
                          {yColumns.map((col, i) => (
                            <Area key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
                          ))}
                        </AreaChart>
                      ) : chartType === "pie" ? (
                        <PieChart>
                          <Tooltip />
                          <Legend />
                          <Pie
                            data={chartData.map(d => ({ name: String(d[xColumn]), value: Number(d[yColumns[0]] ?? 0) }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      ) : (
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey={xColumn} name={xColumn} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <YAxis dataKey={yColumns[0]} name={yColumns[0]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                          <Legend />
                          <Scatter name={`${xColumn} vs ${yColumns[0]}`} data={chartData} fill={COLORS[0]} />
                        </ScatterChart>
                      )}
                    </ResponsiveContainer>
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

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/chart-builder" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
