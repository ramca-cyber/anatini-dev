import { useState, useCallback, useEffect, useRef } from "react";
import { QrCode, Download, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import QRCode from "qrcode";

type ErrorLevel = "L" | "M" | "Q" | "H";

export default function QrCodePage() {
  const [input, setInput] = useState("https://anatini.dev");
  const [size, setSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(async () => {
    setError(null);
    if (!input.trim()) { setDataUrl(null); return; }
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await QRCode.toCanvas(canvas, input, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setDataUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate QR code");
      setDataUrl(null);
    }
  }, [input, size, errorLevel]);

  useEffect(() => { generate(); }, [generate]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }

  async function handleCopy() {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast({ title: "QR code copied to clipboard" });
      } catch {
        toast({ title: "Copy failed — try downloading instead", variant: "destructive" });
      }
    });
  }

  return (
    <ToolPage icon={QrCode} title="QR Code Generator" description="Generate QR codes from text, URLs, or any data. Download as PNG." pageTitle="QR Code Generator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("qr-code")} seoContent={getToolSeo("qr-code")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-bold">Error Correction</label>
            <ToggleButton
              options={[
                { label: "Low", value: "L" },
                { label: "Medium", value: "M" },
                { label: "Quartile", value: "Q" },
                { label: "High", value: "H" },
              ]}
              value={errorLevel}
              onChange={(v) => setErrorLevel(v as ErrorLevel)}
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs text-muted-foreground font-bold whitespace-nowrap">Size: {size}px</label>
            <Slider value={[size]} onValueChange={([v]) => setSize(v)} min={100} max={800} step={50} className="w-32" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input Text or URL</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text, URL, or any data…"
              className="w-full h-[200px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">{input.length} characters</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">QR Code</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!dataUrl}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!dataUrl}>
                  <Download className="h-3 w-3 mr-1" /> PNG
                </Button>
              </div>
            </div>
            <div className="border border-border bg-white flex items-center justify-center p-8 min-h-[300px]">
              <canvas ref={canvasRef} className={dataUrl ? "" : "hidden"} />
              {!dataUrl && !error && <p className="text-sm text-muted-foreground">Enter text to generate a QR code</p>}
            </div>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
