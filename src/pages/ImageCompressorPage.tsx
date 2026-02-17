import { useState, useRef, useCallback } from "react";
import { ImageDown, Download, Upload } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Slider } from "@/components/ui/slider";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

type Format = "image/jpeg" | "image/png" | "image/webp";
const FORMAT_OPTIONS: { label: string; value: Format }[] = [
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WebP", value: "image/webp" },
];

export default function ImageCompressorPage() {
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [original, setOriginal] = useState<{ url: string; size: number; name: string } | null>(null);
  const [compressed, setCompressed] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const compress = useCallback(async (imgUrl: string) => {
    setError(null);
    try {
      const img = new Image();
      img.src = imgUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error("Compression failed")), format, quality / 100)
      );
      setCompressed({ url: URL.createObjectURL(blob), size: blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed");
    }
  }, [format, quality]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    const url = URL.createObjectURL(file);
    setOriginal({ url, size: file.size, name: file.name });
    setCompressed(null);
    compress(url);
  }

  function handleRecompress() {
    if (original) compress(original.url);
  }

  function handleDownload() {
    if (!compressed) return;
    const ext = format.split("/")[1];
    const a = document.createElement("a");
    a.href = compressed.url;
    a.download = `compressed.${ext}`;
    a.click();
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <ToolPage icon={ImageDown} title="Image Compressor" description="Compress images with quality control. Output JPEG, PNG, or WebP." pageTitle="Image Compressor — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("image-compressor")} seoContent={getToolSeo("image-compressor")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-bold">Format</label>
            <ToggleButton options={FORMAT_OPTIONS} value={format} onChange={(v) => setFormat(v as Format)} />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs text-muted-foreground font-bold whitespace-nowrap">Quality: {quality}%</label>
            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={1} max={100} step={1} className="w-32" />
          </div>
          {original && (
            <Button variant="outline" size="sm" onClick={handleRecompress}>Re-compress</Button>
          )}
        </div>

        {!original ? (
          <div className="border-2 border-dashed border-border p-12 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Click or drop an image to compress</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original — {fmtSize(original.size)}</label>
              <div className="border border-border bg-muted/30 p-2 flex items-center justify-center min-h-[300px]">
                <img src={original.url} alt="Original" className="max-w-full max-h-[400px] object-contain" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Compressed {compressed ? `— ${fmtSize(compressed.size)} (${((1 - compressed.size / original.size) * 100).toFixed(0)}% smaller)` : ""}
                </label>
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!compressed}>
                  <Download className="h-3 w-3 mr-1" /> Download
                </Button>
              </div>
              <div className="border border-border bg-muted/30 p-2 flex items-center justify-center min-h-[300px]">
                {compressed ? (
                  <img src={compressed.url} alt="Compressed" className="max-w-full max-h-[400px] object-contain" />
                ) : (
                  <p className="text-sm text-muted-foreground">Compressing…</p>
                )}
              </div>
            </div>
          </div>
        )}

        <input ref={original ? undefined : fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
