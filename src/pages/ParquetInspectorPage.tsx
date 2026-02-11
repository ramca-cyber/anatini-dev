import { useState, useEffect, useRef } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { useSearchParams } from "react-router-dom";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Search, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { DuckDBGate } from "@/components/shared/DuckDBGate";

import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { generateSampleParquet } from "@/lib/sample-data";

interface FileOverview {
  rows: number;
  columns: number;
  rowGroups: number;
  compression: string;
  createdBy: string;
  parquetVersion?: string;
}

interface ColumnDetail {
  name: string;
  type: string;
  encoding: string;
  compression: string;
  nullCount: number;
  compressedSize: number;
  uncompressedSize: number;
}

interface RowGroupInfo {
  group: number;
  rows: number;
  compressedSize: number;
  uncompressedSize: number;
  ratio: string;
}

export default function ParquetInspectorPage() {
  const { db } = useDuckDB();
  const { addFile, getFile } = useFileStore();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [overview, setOverview] = useState<FileOverview | null>(null);
  const [schemaData, setSchemaData] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [rowGroups, setRowGroups] = useState<RowGroupInfo[]>([]);
  const [kvMeta, setKvMeta] = useState<{ key: string; value: string }[]>([]);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [columnDetails, setColumnDetails] = useState<ColumnDetail[]>([]);
  const [parquetWarnings, setParquetWarnings] = useState<string[]>([]);
  const [tab, setTab] = useState<"overview" | "columns" | "rowgroups" | "metadata" | "preview">("overview");
  const autoLoaded = useRef(false);

  useEffect(() => {
    if (autoLoaded.current || !db) return;
    const fileId = searchParams.get("fileId");
    if (fileId) {
      const stored = getFile(fileId);
      if (stored) { autoLoaded.current = true; setStoredFileId(fileId); processFile(stored.file); }
    }
  }, [db]);

  async function processFile(f: File) {
    if (!db) return;
    setFile(f); setLoading(true); setError(null);
    setOverview(null); setSchemaData(null); setRowGroups([]); setKvMeta([]); setPreview(null); setColumnDetails([]); setParquetWarnings([]); setTab("overview");
    try {
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);

      // File-level metadata
      let rowGroupCount = 0;
      let compression = "Unknown";
      let createdBy = "Unknown";
      let parquetVersion: string | undefined;
      try {
        const fileMeta = await runQuery(db, `SELECT * FROM parquet_file_metadata('${f.name}')`);
        if (fileMeta.rows[0]) {
          const createdIdx = fileMeta.columns.indexOf("created_by");
          const rgIdx = fileMeta.columns.indexOf("num_row_groups");
          const verIdx = fileMeta.columns.indexOf("version");
          if (createdIdx >= 0) createdBy = String(fileMeta.rows[0][createdIdx] ?? "Unknown");
          if (rgIdx >= 0) rowGroupCount = Number(fileMeta.rows[0][rgIdx] ?? 0);
          if (verIdx >= 0) parquetVersion = String(fileMeta.rows[0][verIdx] ?? "");
        }
      } catch {}

      // Row group details
      const rgs: RowGroupInfo[] = [];
      try {
        const meta = await runQuery(db, `SELECT * FROM parquet_metadata('${f.name}')`);
        const compIdx = meta.columns.indexOf("compression");
        const compressedIdx = meta.columns.indexOf("total_compressed_size");
        const uncompIdx = meta.columns.indexOf("total_uncompressed_size");
        const rowsIdx = meta.columns.indexOf("num_values");
        const rgIdIdx = meta.columns.indexOf("row_group_id");

        if (compIdx >= 0 && meta.rows[0]) compression = String(meta.rows[0][compIdx] ?? "Unknown");

        // Group by row_group_id
        const rgMap = new Map<number, { rows: number; compressed: number; uncompressed: number }>();
        for (const row of meta.rows) {
          const rgId = rgIdIdx >= 0 ? Number(row[rgIdIdx] ?? 0) : 0;
          if (!rgMap.has(rgId)) rgMap.set(rgId, { rows: 0, compressed: 0, uncompressed: 0 });
          const rg = rgMap.get(rgId)!;
          if (rowsIdx >= 0) rg.rows = Math.max(rg.rows, Number(row[rowsIdx] ?? 0));
          if (compressedIdx >= 0) rg.compressed += Number(row[compressedIdx] ?? 0);
          if (uncompIdx >= 0) rg.uncompressed += Number(row[uncompIdx] ?? 0);
        }

        for (const [id, data] of rgMap) {
          const ratio = data.uncompressed > 0 ? (data.uncompressed / data.compressed).toFixed(1) : "—";
          rgs.push({ group: id, rows: data.rows, compressedSize: data.compressed, uncompressedSize: data.uncompressed, ratio: `${ratio}×` });
        }
        if (rowGroupCount === 0) rowGroupCount = rgMap.size;
      } catch {}
      setRowGroups(rgs);

      setOverview({ rows: info.rowCount, columns: info.columns.length, rowGroups: rowGroupCount, compression, createdBy, parquetVersion });

      // Build enriched column details from parquet_metadata
      const colDetails: ColumnDetail[] = [];
      try {
        const meta = await runQuery(db, `SELECT * FROM parquet_metadata('${f.name}')`);
        const nameIdx = meta.columns.indexOf("path_in_schema");
        const encIdx = meta.columns.indexOf("encoding");
        const compIdx = meta.columns.indexOf("compression");
        const nullIdx = meta.columns.indexOf("stats_null_count");
        const compSizeIdx = meta.columns.indexOf("total_compressed_size");
        const uncompSizeIdx = meta.columns.indexOf("total_uncompressed_size");
        const typeIdx = meta.columns.indexOf("type");

        const colMap = new Map<string, ColumnDetail>();
        for (const row of meta.rows) {
          const name = nameIdx >= 0 ? String(row[nameIdx] ?? "") : "";
          if (!name) continue;
          if (!colMap.has(name)) {
            colMap.set(name, {
              name,
              type: typeIdx >= 0 ? String(row[typeIdx] ?? "") : "",
              encoding: encIdx >= 0 ? String(row[encIdx] ?? "") : "",
              compression: compIdx >= 0 ? String(row[compIdx] ?? "") : "",
              nullCount: 0,
              compressedSize: 0,
              uncompressedSize: 0,
            });
          }
          const detail = colMap.get(name)!;
          if (nullIdx >= 0) detail.nullCount += Number(row[nullIdx] ?? 0);
          if (compSizeIdx >= 0) detail.compressedSize += Number(row[compSizeIdx] ?? 0);
          if (uncompSizeIdx >= 0) detail.uncompressedSize += Number(row[uncompSizeIdx] ?? 0);
        }
        colDetails.push(...colMap.values());
      } catch {}
      setColumnDetails(colDetails);

      // Parquet warnings
      const pWarns: string[] = [];
      if (rowGroupCount > 100) pWarns.push(`High row group count (${rowGroupCount}). Consider merging for better read performance.`);
      const highNullCols = colDetails.filter(c => info.rowCount > 0 && c.nullCount / info.rowCount > 0.5);
      if (highNullCols.length > 0) pWarns.push(`${highNullCols.length} column(s) are >50% null: ${highNullCols.map(c => c.name).join(", ")}`);
      const dictEncodings = colDetails.filter(c => c.encoding.includes("DICT") || c.encoding.includes("RLE_DICTIONARY"));
      if (dictEncodings.length > 0) pWarns.push(`${dictEncodings.length}/${colDetails.length} columns use dictionary encoding`);
      setParquetWarnings(pWarns);

      // Schema
      try {
        const schema = await runQuery(db, `SELECT * FROM parquet_schema('${f.name}')`);
        setSchemaData({ columns: schema.columns, rows: schema.rows });
      } catch {}

      // KV metadata
      try {
        const fileMeta = await runQuery(db, `SELECT * FROM parquet_file_metadata('${f.name}')`);
        const kvIdx = fileMeta.columns.indexOf("key_value_metadata");
        if (kvIdx >= 0 && fileMeta.rows[0]) {
          const raw = fileMeta.rows[0][kvIdx];
          if (raw && typeof raw === "object") {
            const entries = Array.isArray(raw) ? raw : Object.entries(raw).map(([k, v]) => ({ key: k, value: String(v) }));
            setKvMeta(entries.map((e: any) => ({ key: String(e.key ?? ""), value: String(e.value ?? "").slice(0, 200) })));
          }
        }
      } catch {}

      // Data preview
      const prev = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(prev);
    } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); } finally { setLoading(false); }
  }

  function handleFile(f: File) {
    const stored = addFile(f);
    setStoredFileId(stored.id);
    processFile(f);
  }

  const totalCompressed = rowGroups.reduce((s, r) => s + r.compressedSize, 0);
  const totalUncompressed = rowGroups.reduce((s, r) => s + r.uncompressedSize, 0);
  const done = file && overview && !loading;

  const tabs: ["overview" | "columns" | "rowgroups" | "metadata" | "preview", string][] = [
    ["overview", "Overview"], ["columns", "Column Schema"], ["rowgroups", "Row Groups"], ["metadata", "Metadata"], ["preview", "Data Preview"],
  ];

  return (
    <ToolPage icon={Search} title="Parquet Inspector" description="Deep-dive into Parquet file metadata, row groups, and column statistics." metaDescription={getToolMetaDescription("parquet-inspector")} seoContent={getToolSeo("parquet-inspector")}>
      <DuckDBGate>
        <div className="space-y-6">
          {!file && !loading && (
            <div className="space-y-4">
              <ToggleButton
                options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
                value={inputMode}
                onChange={setInputMode}
              />
              {inputMode === "file" ? (
                <div className="space-y-3">
                  <DropZone accept={[".parquet", ".pq"]} onFile={handleFile} label="Drop a Parquet file" />
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={async () => { if (db) { const f = await generateSampleParquet(db); handleFile(f); } }}>
                      <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                    </Button>
                  </div>
                </div>
              ) : (
                <UrlInput onFile={handleFile} accept={[".parquet"]} placeholder="https://example.com/data.parquet" label="Load Parquet from URL" />
              )}
            </div>
          )}

          {loading && <LoadingState message="Analyzing Parquet metadata..." />}
          {error && <ErrorAlert message={error} />}

          {done && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={overview.rows} columns={overview.columns} />
                <Button variant="outline" onClick={() => { setFile(null); setOverview(null); setSchemaData(null); setRowGroups([]); setKvMeta([]); setPreview(null); setColumnDetails([]); setParquetWarnings([]); }}>New file</Button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b-2 border-border overflow-x-auto">
                {tabs.map(([v, label]) => (
                  <button key={v} onClick={() => setTab(v)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${tab === v ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {tab === "overview" && (
                <div className="border-2 border-border">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                    {[
                      ["File size (disk)", formatBytes(file.size)],
                      ["Uncompressed size", totalUncompressed > 0 ? formatBytes(totalUncompressed) : "—"],
                      ["Compression ratio", totalCompressed > 0 && totalUncompressed > 0 ? `${(totalUncompressed / totalCompressed).toFixed(1)}× (${Math.round((1 - totalCompressed / totalUncompressed) * 100)}% reduction)` : "—"],
                      ["Rows", overview.rows.toLocaleString()],
                      ["Columns", String(overview.columns)],
                      ["Row groups", String(overview.rowGroups)],
                      ["Compression", overview.compression],
                      ["Created by", overview.createdBy],
                      ...(overview.parquetVersion ? [["Parquet version", overview.parquetVersion]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="bg-card px-4 py-3"><div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div><div className="text-sm font-medium font-mono break-all">{v}</div></div>
                    ))}
                  </div>
                </div>
              )}

              {/* Column Schema */}
              {tab === "columns" && (
                <div className="space-y-4">
                  {columnDetails.length > 0 && (
                    <div className="overflow-auto border-2 border-border max-h-[500px]">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b-2 border-border bg-muted/50">{["Column", "Physical Type", "Encoding", "Compression", "Nulls", "Compressed", "Uncompressed"].map(h => <th key={h} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                        <tbody>
                          {columnDetails.map((col) => (
                            <tr key={col.name} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-1.5 font-mono font-medium">{col.name}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{col.type}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{col.encoding}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{col.compression}</td>
                              <td className={`px-3 py-1.5 font-mono ${col.nullCount > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{col.nullCount.toLocaleString()}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{formatBytes(col.compressedSize)}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{formatBytes(col.uncompressedSize)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {schemaData && (
                    <details className="border-2 border-border">
                      <summary className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer bg-muted/50">Raw Schema (parquet_schema)</summary>
                      <div className="overflow-auto max-h-[300px]">
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-border bg-muted/30">{schemaData.columns.map(c => <th key={c} className="px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{c}</th>)}</tr></thead>
                          <tbody>
                            {schemaData.rows.map((row, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                                {row.map((val, j) => <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[200px] truncate">{val === null ? <span className="text-muted-foreground/40">∅</span> : String(val)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                  {!schemaData && columnDetails.length === 0 && <p className="text-xs text-muted-foreground">Schema information not available for this file.</p>}
                </div>
              )}

              {/* Row Groups */}
              {tab === "rowgroups" && rowGroups.length > 0 && (
                <div className="overflow-auto border-2 border-border">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b-2 border-border bg-muted/50">{["Group #", "Rows", "Compressed", "Uncompressed", "Ratio"].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>)}</tr></thead>
                    <tbody>
                      {rowGroups.map((rg) => (
                        <tr key={rg.group} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-mono">{rg.group}</td>
                          <td className="px-3 py-1.5 font-mono">{rg.rows.toLocaleString()}</td>
                          <td className="px-3 py-1.5 font-mono">{formatBytes(rg.compressedSize)}</td>
                          <td className="px-3 py-1.5 font-mono">{formatBytes(rg.uncompressedSize)}</td>
                          <td className="px-3 py-1.5 font-mono">{rg.ratio}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-muted/30 font-bold">
                        <td className="px-3 py-2">TOTAL</td>
                        <td className="px-3 py-2 font-mono">{overview.rows.toLocaleString()}</td>
                        <td className="px-3 py-2 font-mono">{formatBytes(totalCompressed)}</td>
                        <td className="px-3 py-2 font-mono">{formatBytes(totalUncompressed)}</td>
                        <td className="px-3 py-2 font-mono">{totalCompressed > 0 ? `${(totalUncompressed / totalCompressed).toFixed(1)}×` : "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "rowgroups" && rowGroups.length === 0 && <p className="text-xs text-muted-foreground">Row group information not available.</p>}

              {/* KV Metadata */}
              {tab === "metadata" && (
                <div className="space-y-4">
                  <div className="border-2 border-border p-4 space-y-2">
                    <div className="text-xs"><strong>Rows:</strong> {overview.rows.toLocaleString()}</div>
                    <div className="text-xs"><strong>Columns:</strong> {overview.columns}</div>
                    <div className="text-xs"><strong>Row groups:</strong> {overview.rowGroups}</div>
                    <div className="text-xs"><strong>Compression:</strong> {overview.compression}</div>
                    <div className="text-xs"><strong>Created by:</strong> {overview.createdBy}</div>
                  </div>
                  {kvMeta.length > 0 ? (
                    <div className="border-2 border-border">
                      <div className="border-b-2 border-border border-l-4 border-l-foreground bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Key-Value Metadata</div>
                      <div className="divide-y divide-border/50">
                        {kvMeta.map((kv, i) => (
                          <div key={i} className="px-4 py-2 text-xs">
                            <span className="font-bold font-mono">{kv.key}:</span> <span className="font-mono text-muted-foreground break-all">{kv.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No custom key-value metadata found.</p>}
                </div>
              )}

              {/* Data Preview */}
              {tab === "preview" && preview && (
                <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
              )}

              {/* Warnings */}
              {parquetWarnings.length > 0 && (
                <div className="border-2 border-border">
                  <div className="border-b-2 border-border border-l-4 border-l-amber-500 bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Observations ({parquetWarnings.length})</div>
                  <div className="divide-y divide-border/50">
                    {parquetWarnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 text-sm">{w}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <CrossToolLinks format="parquet" fileId={storedFileId ?? undefined} />
            </div>
          )}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
