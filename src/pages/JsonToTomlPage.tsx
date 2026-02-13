import { useState, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ArrowRight, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { stringify as tomlStringify } from "smol-toml";

export default function JsonToTomlPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("TOML requires a top-level object (table). Arrays and primitives cannot be represented as TOML root.");
        setOutput("");
        return;
      }
      setOutput(tomlStringify(parsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  }, [input]);

  useEffect(() => { convert(); }, [convert]);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/toml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "converted.toml"; a.click();
    URL.revokeObjectURL(url);
  }

  const sampleJson = `{
  "title": "My Application",
  "server": {
    "host": "localhost",
    "port": 8080,
    "debug": true
  },
  "database": {
    "driver": "postgres",
    "host": "db.example.com",
    "port": 5432,
    "name": "myapp",
    "pool_size": 10
  },
  "features": {
    "enabled": ["authentication", "logging", "caching"]
  },
  "users": [
    { "name": "Alice", "role": "admin" },
    { "name": "Bob", "role": "editor" }
  ]
}`;

  return (
    <ToolPage icon={ArrowRight} title="JSON → TOML Converter" description="Convert JSON documents to TOML configuration format." pageTitle="JSON → TOML Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("json-to-toml")} seoContent={getToolSeo("json-to-toml")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(sampleJson)}>Load Sample</Button>
            <Button onClick={convert} disabled={!input.trim()}>Convert</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Input</label>
              <button onClick={() => setInput("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste JSON here…"
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">TOML Output</label>
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
        <CrossToolLinks format="toml" excludeRoute="/json-to-toml" />
      </div>
    </ToolPage>
  );
}
