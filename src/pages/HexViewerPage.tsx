import { useState, useCallback, useMemo, type ReactNode } from "react";
import { Binary } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo } from "@/components/shared/FileInfo";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleButton } from "@/components/shared/ToggleButton";

const BYTES_PER_ROW = 16;
const PAGE_SIZE = 4096; // bytes per page
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0").toUpperCase();
}

function toAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : ".";
}

function offsetStr(offset: number, width: number): string {
  return offset.toString(16).padStart(width, "0").toUpperCase();
}

interface HexRowProps {
  offset: number;
  bytes: Uint8Array;
  offsetWidth: number;
  highlightByte: number | null;
}

function byteClass(byte: number): string {
  if (byte === 0x00) return "text-muted-foreground/40";
  if (byte === 0x09 || byte === 0x0a || byte === 0x0d || byte === 0x20) return "text-green-600 dark:text-green-400";
  if (byte >= 0x01 && byte <= 0x1f || byte === 0x7f) return "text-red-500 dark:text-red-400";
  if (byte >= 0x80) return "text-blue-600 dark:text-blue-400";
  return "text-foreground";
}

function HexRow({ offset, bytes, offsetWidth, highlightByte }: HexRowProps) {
  const hexLeft: ReactNode[] = [];
  const hexRight: ReactNode[] = [];
  const asciiParts: ReactNode[] = [];

  for (let i = 0; i < BYTES_PER_ROW; i++) {
    if (i < bytes.length) {
      const cls = byteClass(bytes[i]);
      const hex = toHex(bytes[i]);
      const target = i < 8 ? hexLeft : hexRight;
      target.push(<span key={i} className={cls}>{hex}</span>);
      if (i < BYTES_PER_ROW - 1 && i !== 7) target.push(<span key={`s${i}`}> </span>);
      asciiParts.push(<span key={i} className={cls}>{toAscii(bytes[i])}</span>);
    } else {
      const target = i < 8 ? hexLeft : hexRight;
      target.push(<span key={i}>{"  "}</span>);
      if (i < BYTES_PER_ROW - 1 && i !== 7) target.push(<span key={`s${i}`}> </span>);
      asciiParts.push(<span key={i}> </span>);
    }
  }

  return (
    <div className="flex font-mono text-xs leading-5 hover:bg-muted/50 transition-colors">
      <span className="text-muted-foreground select-none w-[8ch] shrink-0 text-right pr-3">
        {offsetStr(offset, offsetWidth)}
      </span>
      <span className="pr-2">{hexLeft}</span>
      <span className="pr-4">{hexRight}</span>
      <span className="select-none border-l border-border pl-3">
        {asciiParts}
      </span>
    </div>
  );
}

export default function HexViewerPage() {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [goToOffset, setGoToOffset] = useState("");
  const [uppercase, setUppercase] = useState(true);

  const totalPages = data ? Math.ceil(data.length / PAGE_SIZE) : 0;
  const offsetWidth = data ? Math.max(6, data.length.toString(16).length) : 6;

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${formatSize(file.size)}). Maximum is ${formatSize(MAX_FILE_SIZE)}.`);
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      setData(new Uint8Array(buf));
      setFileName(file.name);
      setFileSize(file.size);
      setPage(0);
    } catch {
      setError("Failed to read file.");
    }
  }, []);

  const pageData = useMemo(() => {
    if (!data) return null;
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, data.length);
    return data.slice(start, end);
  }, [data, page]);

  const rows = useMemo(() => {
    if (!pageData) return [];
    const result: { offset: number; bytes: Uint8Array }[] = [];
    const baseOffset = page * PAGE_SIZE;
    for (let i = 0; i < pageData.length; i += BYTES_PER_ROW) {
      result.push({
        offset: baseOffset + i,
        bytes: pageData.slice(i, i + BYTES_PER_ROW),
      });
    }
    return result;
  }, [pageData, page]);

  const handleGoTo = () => {
    const parsed = parseInt(goToOffset, 16);
    if (isNaN(parsed) || !data) return;
    const targetPage = Math.floor(Math.min(parsed, data.length - 1) / PAGE_SIZE);
    setPage(Math.max(0, targetPage));
    setGoToOffset("");
  };

  const seo = getToolSeo("hex-viewer");
  const meta = getToolMetaDescription("hex-viewer");

  return (
    <ToolPage
      icon={Binary}
      title="Hex Viewer"
      description="Inspect binary files with hex and ASCII columns, offset navigation."
      metaDescription={meta}
      seoContent={seo}
    >
      {!data && (
        <DropZone
          accept={["*/*"]}
          onFile={handleFile}
          label="Drop any file to inspect its bytes"
        />
      )}

      {error && <ErrorAlert message={error} />}

      {data && (
        <div className="space-y-4">
          <FileInfo
            name={fileName}
            size={formatSize(fileSize)}
            extras={[
              { label: "Bytes", value: fileSize.toLocaleString() },
              { label: "Pages", value: totalPages.toLocaleString() },
            ]}
          />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(0)}
              >
                ⟨⟨
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {(page + 1).toLocaleString()} / {totalPages.toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
              >
                ⟩⟩
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Go to offset (hex):</Label>
              <Input
                className="h-8 w-28 font-mono text-xs"
                placeholder="0x00000"
                value={goToOffset}
                onChange={(e) => setGoToOffset(e.target.value.replace(/[^0-9a-fA-F]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
              />
              <Button variant="outline" size="sm" onClick={handleGoTo}>
                Go
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setData(null);
                  setFileName("");
                  setFileSize(0);
                  setPage(0);
                }}
              >
                New File
              </Button>
            </div>
          </div>

          {/* Hex dump */}
          <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex font-mono text-xs leading-5 bg-muted/50 px-4 py-1.5 border-b border-border text-muted-foreground select-none">
              <span className="w-[8ch] shrink-0 text-right pr-3">Offset</span>
              <span className="pr-2">
                {Array.from({ length: 8 }, (_, i) => toHex(i)).join(" ")}
              </span>
              <span className="pr-4">
                {Array.from({ length: 8 }, (_, i) => toHex(i + 8)).join(" ")}
              </span>
              <span className="border-l border-border pl-3">ASCII</span>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="px-4 py-1">
                {rows.map((row) => (
                  <HexRow
                    key={row.offset}
                    offset={row.offset}
                    bytes={row.bytes}
                    offsetWidth={offsetWidth}
                    highlightByte={null}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Byte range info */}
          <p className="text-xs text-muted-foreground text-center">
            Showing bytes {(page * PAGE_SIZE).toLocaleString()}–
            {Math.min((page + 1) * PAGE_SIZE - 1, fileSize - 1).toLocaleString()} of{" "}
            {(fileSize - 1).toLocaleString()}
          </p>
        </div>
      )}
    </ToolPage>
  );
}
