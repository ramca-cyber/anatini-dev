import { useState, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileSpreadsheet, ArrowRightLeft, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToParquet, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

interface ParquetMeta {
  rowGroups: number;
  totalCompressed: number;
  totalUncompressed: number;
}

export default function CsvToParquetPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compression, setCompression] = useState<"snappy" | "zstd" | "gzip" | "none">("snappy");
  const [rowGroupSize, setRowGroupSize] = useState<number | null>(null);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [inputView, setInputView] = useState<"table" | "schema" | "raw-input">("table");
  const [outputView, setOutputView] = useState<"preview" | "raw">("preview");
  const [nullableInfo, setNullableInfo] = useState<boolean[]>([]);
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [parquetMeta, setParquetMeta] = useState<ParquetMeta | null>(null);
  const [outputBuf, setOutputBuf] = useState<Uint8Array | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [showInputPreview, setShowInputPreview] = useState(true);
  const [showOutputPreview, setShowOutputPreview] = useState(false);

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setRawInput(null);
    setConversionResult(null);
    setInputView("table");
    setNullableInfo([]);
    setOutputPreview(null);
    setParquetMeta(null);
    setOutputBuf(null);
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(result);
      const nullChecks: boolean[] = [];
      for (const col of info.columns) {
        try {
          const r = await runQuery(db, `SELECT COUNT(*) FROM "${tableName}" WHERE "${col}" IS NULL`);
          nullChecks.push(Number(r.rows[0][0]) > 0);
        } catch { nullChecks.push(true); }
      }
      setNullableInfo(nullChecks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  useEffect(() => {
    if (meta && file && !conversionResult) {
      handleConvert();
    }
  }, [meta]);

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setConversionResult(null);
    setOutputPreview(null);
    setParquetMeta(null);
    setOutputBuf(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const buf = await exportToParquet(db, tableName, { compression, rowGroupSize });
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize: buf.byteLength });
      setOutputBuf(buf);
      setOutputView("preview");

      const outName = `${tableName}_export.parquet`;
      try {
        const outData = await runQuery(db, `SELECT * FROM read_parquet('${outName}') LIMIT 100`);
        setOutputPreview(outData);
        const metaResult = await runQuery(db, `SELECT * FROM parquet_metadata('${outName}')`);
        const rowGroups = metaResult.rowCount;
        let totalCompressed = 0;
        let totalUncompressed = 0;
        const compressedIdx = metaResult.columns.indexOf("total_compressed_size");
        const uncompressedIdx = metaResult.columns.indexOf("total_uncompressed_size");
        if (compressedIdx >= 0 && uncompressedIdx >= 0) {
          for (const row of metaResult.rows) {
            totalCompressed += Number(row[compressedIdx] ?? 0);
            totalUncompressed += Number(row[uncompressedIdx] ?? 0);
          }
        }
        setParquetMeta({ rowGroups, totalCompressed, totalUncompressed });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!outputBuf || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(outputBuf, `${baseName}.parquet`, "application/octet-stream");
  }

  function resetAll() {
    setFile(null); setMeta(null); setPreview(null); setRawInput(null);
    setConversionResult(null); setNullableInfo([]); setOutputPreview(null);
    setParquetMeta(null); setOutputBuf(null); setStoredFileId(null);
  }

  const inputTabs: { label: string; value: "table" | "schema" | "raw-input" }[] = [
    { label: "Table View", value: "table" },
    { label: "Schema", value: "schema" },
    { label: "Raw Input", value: "raw-input" },
  ];

  return (
    <ToolPage icon={FileSpreadsheet} title="CSV to Parquet" description="Convert CSV files to columnar Parquet format with compression." pageTitle="CSV to Parquet — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("csv-to-parquet")} seoContent={getToolSeo("csv-to-parquet")}>
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
                accept={[".csv", ".tsv"]}
                onFile={handleFile}
                label="Drop a CSV file"
                sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
              />
            ) : (
              <UrlInput onFile={handleFile} accept={[".csv", ".tsv"]} placeholder="https://example.com/data.csv" label="Load CSV from URL" />
            )}
          </div>
        )}

        {file && meta && (
          <div className="space-y-4">
            {/* 1. File info bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="csv" />}
              </div>
              <Button variant="outline" onClick={resetAll}>New file</Button>
            </div>

            {/* 2. Options + Convert row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Compression</label>
                  <ToggleButton
                    options={[
                      { label: "Snappy", value: "snappy" },
                      { label: "Zstd", value: "zstd" },
                      { label: "GZIP", value: "gzip" },
                      { label: "None", value: "none" },
                    ]}
                    value={compression}
                    onChange={setCompression}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-bold">Row Group</label>
                  <select value={rowGroupSize ?? ""} onChange={(e) => setRowGroupSize(e.target.value ? Number(e.target.value) : null)} className="border border-border bg-background px-2 py-1 text-xs">
                    <option value="">Default</option>
                    <option value={10000}>10,000</option>
                    <option value={100000}>100,000</option>
                    <option value={1000000}>1,000,000</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleConvert} disabled={loading}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Convert to Parquet
              </Button>
            </div>

            {/* 3. OUTPUT section (primary) */}
            {conversionResult && (
              <div className="space-y-3 border-2 border-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>

                {/* Consolidated stats bar */}
                <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span><span className="text-muted-foreground">Converted in</span> <span className="font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{formatBytes(conversionResult.outputSize)}</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{file.size > 0 ? `${Math.round((1 - conversionResult.outputSize / file.size) * 100)}% smaller` : "—"}</span></span>
                  <span><span className="text-muted-foreground">·</span></span>
                  <span><span className="font-bold">{compression === "none" ? "None" : compression.toUpperCase()}</span></span>
                  {parquetMeta && (
                    <>
                      <span><span className="text-muted-foreground">·</span></span>
                      <span><span className="font-bold">{parquetMeta.rowGroups} row group{parquetMeta.rowGroups !== 1 ? "s" : ""}</span></span>
                    </>
                  )}
                </div>

                {/* Large download button */}
                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-5 w-5 mr-2" /> Download Parquet
                </Button>

                {/* Collapsible output preview */}
                <Collapsible open={showOutputPreview} onOpenChange={setShowOutputPreview}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                    {showOutputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span className="text-xs font-bold uppercase tracking-widest">Preview output data</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <ToggleButton
                      options={[{ label: "Output Preview", value: "preview" }, { label: "Raw Output", value: "raw" }]}
                      value={outputView}
                      onChange={setOutputView}
                    />
                    {outputView === "preview" && outputPreview && (
                      <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                    )}
                    {outputView === "raw" && (
                      <RawPreview content={null} label="Raw Output" binary />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* 4. INPUT PREVIEW section (secondary, collapsible) */}
            <Collapsible open={showInputPreview} onOpenChange={setShowInputPreview}>
              <div className="flex items-center justify-between gap-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showInputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <h3 className="text-xs font-bold uppercase tracking-widest">Input Preview</h3>
                </CollapsibleTrigger>
                <ToggleButton options={inputTabs} value={inputView} onChange={setInputView} />
              </div>
              <CollapsibleContent className="pt-3 space-y-3">
                {preview && inputView === "table" && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                {meta && inputView === "schema" && (
                  <div className="border-2 border-border">
                    <div className="grid grid-cols-3 border-b-2 border-border bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Column</span><span>Detected Type</span><span>Nullable</span>
                    </div>
                    {meta.columns.map((col, i) => (
                      <div key={col} className="grid grid-cols-3 border-b border-border/50 px-3 py-2 text-xs">
                        <span className="font-medium">{col}</span>
                        <span className="font-mono text-muted-foreground">{meta.types[i]}</span>
                        <span className={nullableInfo[i] ? "text-amber-500" : "text-muted-foreground"}>{nullableInfo[i] ? "YES" : "NO"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {inputView === "raw-input" && (
                  <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* 5. CrossToolLinks */}
            <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} excludeRoute="/csv-to-parquet" />
          </div>
        )}

        {loading && <LoadingState message="Processing..." />}
        {error && <ErrorAlert message={error} />}
      </div>
      </DuckDBGate>
    </ToolPage>
  );
}
