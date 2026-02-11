import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { GitCompare, Download } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSVBefore, getSampleCSVAfter } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

type RowFilter = "all" | "added" | "removed" | "modified";

export default function DiffPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeFileId, setBeforeFileId] = useState<string | null>(null);
  const [afterFileId, setAfterFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeMeta, setBeforeMeta] = useState<{ rowCount: number; columns: string[]; types: string[] } | null>(null);
  const [afterMeta, setAfterMeta] = useState<{ rowCount: number; columns: string[]; types: string[] } | null>(null);
  const [summary, setSummary] = useState<{ added: number; removed: number; modified: number; unchanged: number } | null>(null);
  const [diffRows, setDiffRows] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [allDiffRows, setAllDiffRows] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [joinKey, setJoinKey] = useState<string>("");
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [filter, setFilter] = useState<RowFilter>("all");
  const [columnChanges, setColumnChanges] = useState<{ added: string[]; removed: string[] } | null>(null);

  async function loadFile(f: File, prefix: string) {
    if (!db) return null;
    const tableName = prefix + "_" + sanitizeTableName(f.name);
    const info = await registerFile(db, f, tableName);
    return { tableName, ...info };
  }

  async function handleBefore(f: File) {
    if (!db) return;
    const stored = addFile(f);
    setBeforeFileId(stored.id);
    setBeforeFile(f);
    setLoading(true);
    setError(null);
    try {
      const info = await loadFile(f, "before");
      if (info) setBeforeMeta({ rowCount: info.rowCount, columns: info.columns, types: info.types });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load before file");
    } finally {
      setLoading(false);
    }
  }

  async function handleAfter(f: File) {
    if (!db) return;
    const stored = addFile(f);
    setAfterFileId(stored.id);
    setAfterFile(f);
    setLoading(true);
    setError(null);
    try {
      const info = await loadFile(f, "after");
      if (info) {
        setAfterMeta({ rowCount: info.rowCount, columns: info.columns, types: info.types });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load after file");
    } finally {
      setLoading(false);
    }
  }

  // After both are loaded, detect common columns and auto-select join key
  function detectJoinKey() {
    if (!beforeMeta || !afterMeta || !db) return;
    const common = beforeMeta.columns.filter(c => afterMeta.columns.includes(c));
    setAvailableKeys(common);

    // Column-level changes
    const addedCols = afterMeta.columns.filter(c => !beforeMeta.columns.includes(c));
    const removedCols = beforeMeta.columns.filter(c => !afterMeta.columns.includes(c));
    setColumnChanges({ added: addedCols, removed: removedCols });

    // Auto-detect: pick first column as likely key (often id/pk)
    // Better heuristic: pick column with name containing 'id' or first column
    const idCol = common.find(c => /^id$/i.test(c)) || common.find(c => /id/i.test(c)) || common[0];
    if (idCol && !joinKey) setJoinKey(idCol);
  }

  // Detect when both files are loaded
  const bothLoaded = beforeMeta && afterMeta;
  if (bothLoaded && availableKeys.length === 0) detectJoinKey();

  async function runDiff() {
    if (!db || !beforeFile || !afterFile || !joinKey) return;
    setLoading(true);
    setError(null);
    try {
      const bTable = "before_" + sanitizeTableName(beforeFile.name);
      const aTable = "after_" + sanitizeTableName(afterFile.name);
      const common = beforeMeta!.columns.filter(c => afterMeta!.columns.includes(c));
      const nonKeyCommon = common.filter(c => c !== joinKey);

      // Added: keys in after not in before
      const addedRes = await runQuery(db, `SELECT COUNT(*) FROM "${aTable}" a WHERE NOT EXISTS (SELECT 1 FROM "${bTable}" b WHERE a."${joinKey}" = b."${joinKey}")`);
      const added = Number(addedRes.rows[0][0]);

      // Removed: keys in before not in after
      const removedRes = await runQuery(db, `SELECT COUNT(*) FROM "${bTable}" b WHERE NOT EXISTS (SELECT 1 FROM "${aTable}" a WHERE a."${joinKey}" = b."${joinKey}")`);
      const removed = Number(removedRes.rows[0][0]);

      // Modified: same key, different values in any non-key common column
      let modified = 0;
      if (nonKeyCommon.length > 0) {
        const diffCondition = nonKeyCommon.map(c => `a."${c}" IS DISTINCT FROM b."${c}"`).join(" OR ");
        const modifiedRes = await runQuery(db, `SELECT COUNT(*) FROM "${bTable}" b INNER JOIN "${aTable}" a ON a."${joinKey}" = b."${joinKey}" WHERE ${diffCondition}`);
        modified = Number(modifiedRes.rows[0][0]);
      }

      // Unchanged
      let unchanged = 0;
      if (nonKeyCommon.length > 0) {
        const sameCondition = nonKeyCommon.map(c => `a."${c}" IS NOT DISTINCT FROM b."${c}"`).join(" AND ");
        const unchangedRes = await runQuery(db, `SELECT COUNT(*) FROM "${bTable}" b INNER JOIN "${aTable}" a ON a."${joinKey}" = b."${joinKey}" WHERE ${sameCondition}`);
        unchanged = Number(unchangedRes.rows[0][0]);
      } else {
        const unchangedRes = await runQuery(db, `SELECT COUNT(*) FROM "${bTable}" b INNER JOIN "${aTable}" a ON a."${joinKey}" = b."${joinKey}"`);
        unchanged = Number(unchangedRes.rows[0][0]);
      }

      setSummary({ added, removed, modified, unchanged });

      // Build diff preview rows
      const allCols = afterMeta!.columns;
      const colList = allCols.map(c => `"${c}"`).join(", ");
      const bColList = beforeMeta!.columns.map(c => `"${c}"`).join(", ");

      let diffSqlParts: string[] = [];
      // Added rows
      diffSqlParts.push(`SELECT 'added' as _status, ${colList} FROM "${aTable}" a WHERE NOT EXISTS (SELECT 1 FROM "${bTable}" b WHERE a."${joinKey}" = b."${joinKey}")`);
      // Removed rows
      diffSqlParts.push(`SELECT 'removed' as _status, ${bColList} FROM "${bTable}" b WHERE NOT EXISTS (SELECT 1 FROM "${aTable}" a WHERE a."${joinKey}" = b."${joinKey}")`);
      // Modified rows (show after version)
      if (nonKeyCommon.length > 0) {
        const diffCondition = nonKeyCommon.map(c => `a."${c}" IS DISTINCT FROM b."${c}"`).join(" OR ");
        diffSqlParts.push(`SELECT 'modified' as _status, ${colList} FROM "${aTable}" a INNER JOIN "${bTable}" b ON a."${joinKey}" = b."${joinKey}" WHERE ${diffCondition}`);
      }

      const fullSql = diffSqlParts.join("\nUNION ALL\n");
      const preview = await runQuery(db, fullSql + " LIMIT 500");
      setAllDiffRows(preview);
      setDiffRows(preview);
      setFilter("all");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diff failed");
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(f: RowFilter) {
    setFilter(f);
    if (!allDiffRows) return;
    if (f === "all") {
      setDiffRows(allDiffRows);
    } else {
      setDiffRows({
        columns: allDiffRows.columns,
        rows: allDiffRows.rows.filter(r => r[0] === f),
      });
    }
  }

  async function handleExportDiffCSV() {
    if (!allDiffRows) return;
    const header = allDiffRows.columns.join(",") + "\n";
    const rows = allDiffRows.rows.map(r => r.map(v => {
      const s = v === null || v === undefined ? "" : typeof v === "bigint" ? v.toString() : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")).join("\n");
    downloadBlob(header + rows, "diff_results.csv", "text/csv");
    toast({ title: "Diff CSV downloaded" });
  }

  function handleExportDiffJSON() {
    if (!summary || !allDiffRows) return;
    const report = {
      generatedAt: new Date().toISOString(),
      before: beforeFile?.name, after: afterFile?.name,
      joinKey, summary, columnChanges,
      changes: allDiffRows.rows.map((row) => {
        const obj: Record<string, any> = {};
        allDiffRows.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      }),
    };
    downloadBlob(
      JSON.stringify(report, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2),
      "diff_results.json", "application/json"
    );
    toast({ title: "Diff JSON downloaded" });
  }

  const neitherLoaded = !beforeFile && !afterFile;

  async function loadSampleData() {
    await handleBefore(getSampleCSVBefore());
    await handleAfter(getSampleCSVAfter());
  }

  function reset() {
    setBeforeFile(null); setAfterFile(null); setBeforeMeta(null); setAfterMeta(null);
    setSummary(null); setDiffRows(null); setAllDiffRows(null); setJoinKey(""); setAvailableKeys([]);
    setColumnChanges(null); setFilter("all"); setBeforeFileId(null); setAfterFileId(null);
  }

  const detectFormat = (name: string) => {
    if (/\.parquet$/i.test(name)) return "parquet" as const;
    return "csv" as const;
  };

  return (
    <ToolPage icon={GitCompare} title="Dataset Diff" description="Compare two dataset versions to see added, removed and modified rows."
      pageTitle="Dataset Diff — Compare CSV Files Online | Anatini.dev" metaDescription={getToolMetaDescription("diff")} seoContent={getToolSeo("diff")}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Before</p>
          {!beforeFile ? (
              <div className="space-y-2">
                <DropZone accept={[".csv", ".parquet"]} onFile={handleBefore} label="Drop the 'before' file" />
                <UrlInput onFile={handleBefore} accept={[".csv", ".parquet"]} placeholder="https://example.com/before.csv" />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <FileInfo name={beforeFile.name} size={formatBytes(beforeFile.size)} rows={beforeMeta?.rowCount} columns={beforeMeta?.columns.length} />
                {beforeFileId && <InspectLink fileId={beforeFileId} format={detectFormat(beforeFile.name)} />}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">After</p>
          {!afterFile ? (
              <div className="space-y-2">
                <DropZone accept={[".csv", ".parquet"]} onFile={handleAfter} label="Drop the 'after' file" />
                <UrlInput onFile={handleAfter} accept={[".csv", ".parquet"]} placeholder="https://example.com/after.csv" />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <FileInfo name={afterFile.name} size={formatBytes(afterFile.size)} rows={afterMeta?.rowCount} columns={afterMeta?.columns.length} />
                {afterFileId && <InspectLink fileId={afterFileId} format={detectFormat(afterFile.name)} />}
              </div>
            )}
          </div>
        </div>

        {neitherLoaded && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadSampleData}
              className="inline-flex items-center gap-1.5 border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
            >
              ⚗ Try with sample data
            </button>
          </div>
        )}

        {bothLoaded && !summary && (
          <div className="space-y-4">
            {/* Join key selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-muted-foreground">Join key:</label>
              <Select value={joinKey} onValueChange={setJoinKey}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select join key" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Auto-detected. Change if needed.</span>
            </div>

            {/* Column changes */}
            {columnChanges && (columnChanges.added.length > 0 || columnChanges.removed.length > 0) && (
              <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
                <div className="font-medium text-muted-foreground">Column Changes</div>
                {columnChanges.added.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-success">+ Added:</span>
                    {columnChanges.added.map(c => <span key={c} className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-success">{c}</span>)}
                  </div>
                )}
                {columnChanges.removed.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-destructive">− Removed:</span>
                    {columnChanges.removed.map(c => <span key={c} className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive">{c}</span>)}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={runDiff} disabled={loading || !joinKey}>Compare</Button>
              <Button variant="outline" onClick={reset}>Reset</Button>
            </div>
          </div>
        )}

        {loading && <LoadingState message="Comparing datasets..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
                <div className="text-2xl font-bold text-success">+{summary.added}</div>
                <div className="text-xs text-muted-foreground">Added</div>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <div className="text-2xl font-bold text-destructive">−{summary.removed}</div>
                <div className="text-xs text-muted-foreground">Removed</div>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-center">
                <div className="text-2xl font-bold text-warning">~{summary.modified}</div>
                <div className="text-xs text-muted-foreground">Modified</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <div className="text-2xl font-bold">{summary.unchanged}</div>
                <div className="text-xs text-muted-foreground">Unchanged</div>
              </div>
            </div>

            {/* Row filter toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <ToggleButton
                options={[
                  { label: "All", value: "all" },
                  { label: "Added", value: "added" },
                  { label: "Removed", value: "removed" },
                  { label: "Modified", value: "modified" },
                ]}
                value={filter}
                onChange={applyFilter}
              />

              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportDiffCSV}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportDiffJSON}>
                  <Download className="h-4 w-4 mr-1" /> JSON
                </Button>
              </div>
            </div>

            {diffRows && diffRows.rows.length > 0 && (
              <DataTable columns={diffRows.columns} rows={diffRows.rows} className="max-h-[500px]" />
            )}

            <Button variant="outline" onClick={reset}>Reset</Button>
          </>
        )}

        {beforeFile && <CrossToolLinks format={detectFormat(beforeFile.name)} fileId={beforeFileId ?? undefined} excludeRoute="/dataset-diff" />}
        {afterFile && afterFile.name !== beforeFile?.name && <CrossToolLinks format={detectFormat(afterFile.name)} fileId={afterFileId ?? undefined} excludeRoute="/dataset-diff" />}
      </div>
    </ToolPage>
  );
}
