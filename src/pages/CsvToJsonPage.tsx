import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileJson, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { ConversionStats } from "@/components/shared/ConversionStats";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";
import { getSampleCSV } from "@/lib/sample-data";

export default function CsvToJsonPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [output, setOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"output" | "raw-input">("output");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  const [outputFormat, setOutputFormat] = useState<"array" | "arrays" | "ndjson">("array");
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [indent, setIndent] = useState<2 | 4 | "tab">(2);
  const [delimiter, setDelimiter] = useState<"," | "\t" | ";" | "|">(",");
  const [hasHeader, setHasHeader] = useState(true);

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setOutput("");
    setRawInput(null);
    setView("output");
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
        const info = { columns, rowCount, types };
        setMeta(info);
        await convert(tableName);
      } finally {
        await conn.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "text/csv" });
    const f = new File([blob], "pasted_data.csv", { type: "text/csv" });
    handleFile(f);
  }

  async function convert(tableName?: string, fmt?: typeof outputFormat, pretty?: boolean, ind?: typeof indent) {
    if (!db || !file) return;
    const tName = tableName ?? sanitizeTableName(file.name);
    const useFormat = fmt ?? outputFormat;
    const usePretty = pretty ?? prettyPrint;
    const useIndent = ind ?? indent;
    setLoading(true);
    try {
      const result = await runQuery(db, `SELECT * FROM "${tName}"`);
      let json: string;
      if (useFormat === "arrays") {
        const arr = [result.columns, ...result.rows];
        json = usePretty ? JSON.stringify(arr, null, useIndent === "tab" ? "\t" : useIndent) : JSON.stringify(arr);
      } else if (useFormat === "ndjson") {
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
        json = usePretty ? JSON.stringify(records, null, useIndent === "tab" ? "\t" : useIndent) : JSON.stringify(records);
      }
      setOutput(json);
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

  const views = [["output", "JSON Output"], ["raw-input", "Raw Input"]] as const;

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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setOutput(""); setRawInput(null); }}>New file</Button>
              </div>

              {output && <ConversionStats rows={meta.rowCount} columns={meta.columns.length} inputFormat="CSV" outputFormat="JSON" />}

              <div className="flex flex-wrap items-center gap-4 border-2 border-border p-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-bold">Output Format</label>
                  <div className="flex gap-1">
                    {([["array", "JSON Array"], ["arrays", "Array of Arrays"], ["ndjson", "NDJSON"]] as const).map(([f, label]) => (
                      <button key={f} onClick={() => { setOutputFormat(f); setTimeout(() => convert(undefined, f), 0); }}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputFormat === f ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {outputFormat !== "ndjson" && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input type="checkbox" checked={prettyPrint} onChange={(e) => { setPrettyPrint(e.target.checked); setTimeout(() => convert(undefined, undefined, e.target.checked), 0); }} />
                      Pretty print
                    </label>
                    {prettyPrint && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-bold">Indent</label>
                        <select value={indent} onChange={(e) => { const v = e.target.value === "tab" ? "tab" as const : Number(e.target.value) as 2 | 4; setIndent(v); setTimeout(() => convert(undefined, undefined, undefined, v), 0); }} className="border-2 border-border bg-background px-2 py-1 text-xs">
                          <option value={2}>2 spaces</option>
                          <option value={4}>4 spaces</option>
                          <option value="tab">Tab</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
                <Button size="sm" onClick={() => convert()}>Re-convert</Button>
              </div>

              <div className="flex gap-2">
                {views.map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${view === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <LoadingState message="Converting..." />}
          {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {output && view === "output" && (
            <CodeBlock code={output} fileName={`output.${outputFormat === "ndjson" ? "jsonl" : "json"}`} onDownload={handleDownload} />
          )}
          {view === "raw-input" && (
            <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
          )}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
