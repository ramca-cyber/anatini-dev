import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Table, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { ConversionStats } from "@/components/shared/ConversionStats";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, exportToCSV, downloadBlob, formatBytes, sanitizeTableName } from "@/lib/duckdb-helpers";

export default function JsonToCsvPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ columns: string[]; rowCount: number; types: string[] } | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [csvOutput, setCsvOutput] = useState("");
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "raw-output" | "raw-input">("table");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setCsvOutput("");
    setRawInput(null);
    setView("table");
    try {
      const text = await f.text();
      setRawInput(text.slice(0, 50_000));
      const tableName = sanitizeTableName(f.name);
      const info = await registerFile(db, f, tableName);
      setMeta(info);
      const result = await runQuery(db, `SELECT * FROM "${tableName}" LIMIT 100`);
      setPreview(result);
      const csv = await exportToCSV(db, `SELECT * FROM "${tableName}"`);
      setCsvOutput(csv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
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

  function handleSampleJson() {
    const sample = JSON.stringify([
      { id: 1, name: "Alice", email: "alice@example.com", age: 30, city: "Portland" },
      { id: 2, name: "Bob", email: "bob@example.com", age: 25, city: "Seattle" },
      { id: 3, name: "Charlie", email: "charlie@example.com", age: 35, city: "Austin" },
    ]);
    const blob = new Blob([sample], { type: "application/json" });
    handleFile(new File([blob], "sample.json", { type: "application/json" }));
  }

  return (
    <ToolPage icon={Table} title="JSON to CSV" description="Convert JSON and NDJSON files to CSV format." metaDescription={getToolMetaDescription("json-to-csv")} seoContent={getToolSeo("json-to-csv")}>
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

              {inputMode === "file" ? (
                <div className="space-y-3">
                  <DropZone accept={[".json", ".jsonl"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSampleJson}>
                      <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                    </Button>
                  </div>
                </div>
              ) : (
                <PasteInput
                  onSubmit={handlePaste}
                  placeholder='Paste JSON here... e.g. [{"name": "Alice"}]'
                  label="Paste JSON data"
                  accept={[".json", ".jsonl"]}
                  onFile={handleFile}
                />
              )}
            </div>
          )}

          {file && meta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={meta.rowCount} columns={meta.columns.length} />
                <div className="flex gap-2">
                  <Button onClick={handleDownload} disabled={!csvOutput}>Download CSV</Button>
                  <Button variant="outline" onClick={() => { setFile(null); setMeta(null); setPreview(null); setCsvOutput(""); setRawInput(null); }}>New file</Button>
                </div>
              </div>

              {csvOutput && <ConversionStats rows={meta.rowCount} columns={meta.columns.length} inputFormat="JSON" outputFormat="CSV" />}

              <div className="flex gap-2">
                {([["table", "Table View"], ["raw-output", "Raw CSV"], ["raw-input", "Raw Input"]] as const).map(([v, label]) => (
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

          {preview && view === "table" && (
            <DataTable columns={preview.columns} rows={preview.rows} types={preview.types} className="max-h-[500px]" />
          )}
          {csvOutput && view === "raw-output" && (
            <CodeBlock code={csvOutput} fileName="output.csv" onDownload={handleDownload} />
          )}
          {view === "raw-input" && (
            <RawPreview content={rawInput} label="Raw Input" fileName={file?.name} />
          )}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
