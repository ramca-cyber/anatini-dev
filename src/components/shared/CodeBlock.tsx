import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  fileName?: string;
  onDownload?: () => void;
}

export function CodeBlock({
  code,
  maxHeight = "400px",
  showLineNumbers = true,
  fileName,
  onDownload,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <span className="text-xs text-muted-foreground">{fileName ?? "Output"}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          {onDownload && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Code */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="mr-4 inline-block w-8 text-right text-muted-foreground/50 select-none">
                  {i + 1}
                </span>
              )}
              <code className="text-foreground">{line}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
