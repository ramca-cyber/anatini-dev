import { useState } from "react";
import { GitCompare, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";

export default function DiffPage() {
  const { db } = useDuckDB();
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeMeta, setBeforeMeta] = useState<{ rowCount: number; columns: string[] } | null>(null);
  const [afterMeta, setAfterMeta] = useState<{ rowCount: number; columns: string[] } | null>(null);
  const [summary, setSummary] = useState<{ added: number; removed: number; common: number } | null>(null);
  const [diffPreview, setDiffPreview] = useState<{ columns: string[]; rows: any[][] } | null>(null);

  async function loadFile(f: File, prefix: string) {
    if (!db) return null;
    const tableName = prefix + "_" + sanitizeTableName(f.name);
    const info = await registerFile(db, f, tableName);
    return { tableName, ...info };
  }

  async function handleBefore(f: File) {
    if (!db) return;
    setBeforeFile(f);
    setLoading(true);
    setError(null);
    try {
      const info = await loadFile(f, "before");
      if (info) setBeforeMeta({ rowCount: info.rowCount, columns: info.columns });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load before file");
    } finally {
      setLoading(false);
    }
  }

  async function handleAfter(f: File) {
    if (!db) return;
    setAfterFile(f);
    setLoading(true);
    setError(null);
    try {
      const info = await loadFile(f, "after");
      if (info) setAfterMeta({ rowCount: info.rowCount, columns: info.columns });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load after file");
    } finally {
      setLoading(false);
    }
  }

  async function runDiff() {
    if (!db || !beforeFile || !afterFile) return;
    setLoading(true);
    setError(null);
    try {
      const bTable = "before_" + sanitizeTableName(beforeFile.name);
      const aTable = "after_" + sanitizeTableName(afterFile.name);

      const addedRes = await runQuery(db, `SELECT COUNT(*) FROM (SELECT * FROM "${aTable}" EXCEPT SELECT * FROM "${bTable}")`);
      const removedRes = await runQuery(db, `SELECT COUNT(*) FROM (SELECT * FROM "${bTable}" EXCEPT SELECT * FROM "${aTable}")`);
      const commonRes = await runQuery(db, `SELECT COUNT(*) FROM (SELECT * FROM "${bTable}" INTERSECT SELECT * FROM "${aTable}")`);

      const added = Number(addedRes.rows[0][0]);
      const removed = Number(removedRes.rows[0][0]);
      const common = Number(commonRes.rows[0][0]);
      setSummary({ added, removed, common });

      // Preview: show added & removed rows with a _diff_status column
      const preview = await runQuery(db, `
        SELECT 'added' as _status, t.* FROM (SELECT * FROM "${aTable}" EXCEPT SELECT * FROM "${bTable}") t
        UNION ALL
        SELECT 'removed' as _status, t.* FROM (SELECT * FROM "${bTable}" EXCEPT SELECT * FROM "${aTable}") t
        LIMIT 200
      `);
      setDiffPreview(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diff failed");
    } finally {
      setLoading(false);
    }
  }

  const bothLoaded = beforeMeta && afterMeta;

  return (
    <ToolPage icon={GitCompare} title="Dataset Diff" description="Compare two dataset versions to see added, removed and modified rows.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Before</p>
            {!beforeFile ? (
              <DropZone accept={[".csv", ".parquet"]} onFile={handleBefore} label="Drop the 'before' file" />
            ) : (
              <FileInfo name={beforeFile.name} size={formatBytes(beforeFile.size)} rows={beforeMeta?.rowCount} columns={beforeMeta?.columns.length} />
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">After</p>
            {!afterFile ? (
              <DropZone accept={[".csv", ".parquet"]} onFile={handleAfter} label="Drop the 'after' file" />
            ) : (
              <FileInfo name={afterFile.name} size={formatBytes(afterFile.size)} rows={afterMeta?.rowCount} columns={afterMeta?.columns.length} />
            )}
          </div>
        </div>

        {bothLoaded && !summary && (
          <div className="flex gap-2">
            <Button onClick={runDiff} disabled={loading}>Compare</Button>
            <Button variant="outline" onClick={() => { setBeforeFile(null); setAfterFile(null); setBeforeMeta(null); setAfterMeta(null); setSummary(null); setDiffPreview(null); }}>Reset</Button>
          </div>
        )}

        {loading && <LoadingState message="Comparing datasets..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {summary && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
                <div className="text-2xl font-bold text-success">+{summary.added}</div>
                <div className="text-xs text-muted-foreground">Added</div>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <div className="text-2xl font-bold text-destructive">−{summary.removed}</div>
                <div className="text-xs text-muted-foreground">Removed</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <div className="text-2xl font-bold">{summary.common}</div>
                <div className="text-xs text-muted-foreground">Unchanged</div>
              </div>
            </div>

            {diffPreview && diffPreview.rows.length > 0 && (
              <DataTable columns={diffPreview.columns} rows={diffPreview.rows} className="max-h-[500px]" />
            )}

            <Button variant="outline" onClick={() => { setBeforeFile(null); setAfterFile(null); setBeforeMeta(null); setAfterMeta(null); setSummary(null); setDiffPreview(null); }}>Reset</Button>
          </>
        )}
      </div>
    </ToolPage>
  );
}
