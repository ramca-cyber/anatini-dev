import { useState } from "react";
import { getToolSeo } from "@/lib/seo-content";
import { FileText, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
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
  const [xlsx, setXlsx] = useState<any>(null);
  const [workbook, setWorkbook] = useState<any>(null);

  async function loadXlsx() {
    if (xlsx) return xlsx;
    const mod = await import("xlsx");
    setXlsx(mod);
    return mod;
  }

  async function handleFile(f: File) {
    setFile(f);
    setLoading(true);
    setError(null);
    setPreview(null);
    setSheets([]);

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
        loadSheet(wb, wb.SheetNames[0], XLSX);
      } else {
        setMode("excel-to-csv");
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf);
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        loadSheet(wb, wb.SheetNames[0], XLSX);
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
      const rows = data.slice(1, 201).map((row: any[]) =>
        columns.map((_, i) => row[i] ?? null)
      );
      setPreview({ columns, rows });
    }
  }

  function handleSheetChange(name: string) {
    setSelectedSheet(name);
    if (workbook && xlsx) {
      loadSheet(workbook, name, xlsx);
    }
  }

  async function handleDownload() {
    if (!workbook || !xlsx || !file) return;
    const XLSX = xlsx;

    if (mode === "excel-to-csv") {
      const ws = workbook.Sheets[selectedSheet];
      const csv = XLSX.utils.sheet_to_csv(ws);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(csv, `${baseName}_${selectedSheet}.csv`, "text/csv");
    } else {
      const buf = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(new Uint8Array(buf), `${baseName}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
  }

  return (
    <ToolPage icon={FileText} title="Excel ↔ CSV Converter" description="Convert between Excel and CSV with multi-sheet support." seoContent={getToolSeo("excel-csv-converter")}>
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
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setSheets([]); setWorkbook(null); }}>New file</Button>
              </div>
            </div>

            {/* Sheet selector */}
            {sheets.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Sheet:</span>
                <div className="flex gap-1">
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
              <strong>Direction:</strong> {mode === "excel-to-csv" ? "Excel → CSV" : "CSV → Excel"} · <strong>Sheets:</strong> {sheets.length}
            </div>
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {preview && (
          <DataTable columns={preview.columns} rows={preview.rows} className="max-h-[500px]" maxRows={200} />
        )}
      </div>
    </ToolPage>
  );
}
