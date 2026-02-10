import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileJson, FlaskConical, ArrowRightLeft, Download, Copy, Check } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { RawPreview } from "@/components/shared/RawPreview";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
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
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [copied, setCopied] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ durationMs: number; outputSize: number } | null>(null);
  const [outputView, setOutputView] = useState<"table" | "raw">("table");
  const [outputPreview, setOutputPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);

  const [outputFormat, setOutputFormat] = useState<"array" | "arrays" | "ndjson">("array");
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [indent, setIndent] = useState<2 | 4 | "tab">(2);
  const [delimiter, setDelimiter] = useState<"," | "\t" | ";" | "|">(",");
  const [hasHeader, setHasHeader] = useState(true);

  async function handleFile(f: File) {
    if (!db) return;
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
      const delimOpt = delimiter === "," ? "" : `, delim='${delimiter}'`;
      const headerOpt = hasHeader ? "" : ", header=false";
      const conn = await db.connect();
      try {
        await db.registerFileHandle(f.name, f, 2 /* BROWSER_FILEREADER */, true);
        await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${f.name}'${delimOpt}${headerOpt})`);
        const countRes = await conn.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
        const rowCount = Number(countRes.getChildAt(0)?.get(0) ?? 0);
        const schemaRes = await conn.query(`DESCRIBE "${tableName}"`);
        const columns: string[] = [];
        const types: string[] = [];
        const nameCol = schemaRes.getChildAt(0);
        const typeCol = schemaRes.getChildAt(1);
        for (let i = 0; i < schemaRes.numRows; i++) {
          columns.push(String(nameCol?.get(i)));
          types.push(String(typeCol?.get(i)));
        }
        setMeta({ columns, rowCount, types });
        const previewRes = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
        setPreview(previewRes);
      } finally {
        await conn.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  useAutoLoadFile(handleFile, !!db);

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
        json = prettyPrint ? JSON.stringify(arr, null, indent === "tab" ? "\t" : indent) : JSON.stringify(arr);
      } else if (outputFormat === "ndjson") {
        json = result.rows.map((row) => {
          const obj: Record<string, unknown> = {};
          result.columns.forEach((col, i) => { obj[col] = row[i]; });
          return JSON.stringify(obj);
        }).join("\n");
      } else {
        const records = result.rows.map((row) => {
          const obj: Record<string, unknown> = {};
          result.columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        });
        json = prettyPrint ? JSON.stringify(records, null, indent === "tab" ? "\t" : indent) : JSON.stringify(records);
      }
      setOutput(json);
      const outputSize = new Blob([json]).size;
      const durationMs = Math.round(performance.now() - start);
      setConversionResult({ durationMs, outputSize });
      const outPreview = await runQuery(db, `SELECT * FROM "${tName}" LIMIT 100`);
      setOutputPreview(outPreview);
      setOutputView("table");
      setError(null);
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
        <div className="space-y-4">
          {!file && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["file", "paste"] as const).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputMode === m ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {m === "file" ? "Upload File" : "Paste Data"}
                  </button>
                ))}
              </div>

              {/* Pre-load options */}
              <div className="flex flex-wrap items-center gap-4 border-2 border-border p-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-bold">Delimiter</label>
                  <select value={delimiter} onChange={(e) => setDelimiter(e.target.value as any)} className="border-2 border-border bg-background px-2 py-1 text-xs">
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

              {inputMode === "file" ? (
                <div className="space-y-3">
                  <DropZone accept={[".csv", ".tsv"]} onFile={handleFile} label="Drop a CSV file" />
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleCSV())}>
                      <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                    </Button>
                  </div>
                </div>
              ) : (
                <PasteInput onSubmit={handlePaste} placeholder="Paste CSV data here..." label="Paste CSV data" accept={[".csv", ".tsv"]} onFile={handleFile} />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              {/* File info + actions */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                  {storedFileId && <InspectLink fileId={storedFileId} format="csv" />}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConvert} disabled={loading}>
                    <ArrowRightLeft className="h-4 w-4 mr-1" /> {output ? "Re-convert" : "Convert to JSON"}
                  </Button>
                  <Button variant="outline" onClick={resetAll}>New file</Button>
                </div>
              </div>

              {/* Output format options */}
              <div className="flex flex-wrap items-center gap-4 border-2 border-border p-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-bold">Output Format</label>
                  <div className="flex gap-1">
                    {([["array", "JSON Array"], ["arrays", "Array of Arrays"], ["ndjson", "NDJSON"]] as const).map(([f, label]) => (
                      <button key={f} onClick={() => setOutputFormat(f)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputFormat === f ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {outputFormat !== "ndjson" && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input type="checkbox" checked={prettyPrint} onChange={(e) => setPrettyPrint(e.target.checked)} />
                      Pretty print
                    </label>
                    {prettyPrint && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-bold">Indent</label>
                        <select value={indent} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" as const : Number(e.target.value) as 2 | 4)} className="border-2 border-border bg-background px-2 py-1 text-xs">
                          <option value={2}>2 spaces</option>
                          <option value={4}>4 spaces</option>
                          <option value="tab">Tab</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* INPUT SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
                  <div className="flex gap-1">
                    {([["table", "Table View"], ["raw-input", "Raw Input"]] as ["table" | "raw-input", string][]).map(([v, label]) => (
                      <button key={v} onClick={() => setInputView(v)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputView === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {preview && inputView === "table" && (
                  <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
                )}
                {inputView === "raw-input" && (
                  <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
                )}
              </div>

              {/* OUTPUT SECTION */}
              {output && conversionResult && (
                <div className="space-y-3 border-t-2 border-border pt-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" /> Download {outputFormat === "ndjson" ? "JSONL" : "JSON"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {/* Conversion stats */}
                  <div className="border-2 border-foreground bg-card p-4 flex items-center gap-6 flex-wrap">
                    <div><div className="text-xs text-muted-foreground">Time</div><div className="text-lg font-bold">{(conversionResult.durationMs / 1000).toFixed(1)}s</div></div>
                    <div><div className="text-xs text-muted-foreground">Output size</div><div className="text-lg font-bold">{formatBytes(conversionResult.outputSize)}</div></div>
                    <div><div className="text-xs text-muted-foreground">Size change</div><div className="text-lg font-bold">{file.size > 0 ? `${Math.round((conversionResult.outputSize / file.size - 1) * 100)}% ${conversionResult.outputSize > file.size ? "larger" : "smaller"}` : "—"}</div></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {([["table", "Table View"], ["raw", "Raw Output"]] as ["table" | "raw", string][]).map(([v, label]) => (
                        <button key={v} onClick={() => setOutputView(v)}
                          className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputView === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {outputView === "table" && outputPreview && (
                    <DataTable columns={outputPreview.columns} rows={outputPreview.rows} types={outputPreview.types} className="max-h-[500px]" />
                  )}
                  {outputView === "raw" && (
                    <RawPreview content={output} label="Raw Output" fileName={`output.${outputFormat === "ndjson" ? "jsonl" : "json"}`} onDownload={handleDownload} />
                  )}
                </div>
              )}

              <div className="border-2 border-border p-4 space-y-4">
                <CrossToolLinks format="csv" fileId={storedFileId ?? undefined} excludeRoute="/csv-to-json" heading={output ? "Source file" : undefined} inline />
                {output && (
                  <CrossToolLinks format="json" excludeRoute="/csv-to-json" heading="Converted output" inline />
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
