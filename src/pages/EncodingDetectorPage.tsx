import { useState, useRef } from "react";
import { ScanSearch, Upload } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";

type DetectionResult = {
  fileName: string;
  fileSize: number;
  encoding: string;
  confidence: string;
  hasBOM: boolean;
  bomType?: string;
  lineEnding: string;
  nullBytes: number;
  highBytes: number;
  printableRatio: number;
  preview: string;
};

function detectEncoding(buffer: ArrayBuffer, fileName: string): DetectionResult {
  const bytes = new Uint8Array(buffer);
  const size = bytes.length;

  // BOM detection
  let hasBOM = false;
  let bomType: string | undefined;
  let encoding = "Unknown";
  let confidence = "Low";

  if (size >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    hasBOM = true; bomType = "UTF-8 BOM"; encoding = "UTF-8"; confidence = "High (BOM)";
  } else if (size >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    if (size >= 4 && bytes[2] === 0x00 && bytes[3] === 0x00) {
      hasBOM = true; bomType = "UTF-32 LE BOM"; encoding = "UTF-32 LE"; confidence = "High (BOM)";
    } else {
      hasBOM = true; bomType = "UTF-16 LE BOM"; encoding = "UTF-16 LE"; confidence = "High (BOM)";
    }
  } else if (size >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    hasBOM = true; bomType = "UTF-16 BE BOM"; encoding = "UTF-16 BE"; confidence = "High (BOM)";
  } else if (size >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0xFE && bytes[3] === 0xFF) {
    hasBOM = true; bomType = "UTF-32 BE BOM"; encoding = "UTF-32 BE"; confidence = "High (BOM)";
  }

  // Statistical analysis
  let nullBytes = 0;
  let highBytes = 0;
  let printable = 0;
  let crCount = 0;
  let lfCount = 0;
  let crlfCount = 0;
  const scanLen = Math.min(size, 65536);

  for (let i = 0; i < scanLen; i++) {
    const b = bytes[i];
    if (b === 0x00) nullBytes++;
    if (b > 0x7F) highBytes++;
    if ((b >= 0x20 && b <= 0x7E) || b === 0x09 || b === 0x0A || b === 0x0D) printable++;
    if (b === 0x0D) {
      crCount++;
      if (i + 1 < scanLen && bytes[i + 1] === 0x0A) crlfCount++;
    }
    if (b === 0x0A) lfCount++;
  }

  const printableRatio = scanLen > 0 ? printable / scanLen : 0;

  // Heuristic encoding detection (when no BOM)
  if (!hasBOM) {
    if (nullBytes > scanLen * 0.01) {
      // Lots of nulls → likely binary or UTF-16/32 without BOM
      if (nullBytes > scanLen * 0.3) {
        encoding = "Binary / Unknown"; confidence = "Medium";
      } else {
        encoding = "Possibly UTF-16 (no BOM)"; confidence = "Low";
      }
    } else if (highBytes === 0) {
      encoding = "ASCII"; confidence = "High";
    } else {
      // Try to validate as UTF-8
      let validUtf8 = true;
      for (let i = 0; i < scanLen && validUtf8; i++) {
        const b = bytes[i];
        if (b <= 0x7F) continue;
        let needed = 0;
        if ((b & 0xE0) === 0xC0) needed = 1;
        else if ((b & 0xF0) === 0xE0) needed = 2;
        else if ((b & 0xF8) === 0xF0) needed = 3;
        else { validUtf8 = false; break; }
        for (let j = 0; j < needed; j++) {
          i++;
          if (i >= scanLen || (bytes[i] & 0xC0) !== 0x80) { validUtf8 = false; break; }
        }
      }
      if (validUtf8) {
        encoding = "UTF-8"; confidence = highBytes > scanLen * 0.05 ? "High" : "Medium";
      } else {
        encoding = "ISO-8859-1 / Windows-1252"; confidence = "Medium";
      }
    }
  }

  // Line ending detection
  let lineEnding = "Unknown";
  if (crlfCount > 0 && crlfCount >= lfCount * 0.8) lineEnding = "CRLF (Windows)";
  else if (lfCount > crCount) lineEnding = "LF (Unix/macOS)";
  else if (crCount > 0 && lfCount === 0) lineEnding = "CR (Classic Mac)";
  else if (lfCount === 0 && crCount === 0) lineEnding = "None (single line)";
  else lineEnding = "Mixed";

  // Text preview
  const decoder = new TextDecoder(encoding.startsWith("UTF-8") || encoding === "ASCII" ? "utf-8" : "utf-8", { fatal: false });
  const previewBytes = bytes.slice(hasBOM && bomType?.includes("UTF-8") ? 3 : 0, Math.min(500, size));
  const preview = decoder.decode(previewBytes);

  return {
    fileName,
    fileSize: size,
    encoding,
    confidence,
    hasBOM,
    bomType,
    lineEnding,
    nullBytes,
    highBytes,
    printableRatio,
    preview,
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export default function EncodingDetectorPage() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setError(null);
    try {
      const buffer = await f.arrayBuffer();
      setResult(detectEncoding(buffer, f.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
    }
  }

  return (
    <ToolPage
      icon={ScanSearch}
      title="Encoding Detector"
      description="Detect the character encoding, BOM, and line endings of any file."
      pageTitle="Encoding Detector — Detect File Charset | Anatini.dev"
      metaDescription="Detect the character encoding (UTF-8, ASCII, ISO-8859-1, UTF-16), BOM markers, and line endings of any file. Free, offline, no data leaves your browser."
    >
      <div className="space-y-4">
        {!result ? (
          <DropZone accept={["*"]} onFile={handleFile} label="Drop any file to detect its encoding" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border border-border bg-muted/30 px-4 py-3">
              <span className="text-sm font-mono font-medium">{result.fileName}</span>
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>Analyze Another</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Encoding" value={result.encoding} detail={`Confidence: ${result.confidence}`} />
              <StatCard label="BOM" value={result.hasBOM ? result.bomType! : "None"} detail={result.hasBOM ? "Byte Order Mark detected" : "No BOM present"} />
              <StatCard label="Line Endings" value={result.lineEnding} />
              <StatCard label="File Size" value={formatBytes(result.fileSize)} detail={`${result.fileSize.toLocaleString()} bytes`} />
              <StatCard label="Printable Ratio" value={`${(result.printableRatio * 100).toFixed(1)}%`} detail={`${result.highBytes} high bytes, ${result.nullBytes} null bytes`} />
              <StatCard
                label="Classification"
                value={result.printableRatio > 0.9 ? "Text File" : result.printableRatio > 0.5 ? "Mixed Content" : "Binary File"}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text Preview (first 500 bytes)</label>
              <pre className="border border-border bg-background px-3 py-2 text-xs font-mono overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                {result.preview}
              </pre>
            </div>
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      {detail && <div className="text-xs text-muted-foreground mt-1">{detail}</div>}
    </div>
  );
}
