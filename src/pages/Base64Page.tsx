import { useState, useCallback, useEffect, useRef } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Binary, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Mode = "encode" | "decode";

export default function Base64Page() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed — check your input.");
      setOutput("");
    }
  }, [input, mode]);

  useEffect(() => { convert(); }, [convert]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    try {
      if (mode === "encode") {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        setInput("");
        setOutput(base64);
      } else {
        const text = await file.text();
        setInput(text.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    if (mode === "encode") {
      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = (fileName ? fileName + ".b64" : "encoded.b64"); a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "decoded.txt"; a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <ToolPage icon={Binary} title="Base64 Encoder / Decoder" description="Encode text or files to Base64, or decode Base64 back to text." pageTitle="Base64 Encoder / Decoder — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("base64")} seoContent={getToolSeo("base64")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <ToggleButton
              options={[{ label: "Encode", value: "encode" }, { label: "Decode", value: "decode" }]}
              value={mode}
              onChange={(v) => { setMode(v as Mode); setInput(""); setOutput(""); setError(null); setFileName(null); }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Upload File
            </Button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
            {fileName && <span className="text-xs text-muted-foreground font-mono">{fileName}</span>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mode === "encode" ? "Text Input" : "Base64 Input"}
              </label>
              <button onClick={() => { setInput(""); setOutput(""); setFileName(null); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === "encode" ? "Type or paste text to encode…" : "Paste Base64 string to decode…"}
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mode === "encode" ? "Base64 Output" : "Decoded Output"}
              </label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!output}>
                  <Download className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here…"
              className="w-full h-[400px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
