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

  const [outputFormat, setOutputFormat] = useState<"array" | "ndjson">("array");
  const [prettyPrint, setPrettyPrint] = useState(true);

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
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      await convert(tableName);
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

  async function convert(tableName?: string, fmt?: "array" | "ndjson", pretty?: boolean) {
    if (!db || !file) return;
    const tName = tableName ?? sanitizeTableName(file.name);
    const useFormat = fmt ?? outputFormat;
    const usePretty = pretty ?? prettyPrint;
    setLoading(true);
    try {
      const result = await runQuery(db, `SELECT * FROM "${tName}"`);
      const records = result.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
      let json: string;
      if (useFormat === "ndjson") {
        json = records.map((r) => JSON.stringify(r)).join("\n");
      } else {
        json = usePretty ? JSON.stringify(records, null, 2) : JSON.stringify(records);
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
              {/* Input mode toggle */}
              <div className="flex gap-2">
                {(["file", "paste"] as const).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputMode === m ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                    {m === "file" ? "Upload File" : "Paste Data"}
                  </button>
                ))}
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
                <PasteInput
                  onSubmit={handlePaste}
                  placeholder="Paste CSV data here..."
                  label="Paste CSV data"
                  accept={[".csv", ".tsv"]}
                  onFile={handleFile}
                />
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
                    {(["array", "ndjson"] as const).map((f) => (
                      <button key={f} onClick={() => { setOutputFormat(f); setTimeout(() => convert(undefined, f), 0); }}
                        className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${outputFormat === f ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                        {f === "array" ? "JSON Array" : "NDJSON"}
                      </button>
                    ))}
                  </div>
                </div>
                {outputFormat === "array" && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={prettyPrint} onChange={(e) => setPrettyPrint(e.target.checked)} />
                    Pretty print
                  </label>
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
