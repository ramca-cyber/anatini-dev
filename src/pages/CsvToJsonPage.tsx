import { useState, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileJson, ArrowRightLeft, Download, Copy, Check, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { RawPreview } from "@/components/shared/RawPreview";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { UrlInput } from "@/components/shared/UrlInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { ConfirmNewDialog } from "@/components/shared/ConfirmNewDialog";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName, warnLargeFile, bigIntReplacer, type CsvParseOptions } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

export default function CsvToJsonPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [output, setOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputView, setInputView] = useState<"table" | "raw-input">("table");
  const [inputMode, setInputMode] = useState<"file" | "paste" | "url">("file");
  const [copied, setCopied] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [outputView, setOutputView] = useState<"table" | "raw">("table");
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [showInputPreview, setShowInputPreview] = useState(true);
  const [showOutputPreview, setShowOutputPreview] = useState(false);

  const [outputFormat, setOutputFormat] = useState<"array" | "arrays" | "ndjson">("array");
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [indent, setIndent] = useState<2 | 4 | "tab">(2);
  const [delimiter, setDelimiter] = useState<"," | "\t" | ";" | "|">(",");
  const [hasHeader, setHasHeader] = useState(true);

  async function handleFile(f: File) {
    if (!db) return;
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setOutput("");
    setRawInput(null);
    setPreview(null);
    setInputView("table");
    setConversionResult(null);
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const result = await registerFile(db, f, tableName, { delimiter, header: hasHeader });
      setMeta(result);
      const previewRes = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(previewRes);
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

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "text/csv" });
    const f = new File([blob], "pasted_data.csv", { type: "text/csv" });
    handleFile(f);
  }

  async function handleConvert() {
    if (!db || !file) return;
    setLoading(true);
    setConversionResult(null);
    const start = performance.now();
    try {
      const tName = sanitizeTableName(file.name);
      const result = await runQuery(db, `SELECT * FROM "${tName}"`);
      let json: string;
      if (outputFormat === "arrays") {
        const arr = [result.columns, ...result.rows];
        json = prettyPrint ? JSON.stringify(arr, bigIntReplacer, indent === "tab" ? "\t" : indent) : JSON.stringify(arr, bigIntReplacer);
      } else if (outputFormat === "ndjson") {
        json = result.rows.map((row) => {
          const obj: Record<string, unknown> = {};
          result.columns.forEach((col, i) => { obj[col] = row[i]; });
          return JSON.stringify(obj, bigIntReplacer);
        }).join("\n");
      } else {
        const records = result.rows.map((row) => {
          const obj: Record<string, unknown> = {};
          result.columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        });
        json = prettyPrint ? JSON.stringify(records, bigIntReplacer, indent === "tab" ? "\t" : indent) : JSON.stringify(records, bigIntReplacer);
      }
      setOutput(json);
      const outputSize = new Blob([json]).size;
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
      const outPreview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setOutputPreview(outPreview);
      setOutputView("table");
      setError(null);
      setShowInputPreview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const ext = outputFormat === "ndjson" ? "jsonl" : "json";
    downloadBlob(output, `${file?.name.replace(/\.[^.]+$/, "")}.${ext}`, "application/json");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function resetAll() {
    setFile(null); setMeta(null); setOutput("");
    setRawInput(null); setPreview(null); setConversionResult(null);
    setStoredFileId(null);
  }

  return (
    <ToolPage icon={FileJson} title="CSV to JSON" description="Convert CSV files to JSON array or NDJSON format." metaDescription={getToolMetaDescription("csv-to-json")} seoContent={getToolSeo("csv-to-json")}>
      <DuckDBGate>
        <div className="relative space-y-4">
          {!file && (
            <div className="space-y-4">
              <ToggleButton
                options={[{ label: "Upload File", value: "file" }, { label: "Paste Data", value: "paste" }, { label: "From URL", value: "url" }]}
                value={inputMode}
                onChange={setInputMode}
              />

              {/* CSV parse options - shown before upload */}
              <details className="border border-border">
                <summary className="px-3 py-2 text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  CSV Parse Options
                </summary>
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center p-3 border-t border-border sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-bold">Delimiter</label>
                    <select value={delimiter} onChange={(e) => setDelimiter(e.target.value as any)} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value=",">Comma (,)</option>
                      <option value={"\t"}>Tab</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
                    First row is header
                  </label>
                </div>
              </details>

              {inputMode === "file" ? (
                <DropZone
                  accept={[".csv", ".tsv"]}
                  onFile={handleFile}
                  label="Drop a CSV file"
                  sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleCSV()) }}
                />
              ) : inputMode === "paste" ? (
                <PasteInput onSubmit={handlePaste} placeholder="Paste CSV data here..." label="Paste CSV data" accept={[".csv", ".tsv"]} onFile={handleFile} />
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
                <ConfirmNewDialog onConfirm={resetAll} hasOutput={!!conversionResult} />
              </div>

              {/* 2. Options + Convert row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-bold">Format</label>
                    <ToggleButton
                      options={[{ label: "JSON Array", value: "array" }, { label: "Array of Arrays", value: "arrays" }, { label: "NDJSON", value: "ndjson" }]}
                      value={outputFormat}
                      onChange={setOutputFormat}
                    />
                  </div>
                  {outputFormat !== "ndjson" && (
                    <>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" checked={prettyPrint} onChange={(e) => setPrettyPrint(e.target.checked)} />
                        Pretty print
                      </label>
                      {prettyPrint && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground font-bold">Indent</label>
                          <select value={indent} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" as const : Number(e.target.value) as 2 | 4)} className="border border-border bg-background px-2 py-1 text-xs">
                            <option value={2}>2 spaces</option>
                            <option value={4}>4 spaces</option>
                            <option value="tab">Tab</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Button onClick={handleConvert} disabled={loading}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> Convert to JSON
                </Button>
              </div>

              {/* 3. OUTPUT section (primary) */}
              {output && conversionResult && (
                <div className="space-y-3 border-2 border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>

                  <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><span className="text-muted-foreground">Converted in</span> <span className="font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</span></span>
                    <span><span className="text-muted-foreground">·</span></span>
                    <span><span className="font-bold">{formatBytes(conversionResult.outputSize)}</span></span>
                    <span><span className="text-muted-foreground">·</span></span>
                    <span><span className="font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</span></span>
                  </div>

                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" /> Download {outputFormat === "ndjson" ? "JSONL" : "JSON"}
                  </Button>

                  <Button variant="outline" onClick={handleCopy} className="w-full">
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy to clipboard"}
                  </Button>

                  <Collapsible open={showOutputPreview} onOpenChange={setShowOutputPreview}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                      {showOutputPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      <span className="text-xs font-bold uppercase tracking-widest">Preview output data</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <ToggleButton
                        options={[{ label: "Table View", value: "table" }, { label: "Raw Output", value: "raw" }]}
                        value={outputView}
                        onChange={setOutputView}
                      />
                      {outputView === "table" && outputPreview && (
                        <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                      )}
                      {outputView === "raw" && (
                        <RawPreview content={output} label="Raw Output" fileName={`output.${outputFormat === "ndjson" ? "jsonl" : "json"}`} onDownload={handleDownload} />
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
                  <ToggleButton
                    options={[{ label: "Table View", value: "table" }, { label: "Raw Input", value: "raw-input" }]}
                    value={inputView}
                    onChange={setInputView}
                  />
                </div>
                <CollapsibleContent className="pt-3 space-y-3">
                  {preview && inputView === "table" && (
                    <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                  )}
                  {inputView === "raw-input" && (
                    <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 5. CrossToolLinks */}
              <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} excludeRoute="/csv-to-json" />
            </div>
          )}

          {loading && <LoadingState message="Converting..." />}
          {error && <ErrorAlert message={error} />}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
