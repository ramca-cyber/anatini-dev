import { useState, useCallback, useRef } from "react";
import { ImageDown, Download, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { toast } from "@/hooks/use-toast";

export default function SvgToPngPage() {
  const [svgSource, setSvgSource] = useState<string | null>(null);
  const [svgText, setSvgText] = useState("");
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const convert = useCallback((svg: string, s: number, bg: string, transp: boolean) => {
    setError(null);
    setPngUrl(null);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");
      const errorNode = doc.querySelector("parsererror");
      if (errorNode) throw new Error("Invalid SVG markup");

      const svgEl = doc.documentElement;
      let w = parseFloat(svgEl.getAttribute("width") || "0");
      let h = parseFloat(svgEl.getAttribute("height") || "0");
      const vb = svgEl.getAttribute("viewBox");
      if ((!w || !h) && vb) {
        const parts = vb.split(/[\s,]+/).map(Number);
        w = parts[2] || 300;
        h = parts[3] || 150;
      }
      if (!w) w = 300;
      if (!h) h = 150;

      const scaledW = Math.round(w * s);
      const scaledH = Math.round(h * s);
      setDimensions({ w: scaledW, h: scaledH });

      const canvas = canvasRef.current!;
      canvas.width = scaledW;
      canvas.height = scaledH;
      const ctx = canvas.getContext("2d")!;

      if (!transp) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, scaledW, scaledH);
      } else {
        ctx.clearRect(0, 0, scaledW, scaledH);
      }

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, scaledW, scaledH);
        URL.revokeObjectURL(url);
        const png = canvas.toDataURL("image/png");
        setPngUrl(png);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("Failed to render SVG to canvas.");
      };
      img.src = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    }
  }, []);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setSvgSource(text);
      setSvgText(text);
      convert(text, scale, bgColor, transparent);
    };
    reader.readAsText(file);
  }

  function handlePaste() {
    if (!svgText.trim()) return;
    setSvgSource(svgText);
    convert(svgText, scale, bgColor, transparent);
  }

  function handleDownload() {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "converted.png";
    a.click();
  }

  function reconvert() {
    if (svgSource) convert(svgSource, scale, bgColor, transparent);
  }

  return (
    <ToolPage icon={ImageDown} title="SVG to PNG" description="Convert SVG files to PNG images with custom scale and background." metaDescription={getToolMetaDescription("svg-to-png")} seoContent={getToolSeo("svg-to-png")}>
      <canvas ref={canvasRef} className="hidden" />
      <div className="space-y-4">
        {!svgSource ? (
          <div className="space-y-4">
            <DropZone accept={[".svg"]} onFile={handleFile} label="Drop an SVG file here" />
            <div className="text-center text-xs text-muted-foreground">— or paste SVG markup —</div>
            <textarea
              value={svgText}
              onChange={(e) => setSvgText(e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
              className="w-full h-48 border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
            <Button onClick={handlePaste} disabled={!svgText.trim()}>Convert Pasted SVG</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Scale:</label>
                  <Slider min={1} max={8} step={1} value={[scale]} onValueChange={(v) => { setScale(v[0]); }} className="w-32" />
                  <span className="text-xs font-mono w-6">{scale}×</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
                  Transparent
                </label>
                {!transparent && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground">BG:</label>
                    <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-10 p-0.5 cursor-pointer" />
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={reconvert}>Re-render</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSvgSource(null); setSvgText(""); setPngUrl(null); setDimensions(null); }}>New SVG</Button>
            </div>

            {dimensions && (
              <p className="text-xs text-muted-foreground">Output: {dimensions.w} × {dimensions.h} px</p>
            )}

            {pngUrl && (
              <div className="space-y-3">
                <div className="border border-border p-4 bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] flex items-center justify-center">
                  <img src={pngUrl} alt="Converted PNG" className="max-w-full max-h-[500px]" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload}><Download className="h-4 w-4 mr-1" /> Download PNG</Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(pngUrl); toast({ title: "Data URL copied" }); }}>
                    <Copy className="h-4 w-4 mr-1" /> Copy Data URL
                  </Button>
                </div>
              </div>
            )}

            {error && <ErrorAlert message={error} />}
          </>
        )}
      </div>
    </ToolPage>
  );
}
