import { useState, useCallback } from "react";
import { Table, Check, Copy, Download, Loader2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { DropZone } from "@/components/shared/DropZone";
import { PasteInput } from "@/components/shared/PasteInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { UrlInput } from "@/components/shared/UrlInput";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { DuckDBGate } from "@/components/shared/DuckDBGate";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { escapeSqlString } from "@/lib/duckdb-helpers";

type Alignment = "left" | "center" | "right";

function escapeCell(val: string): string {
  return val.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function toMarkdownTable(columns: string[], rows: string[][], alignment: Alignment): string {
  const colWidths = columns.map((col, i) =>
    Math.max(col.length, ...rows.map((r) => (r[i] ?? "").length), 3)
  );

  const pad = (s: string, w: number, align: Alignment) => {
    if (align === "right") return s.padStart(w);
    if (align === "center") {
      const total = w - s.length;
      const left = Math.floor(total / 2);
      return " ".repeat(left) + s + " ".repeat(total - left);
    }
    return s.padEnd(w);
  };

  const sep = (w: number, align: Alignment) => {
    if (align === "left") return ":" + "-".repeat(w - 1);
    if (align === "right") return "-".repeat(w - 1) + ":";
    return ":" + "-".repeat(w - 2) + ":";
  };

  const headerLine = "| " + columns.map((c, i) => pad(escapeCell(c), colWidths[i], alignment)).join(" | ") + " |";
  const sepLine = "| " + colWidths.map((w) => sep(w, alignment)).join(" | ") + " |";
  const dataLines = rows.map(
    (row) => "| " + row.map((cell, i) => pad(escapeCell(cell), colWidths[i], alignment)).join(" | ") + " |"
  );

  return [headerLine, sepLine, ...dataLines].join("\n");
}

export default function MarkdownTablePage() {
  const { db, loading: dbLoading } = useDuckDB();
  const { addFile } = useFileStore();
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [alignment, setAlignment] = useState<Alignment>("left");
  const [maxRows, setMaxRows] = useState(100);
  const [copied, setCopied] = useState(false);
  const [fileFormat, setFileFormat] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!db) return;
    setError(null);
    setProcessing(true);
    setFileName(file.name);
    try {
      const stored = addFile(file);
      setStoredFileId(stored.id);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const fmt = ext === "parquet" ? "parquet" : ext === "json" || ext === "jsonl" ? "json" : "csv";
      setFileFormat(fmt);

      const conn = await db.connect();
      try {
        const buf = await file.arrayBuffer();
        await db.registerFileBuffer(file.name, new Uint8Array(buf));

        const safeName = escapeSqlString(file.name);
        const readFn = fmt === "parquet"
          ? `read_parquet('${safeName}')`
          : fmt === "json"
          ? `read_json_auto('${safeName}')`
          : `read_csv_auto('${safeName}')`;

        const colResult = await conn.query(`SELECT * FROM ${readFn} LIMIT 0`);
        const columns = colResult.schema.fields.map((f: any) => f.name);

        const dataResult = await conn.query(
          `SELECT * FROM ${readFn} LIMIT ${maxRows}`
        );
        const rows: string[][] = [];
        for (let i = 0; i < dataResult.numRows; i++) {
          const row: string[] = [];
          for (let j = 0; j < columns.length; j++) {
            const val = dataResult.getChildAt(j)?.get(i);
            row.push(val == null ? "" : String(val));
          }
          rows.push(row);
        }

        const md = toMarkdownTable(columns, rows, alignment);
        setOutput(md);
      } finally {
        await conn.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process file");
      setOutput("");
    } finally {
      setProcessing(false);
    }
  }, [db, addFile, alignment, maxRows]);

  const processPaste = useCallback(async (text: string) => {
    if (!db) return;
    setError(null);
    setProcessing(true);
    setFileName(null);
    setFileFormat("csv");
    try {
      const conn = await db.connect();
      try {
        const tempName = "__paste_md.csv";
        const buf = new TextEncoder().encode(text);
        await db.registerFileBuffer(tempName, buf);

        const colResult = await conn.query(`SELECT * FROM read_csv_auto('${tempName}') LIMIT 0`);
        const columns = colResult.schema.fields.map((f: any) => f.name);

        const dataResult = await conn.query(
          `SELECT * FROM read_csv_auto('${tempName}') LIMIT ${maxRows}`
        );
        const rows: string[][] = [];
        for (let i = 0; i < dataResult.numRows; i++) {
          const row: string[] = [];
          for (let j = 0; j < columns.length; j++) {
            const val = dataResult.getChildAt(j)?.get(i);
            row.push(val == null ? "" : String(val));
          }
          rows.push(row);
        }

        const md = toMarkdownTable(columns, rows, alignment);
        setOutput(md);
      } finally {
        await conn.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse pasted data");
      setOutput("");
    } finally {
      setProcessing(false);
    }
  }, [db, alignment, maxRows]);

  useAutoLoadFile(processFile);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? fileName.replace(/\.[^.]+$/, ".md") : "table.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage
      icon={Table}
      title="Markdown Table Generator"
      seoContent={getToolSeo("markdown-table")}
      metaDescription={getToolMetaDescription("markdown-table")}
      description="Convert CSV, JSON, or Parquet data into a formatted Markdown table."
    >
      <DuckDBGate>
        <div className="space-y-4">
          {/* Config */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">Alignment:</label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value as Alignment)}
                className="border-2 border-border bg-background px-2 py-1 text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">Max rows:</label>
              <select
                value={maxRows}
                onChange={(e) => setMaxRows(Number(e.target.value))}
                className="border-2 border-border bg-background px-2 py-1 text-xs"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>

          {/* Input */}
          {!output && !processing && (
            <div className="space-y-4">
              <ToggleButton
                options={[
                  { label: "Upload File", value: "file" },
                  { label: "From URL", value: "url" },
                ]}
                value={inputMode}
                onChange={setInputMode}
              />
              {inputMode === "file" ? (
                <DropZone
                  accept={[".csv", ".json", ".jsonl", ".parquet"]}
                  onFile={processFile}
                  label="Drop a CSV, JSON, or Parquet file"
                />
              ) : (
                <UrlInput
                  onFile={processFile}
                  accept={[".csv", ".json", ".jsonl", ".parquet"]}
                  placeholder="https://example.com/data.csv"
                  label="Load data from URL"
                />
              )}
              <PasteInput
                onSubmit={processPaste}
                placeholder="Paste CSV data here..."
                label="Or paste data directly"
                accept={[".csv", ".json", ".jsonl", ".parquet"]}
                onFile={processFile}
              />
            </div>
          )}

          {error && <ErrorAlert message={error} />}

          {/* Processing overlay */}
          {processing && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Generating markdown table…</span>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Markdown Output
                </h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDownload}>
                    <Download className="h-3 w-3" /> Download .md
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setOutput("");
                      setFileName(null);
                      setFileFormat(null);
                      setStoredFileId(null);
                    }}
                  >
                    New file
                  </Button>
                </div>
              </div>
              <pre className="max-h-[500px] overflow-auto border-2 border-border bg-card p-4 font-mono text-xs whitespace-pre">
                {output}
              </pre>
            </div>
          )}

          {output && fileFormat && (
            <CrossToolLinks
              format={fileFormat}
              fileId={storedFileId ?? undefined}
              excludeRoute="/markdown-table"
            />
          )}
        </div>
      </DuckDBGate>
    </ToolPage>
  );
}
