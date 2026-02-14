import { useState, useCallback, useEffect } from "react";
import { Link2, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Mode = "encode" | "decode";
type Variant = "component" | "full" | "params";

const sampleText = "Hello World! Special chars: é, ñ, ü & symbols: @#$%^&*()";
const sampleUrl = "https://example.com/search?q=hello+world&lang=en&page=1#results";

export default function UrlEncoderPage() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Variant>("component");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      if (mode === "encode") {
        if (variant === "component") setOutput(encodeURIComponent(input));
        else if (variant === "full") setOutput(encodeURI(input));
        else {
          // Encode as query params (key=value pairs)
          const params = new URLSearchParams();
          input.split("\n").forEach(line => {
            const eq = line.indexOf("=");
            if (eq > 0) params.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
            else if (line.trim()) params.set(line.trim(), "");
          });
          setOutput(params.toString());
        }
      } else {
        try { setOutput(decodeURIComponent(input.trim())); }
        catch { setOutput(decodeURI(input.trim())); }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  }, [input, mode, variant]);

  useEffect(() => { convert(); }, [convert]);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <ToolPage
      icon={Link2}
      title="URL Encoder / Decoder"
      description="Encode or decode URLs, query parameters, and URI components."
      pageTitle="URL Encoder / Decoder — Free, Offline | Anatini.dev"
      metaDescription="Encode and decode URLs, query strings, and URI components instantly in your browser. Supports encodeURIComponent, encodeURI, and URLSearchParams. Free, offline."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <ToggleButton
              options={[{ label: "Encode", value: "encode" }, { label: "Decode", value: "decode" }]}
              value={mode}
              onChange={(v) => { setMode(v as Mode); setInput(""); setOutput(""); setError(null); }}
            />
            {mode === "encode" && (
              <ToggleButton
                options={[
                  { label: "Component", value: "component" },
                  { label: "Full URI", value: "full" },
                  { label: "Params", value: "params" },
                ]}
                value={variant}
                onChange={(v) => setVariant(v as Variant)}
              />
            )}
            <Button variant="outline" size="sm" onClick={() => setInput(mode === "encode" ? sampleText : sampleUrl)}>
              Load Sample
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mode === "encode" ? (variant === "params" ? "Key=Value Pairs (one per line)" : "Plain Text") : "Encoded Input"}
              </label>
              <button onClick={() => { setInput(""); setOutput(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === "encode" ? (variant === "params" ? "key=value\nname=John Doe" : "Type or paste text…") : "Paste encoded URL…"}
              className="w-full h-[350px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </label>
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here…"
              className="w-full h-[350px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none"
              spellCheck={false}
            />
            {output && (
              <div className="text-xs text-muted-foreground px-1">
                {output.length.toLocaleString()} chars · {new Blob([output]).size.toLocaleString()} bytes
              </div>
            )}
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
