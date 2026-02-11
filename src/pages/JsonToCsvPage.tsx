import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Table, FlaskConical, Copy, Check, ArrowRightLeft, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile } from "@/lib/duckdb-helpers";
import { toast } from "@/hooks/use-toast";

const DELIMITERS = [
  { label: "Comma", value: "," },
  { label: "Tab", value: "\t" },
  { label: "Semicolon", value: ";" },
  { label: "Pipe", value: "|" },
];

export default function JsonToCsvPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [csvOutput, setCsvOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputView, setInputView] = useState<"table" | "raw-input">("table");
  const [inputMode, setInputMode] = useState<"file" | "paste" | "url">("file");
  const [delimiter, setDelimiter] = useState(",");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [outputView, setOutputView] = useState<"table" | "raw">("table");
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setCsvOutput("");
    setRawInput(null);
    setInputView("table");
    setConversionResult(null);
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

  async function handleConvert() {
    if (!db || !file || !meta) return;
    setLoading(true);
    setConversionResult(null);
    const start = performance.now();
    try {
      const tableName = sanitizeTableName(file.name);
      const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`, { delimiter, header: includeHeader });
      setCsvOutput(csv);
      const outputSize = new Blob([csv]).size;
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
      const outPreview = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setOutputPreview(outPreview);
      setOutputView("table");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "application/json" });
    const f = new File([blob], "pasted_data.json", { type: "application/json" });
    handleFile(f);
  }

  function handleDownload() {
    downloadBlob(csvOutput, `${file?.name.replace(/\.[^.]+$/, "")}.csv`, "text/csv");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSampleJson() {
    const sample = JSON.stringify([
      { id: 1, name: "Alice", email: "alice@example.com", age: 30, city: "Portland" },
      { id: 2, name: "Bob", email: "bob@example.com", age: 25, city: "Seattle" },
      { id: 3, name: "Charlie", email: "charlie@example.com", age: 35, city: "Austin" },
    ]);
    const blob = new Blob([sample], { type: "application/json" });
    handleFile(new File([blob], "sample.json", { type: "application/json" }));
  }

  function resetAll() {
    setFile(null); setMeta(null); setPreview(null);
    setCsvOutput(""); setRawInput(null); setConversionResult(null);
    setStoredFileId(null);
  }

  return (
    <ToolPage icon={Table} title="JSON to CSV" description="Convert JSON and NDJSON files to CSV format." metaDescription={getToolMetaDescription("json-to-csv")} seoContent={getToolSeo("json-to-csv")}>
      <DuckDBGate>
        <div className="space-y-4">
          {!file && (
            <div className="space-y-4">
              <ToggleButton
                options={[{ label: "Upload File", value: "file" }, { label: "Paste Data", value: "paste" }, { label: "From URL", value: "url" }]}
                value={inputMode}
                onChange={setInputMode}
              />

              {inputMode === "file" ? (
                <DropZone
                  accept={[".json", ".jsonl"]}
                  onFile={handleFile}
                  label="Drop a JSON or JSONL file"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: handleSampleJson }}
                />
              ) : inputMode === "paste" ? (
                <PasteInput
                  onSubmit={handlePaste}
                  placeholder='Paste JSON here... e.g. [{"name": "Alice"}]'
                  label="Paste JSON data"
                  accept={[".json", ".jsonl"]}
                  onFile={handleFile}
                />
              ) : (
                <UrlInput onFile={handleFile} accept={[".json", ".jsonl"]} placeholder="https://example.com/data.json" label="Load JSON from URL" />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format="json" />}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConvert} disabled={loading}>
                    <ArrowRightLeft className="h-4 w-4 mr-1" /> {csvOutput ? "Re-convert" : "Convert to CSV"}
                  </Button>
                  <Button variant="outline" onClick={resetAll}>New file</Button>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center border border-border p-3 sm:gap-4">
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground font-bold">Delimiter:</label>
                  <ToggleButton options={DELIMITERS} value={delimiter} onChange={setDelimiter} />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} className="rounded" />
                  <span className="font-bold">Include header row</span>
                </label>
              </div>

              {/* INPUT SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
                  <ToggleButton
                    options={[{ label: "Table View", value: "table" }, { label: "Raw Input", value: "raw-input" }]}
                    value={inputView}
                    onChange={setInputView}
                  />
                </div>

                {preview && inputView === "table" && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                {inputView === "raw-input" && (
                  <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                )}
              </div>

              {/* OUTPUT SECTION */}
              {csvOutput && conversionResult && (
                <div className="space-y-3 border-t-2 border-border pt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" /> Download CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {/* Compact conversion stats */}
                  <div className="flex items-center gap-4 flex-wrap border border-border bg-muted/30 px-4 py-2 text-xs">
                    <span><span className="text-muted-foreground">Time:</span> <span className="font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</span></span>
                    <span><span className="text-muted-foreground">Output:</span> <span className="font-bold">{formatBytes(conversionResult.outputSize)}</span></span>
                    <span><span className="text-muted-foreground">Change:</span> <span className="font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                  </div>

                  <ToggleButton
                    options={[{ label: "Table View", value: "table" }, { label: "Raw Output", value: "raw" }]}
                    value={outputView}
                    onChange={setOutputView}
                  />

                  {outputView === "table" && outputPreview && (
                    <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                  )}
                  {outputView === "raw" && (
                    <RawPreview content={csvOutput} label="Raw Output" fileName="output.csv" onDownload={handleDownload} />
                  )}
                </div>
              )}

              <div className="border border-border p-4 space-y-4">
                <CrossToolLinks format="json" fileId={storedFileId ?? undefined} excludeRoute="/json-to-csv" heading={csvOutput ? "Source file" : undefined} inline />
                {csvOutput && (
                  <CrossToolLinks format="csv" excludeRoute="/json-to-csv" heading="Converted output" inline />
                )}
              </div>
            </div>
          )}

          {loading && <LoadingState message="Converting..." />}
          {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
