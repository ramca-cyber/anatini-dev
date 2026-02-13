import { useState, useCallback } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { RefreshCw, Copy, Download, CheckCircle2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import * as yaml from "js-yaml";

type Direction = "yaml-to-json" | "json-to-yaml";

export default function YamlJsonPage() {
  const [direction, setDirection] = useState<Direction>("yaml-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      if (direction === "yaml-to-json") {
        const parsed = yaml.load(input);
        setOutput(JSON.stringify(parsed, null, indent));
      } else {
        const parsed = JSON.parse(input);
        setOutput(yaml.dump(parsed, { indent, lineWidth: -1, noRefs: true }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  }, [input, direction, indent]);

  function handleSwap() {
    setDirection(d => d === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json");
    setInput(output);
    setOutput("");
    setError(null);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    const ext = direction === "yaml-to-json" ? "json" : "yaml";
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `converted.${ext}`; a.click();
    URL.revokeObjectURL(url);
  }

  const inputLabel = direction === "yaml-to-json" ? "YAML" : "JSON";
  const outputLabel = direction === "yaml-to-json" ? "JSON" : "YAML";

  const sampleYaml = `# Sample YAML
server:
  host: localhost
  port: 8080
  debug: true
database:
  driver: postgres
  connection:
    host: db.example.com
    port: 5432
    name: myapp
  pool_size: 10
features:
  - authentication
  - logging
  - caching`;

  const sampleJson = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "debug": true
  },
  "database": {
    "driver": "postgres",
    "connection": {
      "host": "db.example.com",
      "port": 5432,
      "name": "myapp"
    },
    "pool_size": 10
  },
  "features": ["authentication", "logging", "caching"]
}`;

  return (
    <ToolPage icon={RefreshCw} title="YAML ↔ JSON Converter" description="Bidirectional YAML to JSON and JSON to YAML converter." pageTitle="YAML ↔ JSON Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("yaml-json")} seoContent={getToolSeo("yaml-json")}>
      <div className="space-y-4">
        {/* Direction + options */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <ToggleButton
              options={[{ label: "YAML → JSON", value: "yaml-to-json" }, { label: "JSON → YAML", value: "json-to-yaml" }]}
              value={direction}
              onChange={setDirection}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Indent</label>
              <select value={indent} onChange={e => setIndent(Number(e.target.value))} className="border border-border bg-background px-2 py-1 text-xs">
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(direction === "yaml-to-json" ? sampleYaml : sampleJson)}>
              Load Sample
            </Button>
            <Button onClick={convert} disabled={!input.trim()}>
              Convert
            </Button>
          </div>
        </div>

        {/* Editor panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{inputLabel} Input</label>
              <button onClick={() => setInput("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Paste ${inputLabel} here…`}
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{outputLabel} Output</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!output} title="Swap input/output">
                  <RefreshCw className="h-3 w-3 mr-1" /> Swap
                </Button>
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
