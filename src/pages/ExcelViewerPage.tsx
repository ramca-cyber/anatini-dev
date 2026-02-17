import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Eye, Check } from "lucide-react";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { ToolPage } from "@/components/shared/ToolPage";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { formatBytes, warnLargeFile } from "@/lib/duckdb-helpers";
import { generateSampleExcel } from "@/lib/sample-data";

export default function ExcelViewerPage() {
  const { addFile } = useFileStore();
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [xlsxMod, setXlsxMod] = useState<any>(null);
  const [workbook, setWorkbook] = useState<any>(null);
  const [rowCount, setRowCount] = useState(0);

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

    try {
      const XLSX = await loadXlsx();
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      setActiveSheet(wb.SheetNames[0]);
      loadSheet(wb, wb.SheetNames[0], XLSX);
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
      const rows = data.slice(1).map((row: any[]) => columns.map((_, i) => row[i] ?? null));
      setPreview({ columns, rows });
      setRowCount(rows.length);
    } else {
      setPreview(null);
      setRowCount(0);
    }
  }

  function handleSheetClick(name: string) {
    setActiveSheet(name);
    if (workbook && xlsxMod) loadSheet(workbook, name, xlsxMod);
  }

  function resetAll() {
    setFile(null);
    setPreview(null);
    setSheets([]);
    setWorkbook(null);
    setError(null);
    setStoredFileId(null);
    setRowCount(0);
  }

  return (
    <ToolPage
      icon={Eye}
      title="Excel Viewer"
      description="Browse Excel (XLSX, XLS) files with multi-sheet navigation. No uploads, no installs."
      metaDescription={getToolMetaDescription("excel-viewer")}
      seoContent={getToolSeo("excel-viewer")}
    >
      <div className="relative space-y-4">
        {!file && (
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
                accept={[".xlsx", ".xls"]}
                onFile={handleFile}
                label="Drop an Excel file"
                sampleAction={{
                  label: "⚗ Try with sample data",
                  onClick: async () => {
                    const f = await generateSampleExcel();
                    handleFile(f);
                  },
                }}
              />
            ) : (
              <UrlInput
                onFile={handleFile}
                accept={[".xlsx", ".xls"]}
                placeholder="https://example.com/data.xlsx"
                label="Load Excel from URL"
              />
            )}
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <FileInfo
                name={file.name}
                size={formatBytes(file.size)}
                extras={[
                  { label: "Sheets", value: sheets.length },
                  { label: "Rows", value: rowCount },
                ]}
              />
              <Button variant="outline" onClick={resetAll}>
                New file
              </Button>
            </div>

            {sheets.length > 1 && (
              <div className="border border-border bg-muted/30 px-4 py-3 space-y-2">
                <div className="text-xs font-bold text-muted-foreground">Sheets:</div>
                <div className="flex flex-wrap gap-2">
                  {sheets.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSheetClick(s)}
                      className={`px-3 py-1 text-xs font-bold border border-border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                        activeSheet === s
                          ? "bg-foreground text-background"
                          : "bg-background text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s}
                      {activeSheet === s && <Check className="h-3 w-3 inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <DataTable columns={preview.columns} rows={preview.rows} className="max-h-[600px]" />
            )}

            <CrossToolLinks format="excel" fileId={storedFileId ?? undefined} excludeRoute="/excel-viewer" />
          </div>
        )}

        {loading && <LoadingState message="Loading spreadsheet..." />}
        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
