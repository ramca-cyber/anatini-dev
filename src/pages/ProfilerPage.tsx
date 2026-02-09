import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { BarChart3, AlertTriangle, AlertCircle, Info, FlaskConical, Download, FileText, FileJson, FileSpreadsheet, ClipboardCopy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName, downloadBlob } from "@/lib/duckdb-helpers";
import { getSampleProfilerCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

interface ColumnProfile {
  name: string;
  type: string;
  nullCount: number;
  nullPct: number;
  distinctCount: number;
  min?: string;
  max?: string;
  mean?: string;
  median?: string;
  stddev?: string;
  topValues: { value: string; count: number }[];
}

interface Finding {
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestedFix?: string;
}

function ColumnCard({ col, totalRows }: { col: ColumnProfile; totalRows: number }) {
  const isNumeric = col.mean !== undefined;
  const maxCount = col.topValues.length > 0 ? col.topValues[0].count : 1;
  const nullBarPct = Math.min(col.nullPct, 100);
  const distinctPct = totalRows > 0 ? Math.min((col.distinctCount / totalRows) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-mono text-sm font-semibold truncate" title={col.name}>{col.name}</h4>
          <span className="text-[11px] font-mono text-muted-foreground">{col.type}</span>
        </div>
        {col.nullPct > 50 && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
        {col.nullPct > 10 && col.nullPct <= 50 && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
      </div>

      {/* Completeness + Uniqueness bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-muted-foreground">Completeness</span>
            <span className="font-mono">{(100 - col.nullPct).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${col.nullPct > 50 ? "bg-destructive" : col.nullPct > 10 ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${100 - nullBarPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-muted-foreground">Uniqueness</span>
            <span className="font-mono">{distinctPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${distinctPct}%` }} />
          </div>
        </div>
      </div>

      {/* Numeric stats */}
      {isNumeric && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div><span className="text-muted-foreground">Mean:</span> <span className="font-mono">{col.mean}</span></div>
          <div><span className="text-muted-foreground">Median:</span> <span className="font-mono">{col.median}</span></div>
          <div><span className="text-muted-foreground">Std Dev:</span> <span className="font-mono">{col.stddev}</span></div>
          <div><span className="text-muted-foreground">Range:</span> <span className="font-mono">{col.min}–{col.max}</span></div>
        </div>
      )}

      {/* Top values mini bar chart */}
      {col.topValues.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Top values</div>
          {col.topValues.slice(0, 4).map((tv, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-20 truncate text-[11px] font-mono" title={tv.value}>{tv.value}</span>
              <div className="flex-1 h-3 bg-muted/30 rounded overflow-hidden">
                <div
                  className="h-full bg-primary/50 rounded transition-all"
                  style={{ width: `${(tv.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{tv.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Non-numeric min/max */}
      {!isNumeric && col.min && (
        <div className="text-[11px] space-y-0.5">
          <div><span className="text-muted-foreground">Min:</span> <span className="font-mono">{col.min}</span></div>
          <div><span className="text-muted-foreground">Max:</span> <span className="font-mono">{col.max}</span></div>
        </div>
      )}
    </div>
  );
}

export default function ProfilerPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ rowCount: number; colCount: number; nullRate: number } | null>(null);
  const [columns, setColumns] = useState<ColumnProfile[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingFilter, setFindingFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);

      const profiles: ColumnProfile[] = [];
      let totalNulls = 0;
      const totalCells = info.rowCount * info.columns.length;

      for (let i = 0; i < info.columns.length; i++) {
        const col = info.columns[i];
        const isNumeric = /INT|FLOAT|DOUBLE|DECIMAL|NUMERIC|BIGINT|REAL/i.test(info.types[i]);

        const statsRes = await runQuery(db, `
          SELECT 
            COUNT(*) - COUNT("${col}") as null_count,
            COUNT(DISTINCT "${col}") as distinct_count,
            MIN("${col}")::VARCHAR as min_val,
            MAX("${col}")::VARCHAR as max_val
          FROM "${tableName}"
        `);
        const nullCount = Number(statsRes.rows[0][0]);
        const distinctCount = Number(statsRes.rows[0][1]);
        totalNulls += nullCount;

        let mean: string | undefined, median: string | undefined, stddev: string | undefined;
        if (isNumeric) {
          try {
            const numRes = await runQuery(db, `
              SELECT 
                ROUND(AVG("${col}")::DOUBLE, 2)::VARCHAR,
                ROUND(MEDIAN("${col}")::DOUBLE, 2)::VARCHAR,
                ROUND(STDDEV("${col}")::DOUBLE, 2)::VARCHAR
              FROM "${tableName}"
            `);
            mean = numRes.rows[0]?.[0] ? String(numRes.rows[0][0]) : undefined;
            median = numRes.rows[0]?.[1] ? String(numRes.rows[0][1]) : undefined;
            stddev = numRes.rows[0]?.[2] ? String(numRes.rows[0][2]) : undefined;
          } catch {}
        }

        let topValues: { value: string; count: number }[] = [];
        try {
          const topRes = await runQuery(db, `
            SELECT "${col}"::VARCHAR as val, COUNT(*) as cnt 
            FROM "${tableName}" WHERE "${col}" IS NOT NULL 
            GROUP BY "${col}" ORDER BY cnt DESC LIMIT 5
          `);
          topValues = topRes.rows.map((r) => ({ value: String(r[0]), count: Number(r[1]) }));
        } catch {}

        profiles.push({
          name: col, type: info.types[i], nullCount,
          nullPct: info.rowCount > 0 ? (nullCount / info.rowCount) * 100 : 0,
          distinctCount, mean, median, stddev,
          min: statsRes.rows[0][2] ? String(statsRes.rows[0][2]) : undefined,
          max: statsRes.rows[0][3] ? String(statsRes.rows[0][3]) : undefined,
          topValues,
        });
      }

      setColumns(profiles);
      const nullRate = totalCells > 0 ? (totalNulls / totalCells) * 100 : 0;
      setOverview({ rowCount: info.rowCount, colCount: info.columns.length, nullRate });

      const fList: Finding[] = [];
      for (const p of profiles) {
        if (p.nullPct > 50) fList.push({ level: "critical", title: `High null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% of values are null.`, suggestedFix: `Consider imputing missing values or removing this column if not needed.` });
        else if (p.nullPct > 10) fList.push({ level: "warning", title: `Moderate null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% null values detected.`, suggestedFix: `Review data source for missing "${p.name}" values. Consider a default value.` });
        if (p.distinctCount === 1 && info.rowCount > 1) fList.push({ level: "warning", title: `Constant column "${p.name}"`, description: "Contains only one unique value — may be redundant.", suggestedFix: "Drop this column if it adds no analytical value." });
        if (p.distinctCount === info.rowCount && info.rowCount > 1) fList.push({ level: "info", title: `Unique column "${p.name}"`, description: "Every value is unique — potential identifier/key.", suggestedFix: "Consider using this as a primary key or join key." });
      }
      setFindings(fList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profiling failed");
    } finally {
      setLoading(false);
    }
  }

  const typeDistribution = columns.reduce<Record<string, number>>((acc, c) => {
    const baseType = c.type.replace(/\(.*\)/, "").toUpperCase();
    acc[baseType] = (acc[baseType] || 0) + 1;
    return acc;
  }, {});
  const maxTypeCount = Math.max(...Object.values(typeDistribution), 1);

  function exportJSON() {
    const report = { file: file?.name, generatedAt: new Date().toISOString(), overview, columns: columns.map(c => ({ ...c })), findings };
    downloadBlob(JSON.stringify(report, null, 2), `${file?.name ?? "profile"}_report.json`, "application/json");
    toast({ title: "JSON report downloaded" });
  }

  function exportCSV() {
    const header = "Column,Type,Nulls,Null %,Distinct,Min,Max,Mean,Median,StdDev\n";
    const rows = columns.map((c) =>
      [c.name, c.type, c.nullCount, c.nullPct.toFixed(1), c.distinctCount, c.min ?? "", c.max ?? "", c.mean ?? "", c.median ?? "", c.stddev ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    downloadBlob(header + rows, `${file?.name ?? "profile"}_summary.csv`, "text/csv");
    toast({ title: "CSV summary downloaded" });
  }

  function exportHTML() {
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profile Report — ${file?.name ?? "Dataset"}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;max-width:900px;margin:0 auto;padding:2rem}
  h1{color:#58d5e3}h2{color:#8b949e;border-bottom:1px solid #21262d;padding-bottom:.5rem}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1rem 0}
  .card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:1rem}
  .card .label{font-size:.75rem;color:#8b949e}.card .value{font-size:1.5rem;font-weight:700;margin-top:.25rem}
  table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{text-align:left;padding:.5rem .75rem;border-bottom:1px solid #21262d}
  th{background:#161b22;color:#8b949e;font-size:.75rem;text-transform:uppercase}
  td{font-family:'JetBrains Mono',monospace;font-size:.8rem}
  .finding{padding:1rem;border-radius:8px;margin:.5rem 0;border-left:4px solid}
  .critical{background:#3d1115;border-color:#f85149;color:#f85149}
  .warning{background:#3d2e00;border-color:#d29922;color:#d29922}
  .info{background:#0d1d30;border-color:#58d5e3;color:#58d5e3}
  .finding .title{font-weight:600}.finding .desc{opacity:.8;font-size:.9rem;margin-top:.25rem}
  .footer{text-align:center;color:#484f58;margin-top:3rem;font-size:.8rem}
</style></head><body>
<h1>📊 Profile Report</h1>
<p style="color:#8b949e">File: <strong>${file?.name}</strong> · Generated: ${new Date().toLocaleString()}</p>
<h2>Overview</h2>
<div class="cards">
  <div class="card"><div class="label">Rows</div><div class="value">${overview?.rowCount.toLocaleString()}</div></div>
  <div class="card"><div class="label">Columns</div><div class="value">${overview?.colCount}</div></div>
  <div class="card"><div class="label">Null Rate</div><div class="value">${overview?.nullRate.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Findings</div><div class="value">${findings.length}</div></div>
</div>
<h2>Columns</h2>
<table><thead><tr><th>Column</th><th>Type</th><th>Nulls</th><th>Null %</th><th>Distinct</th><th>Min</th><th>Max</th></tr></thead>
<tbody>${columns.map((c) => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.nullCount}</td><td>${c.nullPct.toFixed(1)}%</td><td>${c.distinctCount}</td><td>${c.min ?? "∅"}</td><td>${c.max ?? "∅"}</td></tr>`).join("")}</tbody></table>
<h2>Findings (${findings.length})</h2>
${findings.length === 0 ? "<p>No findings — data looks clean!</p>" : findings.map((f) => `<div class="finding ${f.level}"><div class="title">${f.title}</div><div class="desc">${f.description}</div>${f.suggestedFix ? `<div class="desc" style="margin-top:.25rem;font-style:italic">💡 ${f.suggestedFix}</div>` : ""}</div>`).join("")}
<div class="footer">Generated by Anatini.dev · 100% offline</div>
</body></html>`;
    downloadBlob(html, `${file?.name ?? "profile"}_report.html`, "text/html");
    toast({ title: "HTML report downloaded" });
  }

  function copyToClipboard() {
    if (!overview) return;
    const lines = [
      `Profile Report: ${file?.name}`,
      `Rows: ${overview.rowCount} | Columns: ${overview.colCount} | Null Rate: ${overview.nullRate.toFixed(1)}%`,
      "", "Columns:",
      ...columns.map(c => `  ${c.name} (${c.type}) — ${c.nullPct.toFixed(1)}% null, ${c.distinctCount} distinct`),
      "", `Findings (${findings.length}):`,
      ...findings.map(f => `  [${f.level.toUpperCase()}] ${f.title}: ${f.description}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Profile copied to clipboard" });
  }

  const levelIcon = { critical: AlertCircle, warning: AlertTriangle, info: Info };
  const levelColor = { critical: "border-destructive/50 bg-destructive/10 text-destructive", warning: "border-warning/50 bg-warning/10 text-warning", info: "border-primary/50 bg-primary/10 text-primary" };
  const filteredFindings = findingFilter === "all" ? findings : findings.filter(f => f.level === findingFilter);

  return (
    <ToolPage icon={BarChart3} title="Data Quality Profiler" description="Profile datasets for nulls, duplicates, outliers and quality issues."
      pageTitle="Data Profiler — Analyze CSV Quality Online | Anatini.dev" metaDescription={getToolMetaDescription("data-profiler")} seoContent={getToolSeo("data-profiler")}>
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Drop a dataset to profile" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleProfilerCSV())}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}
        {loading && <LoadingState message="Profiling dataset..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {file && overview && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={overview.rowCount} columns={overview.colCount} />
              <Button variant="outline" onClick={() => { setFile(null); setOverview(null); setColumns([]); setFindings([]); }}>New file</Button>
            </div>

            <Tabs defaultValue="columns">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="columns">Columns</TabsTrigger>
                <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: "Rows", value: overview.rowCount.toLocaleString() },
                    { label: "Columns", value: overview.colCount },
                    { label: "Null Rate", value: overview.nullRate.toFixed(1) + "%" },
                    { label: "Findings", value: findings.length },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="mt-1 text-2xl font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Column Type Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(typeDistribution).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-mono text-muted-foreground truncate">{type}</span>
                        <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                          <div className="h-full bg-primary/60 rounded transition-all" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {findings.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Top Issues</h4>
                    {findings.slice(0, 3).map((f, i) => {
                      const Icon = levelIcon[f.level];
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Icon className={`h-3.5 w-3.5 ${f.level === "critical" ? "text-destructive" : f.level === "warning" ? "text-warning" : "text-primary"}`} />
                          <span className="text-foreground">{f.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="columns" className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {columns.map((c) => (
                    <ColumnCard key={c.name} col={c} totalRows={overview.rowCount} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="findings" className="space-y-3 pt-4">
                <div className="flex gap-2">
                  {(["all", "critical", "warning", "info"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFindingFilter(level)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        findingFilter === level
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {level === "all" ? `All (${findings.length})` : `${level.charAt(0).toUpperCase() + level.slice(1)} (${findings.filter(f => f.level === level).length})`}
                    </button>
                  ))}
                </div>

                {filteredFindings.length === 0 && <p className="text-sm text-muted-foreground">No findings match the filter.</p>}
                {filteredFindings.map((f, i) => {
                  const Icon = levelIcon[f.level];
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-lg border p-4 ${levelColor[f.level]}`}>
                      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{f.title}</div>
                        <div className="text-sm opacity-80">{f.description}</div>
                        {f.suggestedFix && <div className="mt-1 text-sm opacity-60 italic">💡 {f.suggestedFix}</div>}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="export" className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <button onClick={exportHTML} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-center"><div className="font-medium">HTML Report</div><div className="text-xs text-muted-foreground">Styled, standalone report</div></div>
                  </button>
                  <button onClick={exportJSON} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    <FileJson className="h-8 w-8 text-primary" />
                    <div className="text-center"><div className="font-medium">JSON Report</div><div className="text-xs text-muted-foreground">Machine-readable data</div></div>
                  </button>
                  <button onClick={exportCSV} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-center"><div className="font-medium">CSV Summary</div><div className="text-xs text-muted-foreground">Column stats spreadsheet</div></div>
                  </button>
                  <button onClick={copyToClipboard} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    <ClipboardCopy className="h-8 w-8 text-primary" />
                    <div className="text-center"><div className="font-medium">Clipboard</div><div className="text-xs text-muted-foreground">Copy text summary</div></div>
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ToolPage>
  );
}
