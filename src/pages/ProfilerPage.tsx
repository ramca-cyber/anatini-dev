import { useState } from "react";
import { BarChart3, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName, type QueryResult } from "@/lib/duckdb-helpers";

interface ColumnProfile {
  name: string;
  type: string;
  nullCount: number;
  nullPct: number;
  distinctCount: number;
  min?: string;
  max?: string;
  topValues: { value: string; count: number }[];
}

interface Finding {
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
}

export default function ProfilerPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ rowCount: number; colCount: number; nullRate: number } | null>(null);
  const [columns, setColumns] = useState<ColumnProfile[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);

      // Column profiling
      const profiles: ColumnProfile[] = [];
      let totalNulls = 0;
      const totalCells = info.rowCount * info.columns.length;

      for (let i = 0; i < info.columns.length; i++) {
        const col = info.columns[i];
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
          name: col,
          type: info.types[i],
          nullCount,
          nullPct: info.rowCount > 0 ? (nullCount / info.rowCount) * 100 : 0,
          distinctCount,
          min: statsRes.rows[0][2] ? String(statsRes.rows[0][2]) : undefined,
          max: statsRes.rows[0][3] ? String(statsRes.rows[0][3]) : undefined,
          topValues,
        });
      }

      setColumns(profiles);
      const nullRate = totalCells > 0 ? (totalNulls / totalCells) * 100 : 0;
      setOverview({ rowCount: info.rowCount, colCount: info.columns.length, nullRate });

      // Generate findings
      const fList: Finding[] = [];
      for (const p of profiles) {
        if (p.nullPct > 50) fList.push({ level: "critical", title: `High null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% of values are null.` });
        else if (p.nullPct > 10) fList.push({ level: "warning", title: `Moderate null rate in "${p.name}"`, description: `${p.nullPct.toFixed(1)}% null values detected.` });
        if (p.distinctCount === 1 && info.rowCount > 1) fList.push({ level: "warning", title: `Constant column "${p.name}"`, description: "Contains only one unique value — may be redundant." });
        if (p.distinctCount === info.rowCount && info.rowCount > 1) fList.push({ level: "info", title: `Unique column "${p.name}"`, description: "Every value is unique — potential identifier/key." });
      }
      setFindings(fList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profiling failed");
    } finally {
      setLoading(false);
    }
  }

  const levelIcon = { critical: AlertCircle, warning: AlertTriangle, info: Info };
  const levelColor = { critical: "border-destructive/50 bg-destructive/10 text-destructive", warning: "border-warning/50 bg-warning/10 text-warning", info: "border-primary/50 bg-primary/10 text-primary" };

  return (
    <ToolPage icon={BarChart3} title="Data Quality Profiler" description="Profile datasets for nulls, duplicates, outliers and quality issues.">
      <div className="space-y-6">
        {!file && <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Drop a dataset to profile" />}
        {loading && <LoadingState message="Profiling dataset..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {file && overview && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <FileInfo name={file.name} size={formatBytes(file.size)} rows={overview.rowCount} columns={overview.colCount} />
              <Button variant="outline" onClick={() => { setFile(null); setOverview(null); setColumns([]); setFindings([]); }}>New file</Button>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="columns">Columns</TabsTrigger>
                <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
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
              </TabsContent>

              <TabsContent value="columns" className="pt-4">
                <DataTable
                  columns={["Column", "Type", "Nulls", "Null %", "Distinct", "Min", "Max"]}
                  rows={columns.map((c) => [c.name, c.type, c.nullCount, c.nullPct.toFixed(1) + "%", c.distinctCount, c.min ?? "∅", c.max ?? "∅"])}
                  className="max-h-[500px]"
                />
              </TabsContent>

              <TabsContent value="findings" className="space-y-3 pt-4">
                {findings.length === 0 && <p className="text-sm text-muted-foreground">No findings — your data looks clean!</p>}
                {findings.map((f, i) => {
                  const Icon = levelIcon[f.level];
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-lg border p-4 ${levelColor[f.level]}`}>
                      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{f.title}</div>
                        <div className="text-sm opacity-80">{f.description}</div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ToolPage>
  );
}
