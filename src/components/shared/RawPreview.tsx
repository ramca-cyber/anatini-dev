import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/CodeBlock";

const MAX_LINES = 1000;
const MAX_BYTES = 50_000;

interface RawPreviewProps {
  content: string | null;
  label: string;
  fileName?: string;
  binary?: boolean;
  onDownload?: () => void;
}

function truncate(raw: string): { text: string; truncated: boolean; shownLines: number; totalLines: number } {
  let text = raw;
  let byteTruncated = false;
  if (new Blob([raw]).size > MAX_BYTES) {
    text = raw.slice(0, MAX_BYTES);
    byteTruncated = true;
  }

  const allLines = text.split("\n");
  const totalLines = byteTruncated ? raw.split("\n").length : allLines.length;

  if (allLines.length > MAX_LINES) {
    return { text: allLines.slice(0, MAX_LINES).join("\n"), truncated: true, shownLines: MAX_LINES, totalLines };
  }

  return { text: allLines.join("\n"), truncated: byteTruncated, shownLines: allLines.length, totalLines };
}

export function RawPreview({ content, label, fileName, binary, onDownload }: RawPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (binary) {
    return (
      <div className="border-2 border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Binary file — raw view not available
      </div>
    );
  }

  if (!content) return null;

  const { text, truncated, shownLines, totalLines } = truncate(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy all"}
        </Button>
      </div>
      <CodeBlock code={text} fileName={fileName ?? label} onDownload={onDownload} />
      {truncated && (
        <p className="text-xs text-muted-foreground text-center">
          Truncated — showing {shownLines.toLocaleString()} of {totalLines.toLocaleString()} lines
        </p>
      )}
    </div>
  );
}
