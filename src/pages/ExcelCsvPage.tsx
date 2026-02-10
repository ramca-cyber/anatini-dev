import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileText, FlaskConical, Upload } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/duckdb-helpers";
import { generateSampleExcel } from "@/lib/sample-data";

export default function ExcelCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [mode, setMode] = useState<"excel-to-csv" | "csv-to-excel">("excel-to-csv");
  const [xlsxMod, setXlsxMod] = useState<any>(null);
  const [workbook, setWorkbook] = useState<any>(null);
  const [csvOutput, setCsvOutput] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "raw-output">("table");

  // CSV to Excel state
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [csvSheetNames, setCsvSheetNames] = useState<string[]>([]);

  async function loadXlsx() {
    if (xlsxMod) return xlsxMod;
    const mod = await import("xlsx");
    setXlsxMod(mod);
    return mod;
  }

  async function handleFile(f: File) {
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setSheets([]);
    setCsvOutput(null);
    setView("table");
    setCsvFiles([]);

    const ext = f.name.split(".").pop()?.toLowerCase();
    try {
      const XLSX = await loadXlsx();
      if (ext === "csv" || ext === "tsv") {
        setMode("csv-to-excel");
        const text = await f.text();
        const wb = XLSX.read(text, { type: "string" });
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        setCsvFiles([f]);
        setCsvSheetNames([f.name.replace(/\.[^.]+$/, "")]);
        loadSheet(wb, wb.SheetNames[0], XLSX);
      } else {
        setMode("excel-to-csv");
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf);
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        loadSheet(wb, wb.SheetNames[0], XLSX);
        const ws = wb.Sheets[wb.SheetNames[0]];
        setCsvOutput(XLSX.utils.sheet_to_csv(ws));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }

  function loadSheet(wb: any, sheetName: string, XLSX: any) {
    const ws = wb.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length > 0) {
      const columns = (data[0] as string[]).map((c) => String(c ?? ""));
      const rows = data.slice(1, 201).map((row: any[]) => columns.map((_, i) => row[i] ?? null));
      setPreview({ columns, rows });
    }
    if (mode === "excel-to-csv") {
      setCsvOutput(XLSX.utils.sheet_to_csv(ws));
    }
  }

  function handleSheetChange(name: string) {
    setSelectedSheet(name);
    if (workbook && xlsxMod) loadSheet(workbook, name, xlsxMod);
  }

  async function handleDownload() {
    if (!file) return;
    const XLSX = await loadXlsx();
    if (mode === "excel-to-csv") {
      if (!workbook) return;
      const ws = workbook.Sheets[selectedSheet];
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadBlob(csv, `${file.name.replace(/\.[^.]+$/, "")}_${selectedSheet}.csv`, "text/csv");
    } else {
      // CSV to Excel: build a new workbook from csvFiles
      const wb = XLSX.utils.book_new();
      for (let i = 0; i < csvFiles.length; i++) {
        const text = await csvFiles[i].text();
        const tempWb = XLSX.read(text, { type: "string" });
        const ws = tempWb.Sheets[tempWb.SheetNames[0]];
        XLSX.utils.book_append_sheet(wb, ws, csvSheetNames[i] || `Sheet${i + 1}`);
      }
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      downloadBlob(new Uint8Array(buf), `${file.name.replace(/\.[^.]+$/, "")}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
  }

  function handleDownloadCsv() {
    if (!csvOutput || !file) return;
    downloadBlob(csvOutput, `${file.name.replace(/\.[^.]+$/, "")}_${selectedSheet}.csv`, "text/csv");
  }

  async function handleAddCsvFile(f: File) {
    setCsvFiles((prev) => [...prev, f]);
    setCsvSheetNames((prev) => [...prev, f.name.replace(/\.[^.]+$/, "")]);
  }

  function updateSheetName(index: number, name: string) {
    setCsvSheetNames((prev) => prev.map((n, i) => i === index ? name : n));
  }

  return (
    <ToolPage icon={FileText} title="Excel ↔ CSV Converter" description="Convert between Excel and CSV with multi-sheet support." metaDescription={getToolMetaDescription("excel-csv-converter")} seoContent={getToolSeo("excel-csv-converter")}>
      <div className="space-y-4">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".xlsx", ".xls", ".csv", ".tsv"]} onFile={handleFile} label="Drop an Excel or CSV file" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={async () => { const f = await generateSampleExcel(); handleFile(f); }}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} />
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  {mode === "excel-to-csv" ? "Download CSV" : "Download Excel"}
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setSheets([]); setWorkbook(null); setCsvOutput(null); setCsvFiles([]); setCsvSheetNames([]); }}>New file</Button>
              </div>
            </div>

            {/* Sheet selector */}
            {sheets.length > 1 && mode === "excel-to-csv" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Sheet:</span>
                <div className="flex gap-1 flex-wrap">
                  {sheets.map((s) => (
                    <button key={s} onClick={() => handleSheetChange(s)}
                      className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${selectedSheet === s ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-border p-3 text-xs text-muted-foreground">
              <strong>Direction:</strong> {mode === "excel-to-csv" ? "Excel → CSV" : "CSV → Excel"} · <strong>Sheets:</strong> {mode === "csv-to-excel" ? csvFiles.length : sheets.length}
            </div>

            {/* CSV to Excel: multi-file and sheet naming */}
            {mode === "csv-to-excel" && (
              <div className="space-y-3">
                <div className="border-2 border-border p-3 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">Sheets (one per CSV file)</div>
                  {csvFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground truncate max-w-[200px]">{f.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <input
                        value={csvSheetNames[i]}
                        onChange={(e) => updateSheetName(i, e.target.value)}
                        className="border-2 border-border bg-background px-2 py-1 text-xs w-32"
                        placeholder="Sheet name"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv,.tsv";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) handleAddCsvFile(f);
                    };
                    input.click();
                  }}>
                    <Upload className="h-3 w-3 mr-1" /> Add another CSV
                  </Button>
                </div>
              </div>
            )}

            {/* View toggle (only for excel-to-csv) */}
            {mode === "excel-to-csv" && (
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {([["table", "Table View"], ...(csvOutput ? [["raw-output", "Raw CSV Output"]] : [])] as [string, string][]).map(([v, label]) => (
                    <button key={v} onClick={() => setView(v as any)}
                      className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${view === v ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">· Input is binary Excel</span>
              </div>
            )}
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {preview && view === "table" && (
          <DataTable columns={preview.columns} rows={preview.rows} className="max-h-[500px]" maxRows={200} />
        )}
        {csvOutput && view === "raw-output" && mode === "excel-to-csv" && (
          <RawPreview content={csvOutput} label="Raw CSV Output" fileName="output.csv" onDownload={handleDownloadCsv} />
        )}
      </div>
    </ToolPage>
  );
}
