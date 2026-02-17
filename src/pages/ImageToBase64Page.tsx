import { useState } from "react";
import { Binary, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { toast } from "@/hooks/use-toast";

export default function ImageToBase64Page() {
  const [base64, setBase64] = useState("");
  const [dataUri, setDataUri] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setFileInfo({ name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setDataUri(result);
      setPreview(result);
      // Extract base64 portion after the comma
      const b64 = result.split(",")[1] || "";
      setBase64(b64);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  }

  function handleReset() {
    setBase64("");
    setDataUri("");
    setPreview(null);
    setFileInfo(null);
    setError(null);
  }

  const cssSnippet = fileInfo ? `background-image: url(${dataUri});` : "";
  const htmlSnippet = fileInfo ? `<img src="${dataUri}" alt="${fileInfo.name}" />` : "";

  return (
    <ToolPage icon={Binary} title="Image to Base64" description="Convert images to Base64 data URIs for embedding in HTML/CSS." metaDescription={getToolMetaDescription("image-to-base64")} seoContent={getToolSeo("image-to-base64")}>
      <div className="space-y-4">
        {!preview ? (
          <DropZone accept={[".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp"]} onFile={handleFile} label="Drop an image to convert to Base64" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={preview} alt="Preview" className="h-10 w-10 border border-border object-cover" />
                <div className="text-sm">
                  <p className="font-medium">{fileInfo?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileInfo?.type} · {((fileInfo?.size || 0) / 1024).toFixed(1)} KB → {(base64.length / 1024).toFixed(1)} KB Base64
                    {fileInfo && <span className="ml-1">({((base64.length / fileInfo.size) * 100).toFixed(0)}% of original)</span>}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>New Image</Button>
            </div>

            {/* Base64 string */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Base64 String</label>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(base64, "Base64")}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <textarea
                value={base64}
                readOnly
                className="w-full h-32 border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none break-all"
              />
            </div>

            {/* Data URI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data URI</label>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(dataUri, "Data URI")}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <textarea
                value={dataUri}
                readOnly
                className="w-full h-24 border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none break-all"
              />
            </div>

            {/* Code snippets */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HTML</label>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(htmlSnippet, "HTML snippet")}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <textarea value={htmlSnippet} readOnly className="w-full h-20 border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none break-all" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CSS</label>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(cssSnippet, "CSS snippet")}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <textarea value={cssSnippet} readOnly className="w-full h-20 border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none break-all" />
              </div>
            </div>

            {/* Download */}
            <Button variant="outline" onClick={() => {
              const blob = new Blob([base64], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = (fileInfo?.name || "image") + ".b64.txt";
              a.click();
            }}>
              <Download className="h-4 w-4 mr-1" /> Download .b64.txt
            </Button>
          </>
        )}
        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
