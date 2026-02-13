import { useState, useCallback } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Merge, Download, CheckCircle2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL OUTER" | "CROSS";

const JOIN_TYPES: { value: JoinType; label: string; description: string }[] = [
  { value: "INNER", label: "Inner Join", description: "Only matching rows from both" },
  { value: "LEFT", label: "Left Join", description: "All rows from left + matching right" },
  { value: "RIGHT", label: "Right Join", description: "All rows from right + matching left" },
  { value: "FULL OUTER", label: "Full Outer Join", description: "All rows from both datasets" },
  { value: "CROSS", label: "Cross Join", description: "Every combination (cartesian product)" },
];

interface FileMeta {
  file: File;
  fileId: string;
  tableName: string;
  columns: string[];
  types: string[];
  rowCount: number;
}

export default function DataMergePage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();

  const [leftMeta, setLeftMeta] = useState<FileMeta | null>(null);
  const [rightMeta, setRightMeta] = useState<FileMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [joinType, setJoinType] = useState<JoinType>("INNER");
  const [leftKey, setLeftKey] = useState("");
  const [rightKey, setRightKey] = useState("");

  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; types: string[]; rowCount: number; durationMs: number } | null>(null);

  const loadFile = useCallback(async (f: File, side: "left" | "right") => {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const tName = `${side}_${sanitizeTableName(f.name)}`;
      const info = await registerFile(db, f, tName);
      const meta: FileMeta = {
        file: f,
        fileId: stored.id,
        tableName: tName,
        columns: info.columns,
        types: info.types,
        rowCount: info.rowCount,
      };
      if (side === "left") {
        setLeftMeta(meta);
        if (!leftKey && info.columns.length > 0) setLeftKey(info.columns[0]);
      } else {
        setRightMeta(meta);
        if (!rightKey && info.columns.length > 0) setRightKey(info.columns[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to load ${side} file`);
    } finally {
      setLoading(false);
    }
  }, [db, addFile, leftKey, rightKey]);

  // Auto-detect matching key columns
  const autoDetectKeys = useCallback(() => {
    if (!leftMeta || !rightMeta) return;
    const common = leftMeta.columns.filter(c => rightMeta.columns.includes(c));
    if (common.length > 0) {
      const idCol = common.find(c => /^id$/i.test(c)) || common.find(c => /id/i.test(c)) || common[0];
      if (idCol) {
        setLeftKey(idCol);
        setRightKey(idCol);
      }
    }
  }, [leftMeta, rightMeta]);

  // Auto-detect when both files loaded
  if (leftMeta && rightMeta && leftKey === leftMeta.columns[0] && rightKey === rightMeta.columns[0]) {
    autoDetectKeys();
  }

  const detectFormat = (name: string) => {
    if (/\.parquet$/i.test(name)) return "parquet";
    if (/\.json(l)?$/i.test(name)) return "json";
    return "csv";
  };

  async function handleMerge() {
    if (!db || !leftMeta || !rightMeta) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();
    try {
      // Build column list avoiding duplicates for the join key
      const leftCols = leftMeta.columns.map(c => `l."${c}"`);
      const rightCols = rightMeta.columns
        .filter(c => joinType === "CROSS" || c !== rightKey)
        .map(c => {
          // If column name exists in left (and not the join key), alias it
          if (leftMeta.columns.includes(c) && c !== leftKey) {
            return `r."${c}" AS "${c}_right"`;
          }
          return `r."${c}"`;
        });

      const selectCols = [...leftCols, ...rightCols].join(", ");

      let sql: string;
      if (joinType === "CROSS") {
        sql = `SELECT ${selectCols} FROM "${leftMeta.tableName}" l CROSS JOIN "${rightMeta.tableName}" r`;
      } else {
        sql = `SELECT ${selectCols} FROM "${leftMeta.tableName}" l ${joinType} JOIN "${rightMeta.tableName}" r ON l."${leftKey}" = r."${rightKey}"`;
      }

      // Get count first
      const countSql = `SELECT COUNT(*) FROM (${sql}) _c`;
      const countRes = await runQuery(db, countSql);
      const totalRows = Number(countRes.rows[0][0]);

      // Get preview
      const preview = await runQuery(db, sql + " LIMIT 500");
      const durationMs = Math.round(performance.now() - start);

      setResult({ ...preview, rowCount: totalRows, durationMs });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db || !leftMeta || !rightMeta || !result) return;
    const leftCols = leftMeta.columns.map(c => `l."${c}"`);
    const rightCols = rightMeta.columns
      .filter(c => joinType === "CROSS" || c !== rightKey)
      .map(c => {
        if (leftMeta.columns.includes(c) && c !== leftKey) {
          return `r."${c}" AS "${c}_right"`;
        }
        return `r."${c}"`;
      });
    const selectCols = [...leftCols, ...rightCols].join(", ");

    let sql: string;
    if (joinType === "CROSS") {
      sql = `SELECT ${selectCols} FROM "${leftMeta.tableName}" l CROSS JOIN "${rightMeta.tableName}" r`;
    } else {
      sql = `SELECT ${selectCols} FROM "${leftMeta.tableName}" l ${joinType} JOIN "${rightMeta.tableName}" r ON l."${leftKey}" = r."${rightKey}"`;
    }

    const csv = await exportToCSV(db, sql);
    const baseName = `${leftMeta.file.name.replace(/\.[^.]+$/, "")}_merged`;
    downloadBlob(csv, `${baseName}.csv`, "text/csv");
  }

  function resetAll() {
    setLeftMeta(null); setRightMeta(null); setResult(null);
    setLeftKey(""); setRightKey(""); setJoinType("INNER");
    setError(null);
  }

  const bothLoaded = leftMeta && rightMeta;

  return (
    <ToolPage icon={Merge} title="Data Merge" description="Join two datasets visually with inner, left, right, full outer, or cross joins."
      pageTitle="Data Merge / Join — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("data-merge")} seoContent={getToolSeo("data-merge")}>
      <DuckDBGate>
        <div className="relative space-y-6">
          {/* Two file upload panels */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Left Dataset</p>
              {!leftMeta ? (
                <div className="space-y-2">
                  <DropZone accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} onFile={(f) => loadFile(f, "left")} label="Drop the left dataset" 
                    sampleAction={{ label: "⚗ Try with sample", onClick: () => loadFile(getSampleCSV(), "left") }}
                  />
                  <UrlInput onFile={(f) => loadFile(f, "left")} accept={[".csv", ".parquet"]} placeholder="https://..." />
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={leftMeta.file.name} size={formatBytes(leftMeta.file.size)} rows={leftMeta.rowCount} columns={leftMeta.columns.length} />
                  <InspectLink fileId={leftMeta.fileId} format={detectFormat(leftMeta.file.name)} />
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Right Dataset</p>
              {!rightMeta ? (
                <div className="space-y-2">
                  <DropZone accept={[".csv", ".tsv", ".json", ".jsonl", ".parquet"]} onFile={(f) => loadFile(f, "right")} label="Drop the right dataset"
                    sampleAction={{ label: "⚗ Try with sample", onClick: () => loadFile(getSampleCSV(), "right") }}
                  />
                  <UrlInput onFile={(f) => loadFile(f, "right")} accept={[".csv", ".parquet"]} placeholder="https://..." />
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={rightMeta.file.name} size={formatBytes(rightMeta.file.size)} rows={rightMeta.rowCount} columns={rightMeta.columns.length} />
                  <InspectLink fileId={rightMeta.fileId} format={detectFormat(rightMeta.file.name)} />
                </div>
              )}
            </div>
          </div>

          {/* Join configuration */}
          {bothLoaded && !result && (
            <div className="space-y-4 border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Join type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-muted-foreground">Join Type</label>
                  <Select value={joinType} onValueChange={(v) => setJoinType(v as JoinType)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOIN_TYPES.map(jt => (
                        <SelectItem key={jt.value} value={jt.value}>
                          <span className="font-medium">{jt.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">— {jt.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Key columns (hidden for CROSS) */}
                {joinType !== "CROSS" && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-muted-foreground">Left Key</label>
                      <Select value={leftKey} onValueChange={setLeftKey}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {leftMeta!.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-muted-foreground">Right Key</label>
                      <Select value={rightKey} onValueChange={setRightKey}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {rightMeta!.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleMerge} disabled={loading || (joinType !== "CROSS" && (!leftKey || !rightKey))}>
                  <Merge className="h-4 w-4 mr-1" /> Merge
                </Button>
                <Button variant="outline" onClick={resetAll}>Reset</Button>
              </div>
            </div>
          )}

          {loading && <LoadingState message="Merging datasets..." />}
          {error && <ErrorAlert message={error} />}

          {/* Result */}
          {result && (
            <div className="space-y-3 border-2 border-border p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Merge Result</h3>
              <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span><span className="font-bold">{result.rowCount.toLocaleString()}</span> <span className="text-muted-foreground">rows</span></span>
                <span className="text-muted-foreground">·</span>
                <span><span className="font-bold">{result.columns.length}</span> <span className="text-muted-foreground">columns</span></span>
                <span className="text-muted-foreground">·</span>
                <span><span className="text-muted-foreground">in</span> <span className="font-bold">{(result.durationMs / 1000).toFixed(1)}s</span></span>
                <span className="text-muted-foreground">·</span>
                <span className="font-bold">{joinType} JOIN</span>
              </div>
              <Button onClick={handleDownload} className="w-full" size="lg">
                <Download className="h-5 w-5 mr-2" /> Download Merged CSV
              </Button>
              <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
              <Button variant="outline" onClick={resetAll}>New merge</Button>
            </div>
          )}

          {leftMeta && <CrossToolLinks format={detectFormat(leftMeta.file.name)} fileId={leftMeta.fileId} excludeRoute="/data-merge" />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
