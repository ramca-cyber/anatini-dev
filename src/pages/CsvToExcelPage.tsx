import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileText, Upload, Download } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { getSampleCSV } from "@/lib/sample-data";

import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes, warnLargeFile } from "@/lib/duckdb-helpers";

export default function CsvToExcelPage() {
  const { addFile } = useFileStore();
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [xlsxMod, setXlsxMod] = useState<any>(null);
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [csvSheetNames, setCsvSheetNames] = useState<string[]>([]);

  async function loadXlsx() {
    if (xlsxMod) return xlsxMod;
    const mod = await import("xlsx");
    setXlsxMod(mod);
    return mod;
  }

  useAutoLoadFile(handleFile);

  async function handleFile(f: File) {
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setCsvFiles([f]);
    setCsvSheetNames([f.name.replace(/\.[^.]+$/, "")]);

    try {
      const XLSX = await loadXlsx();
      const text = await f.text();
      const wb = XLSX.read(text, { type: "string" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        const columns = (data[0] as string[]).map((c) => String(c ?? ""));
        const rows = data.slice(1, 201).map((row: any[]) => columns.map((_, i) => row[i] ?? null));
        setPreview({ columns, rows });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCsvFile(f: File) {
    setCsvFiles((prev) => [...prev, f]);
    setCsvSheetNames((prev) => [...prev, f.name.replace(/\.[^.]+$/, "")]);
  }

  function updateSheetName(index: number, name: string) {
    setCsvSheetNames((prev) => prev.map((n, i) => i === index ? name : n));
  }

  function removeCsvFile(index: number) {
    setCsvFiles(prev => prev.filter((_, i) => i !== index));
    setCsvSheetNames(prev => prev.filter((_, i) => i !== index));
  }

  async function handleDownload() {
    if (csvFiles.length === 0) return;
    const XLSX = await loadXlsx();
    const wb = XLSX.utils.book_new();
    for (let i = 0; i < csvFiles.length; i++) {
      const text = await csvFiles[i].text();
      const tempWb = XLSX.read(text, { type: "string" });
      const ws = tempWb.Sheets[tempWb.SheetNames[0]];
      XLSX.utils.book_append_sheet(wb, ws, csvSheetNames[i] || `Sheet${i + 1}`);
    }
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const baseName = file?.name.replace(/\.[^.]+$/, "") ?? "output";
    downloadBlob(new Uint8Array(buf), `${baseName}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  function resetAll() {
    setFile(null); setPreview(null); setCsvFiles([]); setCsvSheetNames([]);
    setError(null); setStoredFileId(null);
  }

  return (
    <ToolPage icon={FileText} title="CSV to Excel" description="Convert CSV files to Excel (XLSX) with multi-sheet support." metaDescription={getToolMetaDescription("csv-to-excel")} seoContent={getToolSeo("csv-to-excel")}>
      <div className="space-y-4">
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

        {file && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <FileInfo name={file.name} size={formatBytes(file.size)} extras={[{ label: "Sheets", value: csvFiles.length }]} />
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download Excel
                </Button>
                <Button variant="outline" onClick={resetAll}>New file</Button>
              </div>
            </div>

            {/* Multi-file sheet naming */}
            <div className="border border-border p-3 space-y-2">
              <div className="text-xs font-bold text-muted-foreground">Sheets (one per CSV file)</div>
              {csvFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-muted-foreground truncate max-w-[200px]">{f.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <input
                    value={csvSheetNames[i]}
                    onChange={(e) => updateSheetName(i, e.target.value)}
                    className="border border-border bg-background px-2 py-1 text-xs w-32"
                    placeholder="Sheet name"
                  />
                  {csvFiles.length > 1 && (
                    <button onClick={() => removeCsvFile(i)} className="text-destructive hover:text-destructive/80 text-xs">✕</button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,.tsv";
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) Array.from(files).forEach(f => handleAddCsvFile(f));
                };
                input.click();
              }}>
                <Upload className="h-3 w-3 mr-1" /> Add more CSVs
              </Button>
            </div>
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <ErrorAlert message={error} />}

        {preview && (
          <DataTable columns={preview.columns} rows={preview.rows} className="max-h-[500px]" maxRows={200} />
        )}

        
      </div>
    </ToolPage>
  );
}
