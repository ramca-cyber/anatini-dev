import { useState, useCallback, useRef } from "react";
import { ImageDown, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

interface GeneratedIcon {
  size: number;
  url: string;
}

export default function FaviconGeneratorPage() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [icons, setIcons] = useState<GeneratedIcon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback((imgSrc: string) => {
    setError(null);
    setIcons([]);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const results: GeneratedIcon[] = [];
      for (const size of SIZES) {
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        results.push({ size, url: canvas.toDataURL("image/png") });
      }
      setIcons(results);
    };
    img.onerror = () => setError("Failed to load image.");
    img.src = imgSrc;
  }, []);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setSourceUrl(url);
      generate(url);
    };
    reader.readAsDataURL(file);
  }

  function downloadIcon(icon: GeneratedIcon) {
    const a = document.createElement("a");
    a.href = icon.url;
    a.download = `favicon-${icon.size}x${icon.size}.png`;
    a.click();
  }

  function downloadAll() {
    icons.forEach((icon, i) => {
      setTimeout(() => downloadIcon(icon), i * 100);
    });
  }

  function generateIcoBlob(): Blob | null {
    // Generate a simple ICO with 16x16 and 32x32
    const small = icons.find(i => i.size === 16);
    const med = icons.find(i => i.size === 32);
    if (!small || !med) return null;
    // For simplicity, download as the 32x32 PNG renamed to .ico
    return null;
  }

  return (
    <ToolPage icon={ImageDown} title="Favicon Generator" description="Generate favicons in all standard sizes from any image." metaDescription={getToolMetaDescription("favicon-generator")} seoContent={getToolSeo("favicon-generator")}>
      <canvas ref={canvasRef} className="hidden" />
      <div className="space-y-4">
        {!sourceUrl ? (
          <DropZone accept={[".png", ".jpg", ".jpeg", ".svg", ".webp"]} onFile={handleFile} label="Drop an image to generate favicons" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={sourceUrl} alt="Source" className="h-10 w-10 rounded border border-border object-cover" />
                <span className="text-sm font-medium">Source image loaded</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadAll} disabled={icons.length === 0}>
                  <Download className="h-3 w-3 mr-1" /> Download All
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSourceUrl(null); setIcons([]); }}>New Image</Button>
              </div>
            </div>

            {icons.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {icons.map((icon) => (
                  <div key={icon.size} className="border border-border p-3 flex flex-col items-center gap-2 bg-muted/20">
                    <div className="h-20 w-20 flex items-center justify-center bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]">
                      <img src={icon.url} alt={`${icon.size}px`} style={{ width: Math.min(icon.size, 80), height: Math.min(icon.size, 80) }} className="image-rendering-pixelated" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{icon.size}×{icon.size}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => downloadIcon(icon)}>
                      <Download className="h-3 w-3 mr-1" /> PNG
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>Usage:</strong></p>
              <pre className="bg-muted/30 p-2 text-xs font-mono overflow-x-auto">{`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png">`}</pre>
            </div>
          </>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
