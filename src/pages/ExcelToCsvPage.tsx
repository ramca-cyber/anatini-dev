import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileText, Download, Check, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { ConfirmNewDialog } from "@/components/shared/ConfirmNewDialog";
import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { RawPreview } from "@/components/shared/RawPreview";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { downloadBlob, formatBytes, warnLargeFile } from "@/lib/duckdb-helpers";
import { generateSampleExcel } from "@/lib/sample-data";

export default function ExcelToCsvPage() {
  const { addFile } = useFileStore();
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [activeSheet, setActiveSheet] = useState("");
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [xlsxMod, setXlsxMod] = useState<any>(null);
  const [workbook, setWorkbook] = useState<any>(null);
  const [csvOutput, setCsvOutput] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "raw-output">("table");
  const [showDataPreview, setShowDataPreview] = useState(true);

  async function loadXlsx() {
    if (xlsxMod) return xlsxMod;
    const mod = await import("@e965/xlsx");
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
    setSheets([]);
    setCsvOutput(null);
    setView("table");

    try {
      const XLSX = await loadXlsx();
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      setActiveSheet(wb.SheetNames[0]);
      setSelectedSheets(new Set(wb.SheetNames));
      loadSheet(wb, wb.SheetNames[0], XLSX);
      const ws = wb.Sheets[wb.SheetNames[0]];
      setCsvOutput(XLSX.utils.sheet_to_csv(ws));
      setShowDataPreview(false);
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
    setCsvOutput(XLSX.utils.sheet_to_csv(ws));
  }

  function handleSheetClick(name: string) {
    setActiveSheet(name);
    if (workbook && xlsxMod) loadSheet(workbook, name, xlsxMod);
  }

  function toggleSheetSelection(name: string) {
    setSelectedSheets(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function handleDownload() {
    if (!file || !workbook) return;
    const XLSX = xlsxMod;
    if (!XLSX) return;
    const sheetsToExport = sheets.filter(s => selectedSheets.has(s));
    if (sheetsToExport.length === 1) {
      const ws = workbook.Sheets[sheetsToExport[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadBlob(csv, `${file.name.replace(/\.[^.]+$/, "")}_${sheetsToExport[0]}.csv`, "text/csv");
    } else {
      for (const s of sheetsToExport) {
        const ws = workbook.Sheets[s];
        const csv = XLSX.utils.sheet_to_csv(ws);
        downloadBlob(csv, `${file.name.replace(/\.[^.]+$/, "")}_${s}.csv`, "text/csv");
      }
    }
  }

  function handleDownloadCsv() {
    if (!csvOutput || !file) return;
    downloadBlob(csvOutput, `${file.name.replace(/\.[^.]+$/, "")}_${activeSheet}.csv`, "text/csv");
  }

  function resetAll() {
    setFile(null); setPreview(null); setSheets([]); setWorkbook(null);
    setCsvOutput(null); setSelectedSheets(new Set()); setError(null); setStoredFileId(null);
  }

  return (
    <ToolPage icon={FileText} title="Excel to CSV" description="Convert Excel (XLSX, XLS) files to CSV with multi-sheet support." metaDescription={getToolMetaDescription("excel-to-csv")} seoContent={getToolSeo("excel-to-csv")}>
      <div className="relative space-y-4">
        {!file && (
          <div className="space-y-4">
            <ToggleButton
              options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
              value={inputMode}
              onChange={setInputMode}
            />
            {inputMode === "file" ? (
              <DropZone
                accept={[".xlsx", ".xls"]}
                onFile={handleFile}
                label="Drop an Excel file"
                sampleAction={{ label: "⚗ Try with sample data", onClick: async () => { const f = await generateSampleExcel(); handleFile(f); } }}
              />
            ) : (
              <UrlInput onFile={handleFile} accept={[".xlsx", ".xls"]} placeholder="https://example.com/data.xlsx" label="Load Excel from URL" />
            )}
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <FileInfo name={file.name} size={formatBytes(file.size)} extras={[{ label: "Sheets", value: sheets.length }]} />
              <ConfirmNewDialog onConfirm={resetAll} hasOutput={!!csvOutput} />
            </div>

            {sheets.length > 0 && (
              <div className="border border-border bg-muted/30 px-4 py-3 space-y-2">
                <div className="text-xs font-bold text-muted-foreground">Select sheets to export:</div>
                <div className="flex flex-wrap gap-2">
                  {sheets.map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedSheets.has(s)}
                        onChange={() => toggleSheetSelection(s)}
                        className="rounded"
                      />
                      <button
                        onClick={() => handleSheetClick(s)}
                        className={`px-3 py-1 text-xs font-bold border border-border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${activeSheet === s ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}
                      >
                        {s}
                        {activeSheet === s && <Check className="h-3 w-3 inline ml-1" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleDownload} disabled={selectedSheets.size === 0} className="w-full" size="lg">
              <Download className="h-5 w-5 mr-2" />
              {selectedSheets.size > 1 ? `Download ${selectedSheets.size} CSVs` : "Download CSV"}
            </Button>

            <Collapsible open={showDataPreview} onOpenChange={setShowDataPreview}>
              <div className="flex items-center justify-between gap-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showDataPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <h3 className="text-xs font-bold uppercase tracking-widest">Data Preview</h3>
                </CollapsibleTrigger>
                <ToggleButton
                  options={[
                    { label: "Table View", value: "table" },
                    ...(csvOutput ? [{ label: "Raw CSV Output", value: "raw-output" }] : []),
                  ]}
                  value={view}
                  onChange={(v) => setView(v as any)}
                />
              </div>
              <CollapsibleContent className="pt-3 space-y-3">
                {preview && view === "table" && (
                  <DataTable columns={preview.columns} rows={preview.rows} className="max-h-[500px]" maxRows={200} />
                )}
                {csvOutput && view === "raw-output" && (
                  <RawPreview content={csvOutput} label="Raw CSV Output" fileName="output.csv" onDownload={handleDownloadCsv} />
                )}
              </CollapsibleContent>
            </Collapsible>

            <CrossToolLinks format="excel" fileId={storedFileId ?? undefined} excludeRoute="/excel-to-csv" />
          </div>
        )}

        {loading && <LoadingState message="Processing file..." />}
        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
