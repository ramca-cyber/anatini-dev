import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ShieldOff, Download, ChevronDown, ChevronUp } from "lucide-react";
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

type MaskStrategy = "redact" | "hash" | "fake_name" | "fake_email" | "random_int" | "shuffle";

const strategies: { value: MaskStrategy; label: string }[] = [
  { value: "redact", label: "Redact (***)" },
  { value: "hash", label: "Hash (SHA-256)" },
  { value: "fake_name", label: "Fake Name" },
  { value: "fake_email", label: "Fake Email" },
  { value: "random_int", label: "Random Number" },
  { value: "shuffle", label: "Shuffle" },
];

interface ColumnMask {
  column: string;
  strategy: MaskStrategy;
  enabled: boolean;
}

// Deterministic fake data based on hash
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Jamie", "Drew", "Sage", "Blake", "Charlie", "Dakota", "Emery", "Finley", "Harper", "Kai", "Lane", "Micah"];
const lastNames = ["Smith", "Jones", "Lee", "Chen", "Patel", "Garcia", "Kim", "Brown", "Davis", "Wilson", "Moore", "Clark", "Hall", "Young", "King", "Wright", "Lopez", "Hill", "Scott", "Adams"];
const domains = ["example.com", "test.org", "sample.net", "demo.io", "anon.dev"];

function fakeName(val: string): string {
  const h = hashCode(String(val));
  return `${firstNames[h % firstNames.length]} ${lastNames[(h >> 5) % lastNames.length]}`;
}

function fakeEmail(val: string): string {
  const h = hashCode(String(val));
  const first = firstNames[h % firstNames.length].toLowerCase();
  const last = lastNames[(h >> 5) % lastNames.length].toLowerCase();
  return `${first}.${last}@${domains[(h >> 10) % domains.length]}`;
}

export default function DataAnonymizerPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");
  const [columnMasks, setColumnMasks] = useState<ColumnMask[]>([]);

  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
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
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);
      setMeta(info);
      setColumnMasks(info.columns.map(c => ({ column: c, strategy: "redact" as MaskStrategy, enabled: false })));
      const preview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setInputPreview(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  function toggleColumn(col: string) {
    setColumnMasks(prev => prev.map(m => m.column === col ? { ...m, enabled: !m.enabled } : m));
  }

  function setStrategy(col: string, strategy: MaskStrategy) {
    setColumnMasks(prev => prev.map(m => m.column === col ? { ...m, strategy } : m));
  }

  async function handleAnonymize() {
    if (!db || !meta) return;
    const enabled = columnMasks.filter(m => m.enabled);
    if (enabled.length === 0) { setError("Select at least one column to anonymize"); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Read all data
      const allData = await runQuery(db, `SELECT * FROM "${tableName}"`);
      
      // Apply masks in JS
      const colIndices = enabled.map(m => ({ idx: allData.columns.indexOf(m.column), strategy: m.strategy, column: m.column }));
      
      // For shuffle, collect all values per column first
      const shuffled: Record<number, any[]> = {};
      for (const ci of colIndices) {
        if (ci.strategy === "shuffle") {
          const vals = allData.rows.map(r => r[ci.idx]);
          // Fisher-Yates shuffle
          for (let i = vals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [vals[i], vals[j]] = [vals[j], vals[i]];
          }
          shuffled[ci.idx] = vals;
        }
      }

      const anonymizedRows = allData.rows.map((row, rowIdx) => {
        const newRow = [...row];
        for (const ci of colIndices) {
          const val = row[ci.idx];
          const valStr = val === null ? "" : String(val);
          switch (ci.strategy) {
            case "redact": newRow[ci.idx] = "***"; break;
            case "hash": newRow[ci.idx] = hashCode(valStr).toString(16).padStart(8, "0"); break;
            case "fake_name": newRow[ci.idx] = val === null ? null : fakeName(valStr); break;
            case "fake_email": newRow[ci.idx] = val === null ? null : fakeEmail(valStr); break;
            case "random_int": newRow[ci.idx] = val === null ? null : (hashCode(valStr + rowIdx) % 10000); break;
            case "shuffle": newRow[ci.idx] = shuffled[ci.idx][rowIdx]; break;
          }
        }
        return newRow;
      });

      // Register result as a new table for export
      const resultTable = `${tableName}_anon`;
      const colDefs = allData.columns.map((c, i) => `"${c}" VARCHAR`).join(", ");
      await db.connect().then(async conn => {
        await conn.query(`DROP TABLE IF EXISTS "${resultTable}"`);
        await conn.query(`CREATE TABLE "${resultTable}" (${colDefs})`);
        // Insert in batches
        const batchSize = 500;
        for (let i = 0; i < anonymizedRows.length; i += batchSize) {
          const batch = anonymizedRows.slice(i, i + batchSize);
          const values = batch.map(row => `(${row.map(v => v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`).join(",")})`).join(",");
          await conn.query(`INSERT INTO "${resultTable}" VALUES ${values}`);
        }
        await conn.close();
      });

      // Show preview
      const preview = await runQuery(db, `SELECT * FROM "${resultTable}" LIMIT 100`);
      setResult(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anonymization failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!db) return;
    const csv = await exportToCSV(db, `SELECT * FROM "${tableName}_anon"`);
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "data";
    downloadBlob(csv, `${baseName}_anonymized.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setMeta(null); setResult(null); setInputPreview(null);
    setStoredFileId(null); setError(null); setColumnMasks([]);
  }

  const enabledCount = columnMasks.filter(m => m.enabled).length;

  return (
    <ToolPage icon={ShieldOff} title="Data Anonymizer" description="Mask, redact, or fake sensitive columns in your datasets." pageTitle="Data Anonymizer — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("data-anonymizer")} seoContent={getToolSeo("data-anonymizer")}>
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
                  label="Drop a data file to anonymize"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
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

              {/* Column mask config */}
              <div className="border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Columns to Anonymize</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {columnMasks.map(m => (
                    <div key={m.column} className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${m.enabled ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input type="checkbox" checked={m.enabled} onChange={() => toggleColumn(m.column)} className="accent-primary" />
                      <span className="font-mono truncate flex-1" title={m.column}>{m.column}</span>
                      {m.enabled && (
                        <select value={m.strategy} onChange={e => setStrategy(m.column, e.target.value as MaskStrategy)} className="border border-border bg-background px-1 py-0.5 text-xs">
                          {strategies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{enabledCount} column{enabledCount !== 1 ? "s" : ""} selected</span>
                  <Button onClick={handleAnonymize} disabled={loading || enabledCount === 0}>
                    <ShieldOff className="h-4 w-4 mr-1" /> Anonymize
                  </Button>
                </div>
              </div>

              {/* Result */}
              {result && (
                <div className="space-y-3 border-2 border-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Anonymized Preview</h3>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-3 w-3 mr-1" /> Download CSV
                    </Button>
                  </div>
                  <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
                </div>
              )}

              {/* Input preview */}
              <Collapsible open={showInputPreview} onOpenChange={setShowInputPreview}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showInputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="text-xs font-bold uppercase tracking-widest">Input Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {inputPreview && <DataTable columns={inputPreview.columns} rows={inputPreview.rows} types={inputPreview.types} className="max-h-[500px]" />}
                </CollapsibleContent>
              </Collapsible>

              <CrossToolLinks format={format} fileId={storedFileId ?? undefined} excludeRoute="/data-anonymizer" />
            </div>
          )}

          {loading && <LoadingState message="Processing..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
