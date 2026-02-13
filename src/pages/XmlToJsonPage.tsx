import { useState, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ArrowRight, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

function xmlToJson(xml: string, attrPrefix: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(parseError.textContent ?? "Invalid XML");

  function nodeToObj(node: Element): any {
    const obj: Record<string, any> = {};

    // Attributes
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj[`${attrPrefix}${attr.name}`] = attr.value;
    }

    // Child elements
    const children = Array.from(node.childNodes);
    const elementChildren = children.filter((c): c is Element => c.nodeType === 1);
    const textContent = children
      .filter((c) => c.nodeType === 3 || c.nodeType === 4)
      .map((c) => c.textContent ?? "")
      .join("")
      .trim();

    if (elementChildren.length === 0) {
      // Leaf node
      if (Object.keys(obj).length === 0) return textContent || null;
      if (textContent) obj["#text"] = textContent;
      return obj;
    }

    // Group children by tag name
    const groups: Record<string, any[]> = {};
    for (const child of elementChildren) {
      const tag = child.tagName;
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(nodeToObj(child));
    }

    for (const [tag, items] of Object.entries(groups)) {
      obj[tag] = items.length === 1 ? items[0] : items;
    }

    if (textContent) obj["#text"] = textContent;
    return obj;
  }

  const root = doc.documentElement;
  return { [root.tagName]: nodeToObj(root) };
}

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Thinking, Fast and Slow</title>
    <author>Daniel Kahneman</author>
    <year>2011</year>
    <price>14.99</price>
  </book>
</bookstore>`;

export default function XmlToJsonPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);
  const [attrPrefix, setAttrPrefix] = useState("@");

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const result = xmlToJson(input, attrPrefix);
      setOutput(JSON.stringify(result, null, indent));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  }, [input, indent, attrPrefix]);

  useEffect(() => { convert(); }, [convert]);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "converted.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage icon={ArrowRight} title="XML → JSON Converter" description="Convert XML documents to JSON format using the browser's built-in parser." pageTitle="XML → JSON Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("xml-to-json")} seoContent={getToolSeo("xml-to-json")}>
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
              <label className="text-xs text-muted-foreground font-bold">Attributes</label>
              <select value={attrPrefix} onChange={e => setAttrPrefix(e.target.value)} className="border border-border bg-background px-2 py-1 text-xs">
                <option value="@">@prefix</option>
                <option value="">Flatten (no prefix)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(sampleXml)}>
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
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">XML Input</label>
              <button onClick={() => setInput("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste XML here…"
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Output</label>
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
        <CrossToolLinks format="xml" excludeRoute="/xml-to-json" />
      </div>
    </ToolPage>
  );
}
