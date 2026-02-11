import { useState, useEffect } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { DataTable } from "@/components/shared/DataTable";
import { runQuery, formatBytes } from "@/lib/duckdb-helpers";

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

interface ParquetOutputInspectorProps {
  db: duckdb.AsyncDuckDB;
  fileName: string;
  tableName: string;
  rowCount: number;
  columnCount: number;
  fileSize: number;
}

type TabValue = "overview" | "columns" | "rowgroups" | "preview";

export function ParquetOutputInspector({ db, fileName, tableName, rowCount, columnCount, fileSize }: ParquetOutputInspectorProps) {
  const [tab, setTab] = useState<TabValue>("overview");
  const [loading, setLoading] = useState(true);
  const [compressionCodec, setCompressionCodec] = useState("Unknown");
  const [createdBy, setCreatedBy] = useState("Unknown");
  const [rowGroupCount, setRowGroupCount] = useState(0);
  const [rowGroups, setRowGroups] = useState<RowGroupInfo[]>([]);
  const [columnDetails, setColumnDetails] = useState<ColumnDetail[]>([]);
  const [schemaData, setSchemaData] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadMetadata();
  }, [fileName]);

  async function loadMetadata() {
    setLoading(true);
    try {
      // File-level metadata
      let rgCount = 0;
      let codec = "Unknown";
      let creator = "Unknown";
      try {
        const fileMeta = await runQuery(db, `SELECT * FROM parquet_file_metadata('${fileName}')`);
        if (fileMeta.rows[0]) {
          const createdIdx = fileMeta.columns.indexOf("created_by");
          const rgIdx = fileMeta.columns.indexOf("num_row_groups");
          if (createdIdx >= 0) creator = String(fileMeta.rows[0][createdIdx] ?? "Unknown");
          if (rgIdx >= 0) rgCount = Number(fileMeta.rows[0][rgIdx] ?? 0);
        }
      } catch {}
      setCreatedBy(creator);

      // Per-column and per-row-group from parquet_metadata
      const rgs: RowGroupInfo[] = [];
      const colDetails: ColumnDetail[] = [];
      try {
        const meta = await runQuery(db, `SELECT * FROM parquet_metadata('${fileName}')`);
        const compIdx = meta.columns.indexOf("compression");
        const compressedIdx = meta.columns.indexOf("total_compressed_size");
        const uncompIdx = meta.columns.indexOf("total_uncompressed_size");
        const rowsIdx = meta.columns.indexOf("num_values");
        const rgIdIdx = meta.columns.indexOf("row_group_id");
        const nameIdx = meta.columns.indexOf("path_in_schema");
        const encIdx = meta.columns.indexOf("encoding");
        const nullIdx = meta.columns.indexOf("stats_null_count");
        const typeIdx = meta.columns.indexOf("type");

        if (compIdx >= 0 && meta.rows[0]) codec = String(meta.rows[0][compIdx] ?? "Unknown");

        // Row groups
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
        if (rgCount === 0) rgCount = rgMap.size;

        // Column details
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
          if (compressedIdx >= 0) detail.compressedSize += Number(row[compressedIdx] ?? 0);
          if (uncompIdx >= 0) detail.uncompressedSize += Number(row[uncompIdx] ?? 0);
        }
        colDetails.push(...colMap.values());
      } catch {}

      setCompressionCodec(codec);
      setRowGroupCount(rgCount);
      setRowGroups(rgs);
      setColumnDetails(colDetails);

      // Schema
      try {
        const schema = await runQuery(db, `SELECT * FROM parquet_schema('${fileName}')`);
        setSchemaData({ columns: schema.columns, rows: schema.rows });
      } catch {}

      // Data preview
      try {
        const prev = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
        setPreview(prev);
      } catch {}

      // Warnings
      const w: string[] = [];
      if (rgCount > 100) w.push(`High row group count (${rgCount}). Consider merging for better read performance.`);
      const highNullCols = colDetails.filter(c => rowCount > 0 && c.nullCount / rowCount > 0.5);
      if (highNullCols.length > 0) w.push(`${highNullCols.length} column(s) are >50% null: ${highNullCols.map(c => c.name).join(", ")}`);
      const dictEncodings = colDetails.filter(c => c.encoding.includes("DICT") || c.encoding.includes("RLE_DICTIONARY"));
      if (dictEncodings.length > 0) w.push(`${dictEncodings.length}/${colDetails.length} columns use dictionary encoding`);
      setWarnings(w);
    } finally {
      setLoading(false);
    }
  }

  const totalCompressed = rowGroups.reduce((s, r) => s + r.compressedSize, 0);
  const totalUncompressed = rowGroups.reduce((s, r) => s + r.uncompressedSize, 0);

  const tabs: [TabValue, string][] = [
    ["overview", "Overview"],
    ["columns", "Columns"],
    ["rowgroups", "Row Groups"],
    ["preview", "Data Preview"],
  ];

  if (loading) {
    return <p className="text-xs text-muted-foreground animate-pulse">Analyzing Parquet metadata…</p>;
  }

  return (
    <div className="space-y-3">
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
              ["File size", formatBytes(fileSize)],
              ["Uncompressed size", totalUncompressed > 0 ? formatBytes(totalUncompressed) : "—"],
              ["Compression ratio", totalCompressed > 0 && totalUncompressed > 0 ? `${(totalUncompressed / totalCompressed).toFixed(1)}× (${Math.round((1 - totalCompressed / totalUncompressed) * 100)}% reduction)` : "—"],
              ["Rows", rowCount.toLocaleString()],
              ["Columns", String(columnCount)],
              ["Row groups", String(rowGroupCount)],
              ["Compression", compressionCodec],
              ["Created by", createdBy],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-3">
                <div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div>
                <div className="text-sm font-medium font-mono break-all">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns */}
      {tab === "columns" && (
        <div className="space-y-4">
          {columnDetails.length > 0 && (
            <div className="overflow-auto border-2 border-border max-h-[500px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    {["Column", "Physical Type", "Encoding", "Compression", "Nulls", "Compressed", "Uncompressed"].map(h => (
                      <th key={h} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
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
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {schemaData.columns.map(c => <th key={c} className="px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {schemaData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        {row.map((val: any, j: number) => <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[200px] truncate">{val === null ? <span className="text-muted-foreground/40">∅</span> : String(val)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {!schemaData && columnDetails.length === 0 && <p className="text-xs text-muted-foreground">Schema information not available.</p>}
        </div>
      )}

      {/* Row Groups */}
      {tab === "rowgroups" && rowGroups.length > 0 && (
        <div className="overflow-auto border-2 border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50">
                {["Group #", "Rows", "Compressed", "Uncompressed", "Ratio"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
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
                <td className="px-3 py-2 font-mono">{rowCount.toLocaleString()}</td>
                <td className="px-3 py-2 font-mono">{formatBytes(totalCompressed)}</td>
                <td className="px-3 py-2 font-mono">{formatBytes(totalUncompressed)}</td>
                <td className="px-3 py-2 font-mono">{totalCompressed > 0 ? `${(totalUncompressed / totalCompressed).toFixed(1)}×` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {tab === "rowgroups" && rowGroups.length === 0 && <p className="text-xs text-muted-foreground">Row group information not available.</p>}

      {/* Data Preview */}
      {tab === "preview" && preview && (
        <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
      )}
      {tab === "preview" && !preview && <p className="text-xs text-muted-foreground">No data preview available.</p>}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="border-2 border-border">
          <div className="border-b-2 border-border border-l-4 border-l-amber-500 bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Observations ({warnings.length})</div>
          <div className="divide-y divide-border/50">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 text-sm">{w}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
