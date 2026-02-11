import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { BarChart3, AlertTriangle, AlertCircle, Info, FlaskConical, Download, FileText, FileJson, FileSpreadsheet, ClipboardCopy, ExternalLink } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, formatBytes, sanitizeTableName, downloadBlob } from "@/lib/duckdb-helpers";
import { getSampleProfilerCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
  histogram?: { bucket: string; count: number }[];
  // String-specific stats
  strLenMin?: number;
  strLenMax?: number;
  strLenAvg?: number;
  patterns?: { label: string; count: number; pct: number }[];
  whitespaceOnly?: number;
  // Boolean stats
  boolTrue?: number;
  boolFalse?: number;
  // Date stats
  dateRange?: string;
}

interface Finding {
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestedFix?: string;
}

function ColumnCard({ col, totalRows }: { col: ColumnProfile; totalRows: number }) {
  const isNumeric = col.mean !== undefined;
  const isBool = col.boolTrue !== undefined;
  const maxCount = col.topValues.length > 0 ? col.topValues[0].count : 1;
  const nullBarPct = Math.min(col.nullPct, 100);
  const distinctPct = totalRows > 0 ? Math.min((col.distinctCount / totalRows) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-mono text-sm font-semibold truncate" title={col.name}>{col.name}</h4>
          <span className="text-[11px] font-mono text-muted-foreground">{col.type}</span>
        </div>
        {col.nullPct > 50 && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
        {col.nullPct > 10 && col.nullPct <= 50 && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-muted-foreground">Completeness</span>
            <span className="font-mono">{(100 - col.nullPct).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${col.nullPct > 50 ? "bg-destructive" : col.nullPct > 10 ? "bg-warning" : "bg-primary"}`} style={{ width: `${100 - nullBarPct}%` }} />
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

      {isNumeric && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div><span className="text-muted-foreground">Mean:</span> <span className="font-mono">{col.mean}</span></div>
          <div><span className="text-muted-foreground">Median:</span> <span className="font-mono">{col.median}</span></div>
          <div><span className="text-muted-foreground">Std Dev:</span> <span className="font-mono">{col.stddev}</span></div>
          <div><span className="text-muted-foreground">Range:</span> <span className="font-mono">{col.min}–{col.max}</span></div>
        </div>
      )}

      {/* Boolean donut */}
      {isBool && col.boolTrue !== undefined && col.boolFalse !== undefined && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Boolean Distribution</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden flex">
              <div className="h-full bg-primary/70" style={{ width: `${(col.boolTrue / Math.max(col.boolTrue + col.boolFalse, 1)) * 100}%` }} />
              <div className="h-full bg-destructive/50" style={{ width: `${(col.boolFalse / Math.max(col.boolTrue + col.boolFalse, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>TRUE: {col.boolTrue}</span>
            <span>FALSE: {col.boolFalse}</span>
          </div>
        </div>
      )}

      {/* String length stats */}
      {col.strLenMin !== undefined && (
        <div className="grid grid-cols-3 gap-x-2 text-[11px]">
          <div><span className="text-muted-foreground">Len min:</span> <span className="font-mono">{col.strLenMin}</span></div>
          <div><span className="text-muted-foreground">max:</span> <span className="font-mono">{col.strLenMax}</span></div>
          <div><span className="text-muted-foreground">avg:</span> <span className="font-mono">{col.strLenAvg}</span></div>
        </div>
      )}

      {/* Pattern detection */}
      {col.patterns && col.patterns.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Detected Patterns</div>
          {col.patterns.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="font-mono">{p.label}</span>
              <span className="text-muted-foreground">{p.count} ({p.pct.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      )}

      {col.whitespaceOnly !== undefined && col.whitespaceOnly > 0 && (
        <div className="text-[11px] text-warning">⚠ {col.whitespaceOnly} whitespace-only values</div>
      )}

      {/* Date range */}
      {col.dateRange && (
        <div className="text-[11px]">
          <span className="text-muted-foreground">Range:</span> <span className="font-mono">{col.dateRange}</span>
        </div>
      )}

      {/* Histogram for numeric columns */}
      {col.histogram && col.histogram.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Distribution</div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={col.histogram} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {col.histogram.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--primary))" fillOpacity={0.6} />
                  ))}
                </Bar>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "11px" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {col.topValues.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Top values</div>
          {col.topValues.slice(0, 4).map((tv, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-20 truncate text-[11px] font-mono" title={tv.value}>{tv.value}</span>
              <div className="flex-1 h-3 bg-muted/30 rounded overflow-hidden">
                <div className="h-full bg-primary/50 rounded transition-all" style={{ width: `${(tv.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{tv.count}</span>
            </div>
          ))}
        </div>
      )}

      {!isNumeric && !isBool && col.min && !col.dateRange && (
        <div className="text-[11px] space-y-0.5">
          <div><span className="text-muted-foreground">Min:</span> <span className="font-mono">{col.min}</span></div>
          <div><span className="text-muted-foreground">Max:</span> <span className="font-mono">{col.max}</span></div>
        </div>
      )}
    </div>
  );
}

function QualityScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 50 ? "text-warning" : "text-destructive";
  const bg = score >= 80 ? "bg-green-500/10 border-green-500/30" : score >= 50 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";
  return (
    <div className={`rounded-lg border ${bg} p-4 text-center`}>
      <div className="text-xs text-muted-foreground">Data Quality Score</div>
      <div className={`mt-1 text-3xl font-bold ${color}`}>{score}</div>
      <div className="text-[11px] text-muted-foreground">out of 100</div>
    </div>
  );
}

export default function ProfilerPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ rowCount: number; colCount: number; nullRate: number; duplicateRows: number; emptyRows: number; qualityScore: number; memoryEstimate: string } | null>(null);
  const [columns, setColumns] = useState<ColumnProfile[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingFilter, setFindingFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  useAutoLoadFile(handleFile, !!db);

  async function handleFile(f: File) {
    if (!db) return;
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);

      // Duplicate & empty row detection
      let duplicateRows = 0;
      let emptyRows = 0;
      try {
        const dupRes = await runQuery(db, `SELECT COUNT(*) - COUNT(DISTINCT *) FROM "${tableName}"`);
        duplicateRows = Number(dupRes.rows[0]?.[0] ?? 0);
      } catch {}
      try {
        const allColsNull = info.columns.map(c => `"${c}" IS NULL`).join(" AND ");
        const emptyRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE ${allColsNull}`);
        emptyRows = Number(emptyRes.rows[0]?.[0] ?? 0);
      } catch {}

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
        let histogram: { bucket: string; count: number }[] | undefined;
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

          // Histogram
          try {
            const histRes = await runQuery(db, `
              WITH bounds AS (
                SELECT MIN("${col}")::DOUBLE as mn, MAX("${col}")::DOUBLE as mx FROM "${tableName}" WHERE "${col}" IS NOT NULL
              ),
              bucketed AS (
                SELECT CASE 
                  WHEN (SELECT mx - mn FROM bounds) = 0 THEN 0
                  ELSE LEAST(FLOOR(("${col}"::DOUBLE - (SELECT mn FROM bounds)) / NULLIF(((SELECT mx FROM bounds) - (SELECT mn FROM bounds)) / 10.0, 0))::INT, 9)
                END as bucket
                FROM "${tableName}" WHERE "${col}" IS NOT NULL
              )
              SELECT bucket, COUNT(*) as cnt FROM bucketed GROUP BY bucket ORDER BY bucket
            `);
            histogram = histRes.rows.map(r => ({ bucket: String(r[0]), count: Number(r[1]) }));
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

        // String-specific stats
        let strLenMin: number | undefined, strLenMax: number | undefined, strLenAvg: number | undefined;
        let patterns: { label: string; count: number; pct: number }[] | undefined;
        let whitespaceOnly: number | undefined;
        const isString = /VARCHAR|TEXT|STRING/i.test(info.types[i]);
        if (isString && !isNumeric) {
          try {
            const lenRes = await runQuery(db, `
              SELECT MIN(LENGTH("${col}"))::INT, MAX(LENGTH("${col}"))::INT, ROUND(AVG(LENGTH("${col}")), 1)::DOUBLE
              FROM "${tableName}" WHERE "${col}" IS NOT NULL
            `);
            strLenMin = lenRes.rows[0]?.[0] != null ? Number(lenRes.rows[0][0]) : undefined;
            strLenMax = lenRes.rows[0]?.[1] != null ? Number(lenRes.rows[0][1]) : undefined;
            strLenAvg = lenRes.rows[0]?.[2] != null ? Number(lenRes.rows[0][2]) : undefined;
          } catch {}

          // Pattern detection
          const nonNullCount = info.rowCount - nullCount;
          if (nonNullCount > 0) {
            const pats: { label: string; count: number; pct: number }[] = [];
            try {
              const emailRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'`);
              const emailCount = Number(emailRes.rows[0]?.[0] ?? 0);
              if (emailCount > 0) pats.push({ label: "Email", count: emailCount, pct: (emailCount / nonNullCount) * 100 });
            } catch {}
            try {
              const urlRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" ~ '^https?://'`);
              const urlCount = Number(urlRes.rows[0]?.[0] ?? 0);
              if (urlCount > 0) pats.push({ label: "URL", count: urlCount, pct: (urlCount / nonNullCount) * 100 });
            } catch {}
            try {
              const phoneRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" ~ '^[\\+]?[0-9\\(\\)\\-\\s\\.]{7,20}$'`);
              const phoneCount = Number(phoneRes.rows[0]?.[0] ?? 0);
              if (phoneCount > 0) pats.push({ label: "Phone", count: phoneCount, pct: (phoneCount / nonNullCount) * 100 });
            } catch {}
            if (pats.length > 0) patterns = pats;
          }

          // Whitespace-only detection
          try {
            const wsRes = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" IS NOT NULL AND TRIM("${col}") = ''`);
            whitespaceOnly = Number(wsRes.rows[0]?.[0] ?? 0);
          } catch {}
        }

        // Boolean stats
        let boolTrue: number | undefined, boolFalse: number | undefined;
        const isBool = /BOOL/i.test(info.types[i]);
        if (isBool) {
          try {
            const boolRes = await runQuery(db, `
              SELECT SUM(CASE WHEN "${col}" THEN 1 ELSE 0 END)::INT, SUM(CASE WHEN NOT "${col}" THEN 1 ELSE 0 END)::INT
              FROM "${tableName}" WHERE "${col}" IS NOT NULL
            `);
            boolTrue = Number(boolRes.rows[0]?.[0] ?? 0);
            boolFalse = Number(boolRes.rows[0]?.[1] ?? 0);
          } catch {}
        }

        // Date stats
        let dateRange: string | undefined;
        const isDate = /DATE|TIMESTAMP/i.test(info.types[i]);
        if (isDate) {
          try {
            const dateRes = await runQuery(db, `
              SELECT MIN("${col}")::VARCHAR, MAX("${col}")::VARCHAR FROM "${tableName}" WHERE "${col}" IS NOT NULL
            `);
            const minD = dateRes.rows[0]?.[0] ? String(dateRes.rows[0][0]) : null;
            const maxD = dateRes.rows[0]?.[1] ? String(dateRes.rows[0][1]) : null;
            if (minD && maxD) dateRange = `${minD} → ${maxD}`;
          } catch {}
        }

        profiles.push({
          name: col, type: info.types[i], nullCount,
          nullPct: info.rowCount > 0 ? (nullCount / info.rowCount) * 100 : 0,
          distinctCount, mean, median, stddev,
          min: statsRes.rows[0][2] ? String(statsRes.rows[0][2]) : undefined,
          max: statsRes.rows[0][3] ? String(statsRes.rows[0][3]) : undefined,
          topValues, histogram,
          strLenMin, strLenMax, strLenAvg, patterns, whitespaceOnly,
          boolTrue, boolFalse, dateRange,
        });
      }

      setColumns(profiles);
      const nullRate = totalCells > 0 ? (totalNulls / totalCells) * 100 : 0;

      // Data Quality Score (0-100)
      const completenessScore = Math.max(0, 100 - nullRate); // 0-100
      const duplicateRate = info.rowCount > 0 ? (duplicateRows / info.rowCount) * 100 : 0;
      const duplicateScore = Math.max(0, 100 - duplicateRate * 5); // penalize duplicates
      const emptyRate = info.rowCount > 0 ? (emptyRows / info.rowCount) * 100 : 0;
      const emptyScore = Math.max(0, 100 - emptyRate * 10);
      const qualityScore = Math.round((completenessScore * 0.5 + duplicateScore * 0.3 + emptyScore * 0.2));

      // Memory estimate
      const memoryEstimate = formatBytes(f.size * 2.5); // rough estimate

      setOverview({ rowCount: info.rowCount, colCount: info.columns.length, nullRate, duplicateRows, emptyRows, qualityScore, memoryEstimate });

      const fList: Finding[] = [];
      if (duplicateRows > 0) fList.push({ level: duplicateRows > info.rowCount * 0.1 ? "critical" : "warning", title: `${duplicateRows.toLocaleString()} duplicate rows`, description: `${((duplicateRows / info.rowCount) * 100).toFixed(1)}% of rows are duplicates.`, suggestedFix: "Use SELECT DISTINCT or deduplicate by key columns." });
      if (emptyRows > 0) fList.push({ level: "warning", title: `${emptyRows.toLocaleString()} empty rows`, description: "Rows where all columns are NULL.", suggestedFix: "Filter out rows where every column is null." });
      for (const p of profiles) {
        if (p.nullPct > 50) fList.push({ level: "critical", title: `High null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% of values are null.`, suggestedFix: `Consider imputing missing values or removing this column if not needed.` });
        else if (p.nullPct > 10) fList.push({ level: "warning", title: `Moderate null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% null values detected.`, suggestedFix: `Review data source for missing "${p.name}" values.` });
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
  <div class="card"><div class="label">Quality Score</div><div class="value">${overview?.qualityScore}/100</div></div>
  <div class="card"><div class="label">Null Rate</div><div class="value">${overview?.nullRate.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Duplicates</div><div class="value">${overview?.duplicateRows.toLocaleString()}</div></div>
  <div class="card"><div class="label">Empty Rows</div><div class="value">${overview?.emptyRows.toLocaleString()}</div></div>
</div>
<h2>Columns</h2>
<table><thead><tr><th>Column</th><th>Type</th><th>Nulls</th><th>Null %</th><th>Distinct</th><th>Min</th><th>Max</th></tr></thead>
<tbody>${columns.map((c) => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.nullCount}</td><td>${c.nullPct.toFixed(1)}%</td><td>${c.distinctCount}</td><td>${c.min ?? "∅"}</td><td>${c.max ?? "∅"}</td></tr>`).join("")}</tbody></table>
<h2>Findings (${findings.length})</h2>
${findings.length === 0 ? "<p>No findings — data looks clean!</p>" : findings.map((f) => `<div class="finding ${f.level}"><div class="title">${f.title}</div><div class="desc">${f.description}</div>${f.suggestedFix ? `<div class="desc" style="margin-top:.25rem;font-style:italic">💡 ${f.suggestedFix}</div>` : ""}</div>`).join("")}
<div class="footer">Generated by SwiftDataTools.com · 100% offline</div>
</body></html>`;
    downloadBlob(html, `${file?.name ?? "profile"}_report.html`, "text/html");
    toast({ title: "HTML report downloaded" });
  }

  function copyToClipboard() {
    if (!overview) return;
    const lines = [
      `Profile Report: ${file?.name}`,
      `Quality Score: ${overview.qualityScore}/100`,
      `Rows: ${overview.rowCount} | Columns: ${overview.colCount} | Null Rate: ${overview.nullRate.toFixed(1)}%`,
      `Duplicates: ${overview.duplicateRows} | Empty rows: ${overview.emptyRows}`,
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
      pageTitle="Data Profiler — Analyze CSV Quality Online | SwiftDataTools.com" metaDescription={getToolMetaDescription("data-profiler")} seoContent={getToolSeo("data-profiler")}>
      <div className="space-y-6">
        {!file && (
          <div className="space-y-4">
            <ToggleButton
              options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
              value={inputMode}
              onChange={setInputMode}
            />
            {inputMode === "file" ? (
              <div className="space-y-3">
                <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Drop a dataset to profile" />
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleProfilerCSV())}>
                    <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                  </Button>
                </div>
              </div>
            ) : (
              <UrlInput onFile={handleFile} accept={[".csv", ".parquet", ".json"]} placeholder="https://example.com/data.csv" label="Load dataset from URL" />
            )}
          </div>
        )}
        {loading && <LoadingState message="Profiling dataset..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {file && overview && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={overview.rowCount} columns={overview.colCount} />
                {storedFileId && <InspectLink fileId={storedFileId} format={file.name.endsWith('.json') ? 'json' : file.name.endsWith('.parquet') ? 'parquet' : 'csv'} />}
              </div>
              <div className="flex gap-2">
                <Link to="/sql-playground">
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in SQL Playground</Button>
                </Link>
                <Button variant="outline" onClick={() => { setFile(null); setOverview(null); setColumns([]); setFindings([]); }}>New file</Button>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="columns">Columns</TabsTrigger>
                <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <QualityScoreBadge score={overview.qualityScore} />
                  {[
                    { label: "Rows", value: overview.rowCount.toLocaleString() },
                    { label: "Columns", value: overview.colCount },
                    { label: "Null Rate", value: overview.nullRate.toFixed(1) + "%" },
                    { label: "Duplicates", value: overview.duplicateRows.toLocaleString() },
                    { label: "Empty Rows", value: overview.emptyRows.toLocaleString() },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="mt-1 text-2xl font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Dataset Info</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Memory estimate</span><span className="font-mono">{overview.memoryEstimate}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">File size</span><span className="font-mono">{formatBytes(file.size)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Findings</span><span className="font-mono">{findings.length}</span></div>
                    </div>
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
                    <button key={level} onClick={() => setFindingFilter(level)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${findingFilter === level ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
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

            <CrossToolLinks format={file.name.endsWith('.json') ? 'json' : file.name.endsWith('.parquet') ? 'parquet' : 'csv'} fileId={storedFileId ?? undefined} />
          </>
        )}
      </div>
    </ToolPage>
  );
}
