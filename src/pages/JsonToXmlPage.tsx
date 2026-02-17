import { useState, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ArrowRight, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

function jsonToXml(obj: any, rootName: string, arrayItemName: string, indentStr: string): string {
  function escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function convert(value: any, tagName: string, depth: number): string {
    const pad = indentStr.repeat(depth);
    if (value === null || value === undefined) {
      return `${pad}<${tagName}/>\n`;
    }
    if (Array.isArray(value)) {
      return value.map((item) => convert(item, arrayItemName, depth)).join("");
    }
    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length === 0) return `${pad}<${tagName}/>\n`;
      const inner = entries.map(([k, v]) => convert(v, k, depth + 1)).join("");
      return `${pad}<${tagName}>\n${inner}${pad}</${tagName}>\n`;
    }
    return `${pad}<${tagName}>${escape(String(value))}</${tagName}>\n`;
  }

  const keys = Object.keys(obj);
  if (keys.length === 1 && typeof obj[keys[0]] === "object" && !Array.isArray(obj[keys[0]])) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n` + convert(obj[keys[0]], keys[0], 0);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + convert(obj, rootName, 0);
}

const sampleJson = `{
  "bookstore": {
    "book": [
      {
        "category": "fiction",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "year": 1925,
        "price": 10.99
      },
      {
        "category": "non-fiction",
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "year": 2011,
        "price": 14.99
      }
    ]
  }
}`;

export default function JsonToXmlPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);
  const [rootName, setRootName] = useState("root");
  const [arrayItemName, setArrayItemName] = useState("item");

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const parsed = JSON.parse(input);
      const indentStr = " ".repeat(indent);
      setOutput(jsonToXml(parsed, rootName, arrayItemName, indentStr));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  }, [input, indent, rootName, arrayItemName]);

  useEffect(() => { convert(); }, [convert]);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "converted.xml"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage icon={ArrowRight} title="JSON → XML Converter" description="Convert JSON documents to XML format." pageTitle="JSON → XML Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("json-to-xml")} seoContent={getToolSeo("json-to-xml")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Indent</label>
              <select value={indent} onChange={e => setIndent(Number(e.target.value))} className="border border-border bg-background px-2 py-1 text-xs">
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Root</label>
              <input value={rootName} onChange={e => setRootName(e.target.value || "root")} className="border border-border bg-background px-2 py-1 text-xs w-20" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Array item</label>
              <input value={arrayItemName} onChange={e => setArrayItemName(e.target.value || "item")} className="border border-border bg-background px-2 py-1 text-xs w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(sampleJson)}>
              Load Sample
            </Button>
            <Button onClick={convert} disabled={!input.trim()}>
              Convert
            </Button>
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
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">XML Output</label>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleCopy} disabled={!output}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="default" size="sm" onClick={handleDownload} disabled={!output}>
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
        <CrossToolLinks format="xml" excludeRoute="/json-to-xml" />
      </div>
    </ToolPage>
  );
}
