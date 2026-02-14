import { useState, useCallback, useEffect } from "react";
import { highlightXml } from "@/components/shared/SyntaxHighlight";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Code, Copy, Download, CheckCircle2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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
  <book category="fiction">
    <title lang="en">One Hundred Years of Solitude</title>
    <author>Gabriel García Márquez</author>
    <year>1967</year>
    <price>12.50</price>
  </book>
</bookstore>`;

function formatXml(xml: string, indent: number): string {
  // Parse and re-serialize to validate and format
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(parseError.textContent ?? "Invalid XML");

  const pad = " ".repeat(indent);

  function serialize(node: Node, level: number): string {
    if (node.nodeType === 3) {
      // Text node
      const text = (node.textContent ?? "").trim();
      return text ? text : "";
    }
    if (node.nodeType === 7) {
      // Processing instruction
      const pi = node as ProcessingInstruction;
      return `<?${pi.target} ${pi.data}?>`;
    }
    if (node.nodeType === 8) {
      // Comment
      return `${pad.repeat(level)}<!--${node.textContent}-->`;
    }
    if (node.nodeType !== 1) return "";

    const el = node as Element;
    const tag = el.tagName;
    let attrs = "";
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      attrs += ` ${a.name}="${a.value}"`;
    }

    const children = Array.from(el.childNodes);
    const elementChildren = children.filter((c) => c.nodeType === 1);
    const textContent = children
      .filter((c) => c.nodeType === 3)
      .map((c) => (c.textContent ?? "").trim())
      .join("")
      .trim();

    const prefix = pad.repeat(level);

    if (elementChildren.length === 0) {
      if (textContent) {
        return `${prefix}<${tag}${attrs}>${textContent}</${tag}>`;
      }
      return `${prefix}<${tag}${attrs} />`;
    }

    const childLines = children
      .map((c) => serialize(c, level + 1))
      .filter(Boolean);
    return `${prefix}<${tag}${attrs}>\n${childLines.join("\n")}\n${prefix}</${tag}>`;
  }

  const parts: string[] = [];
  for (const child of Array.from(doc.childNodes)) {
    const s = serialize(child, 0);
    if (s) parts.push(s);
  }
  return parts.join("\n");
}

function minifyXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(parseError.textContent ?? "Invalid XML");
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc).replace(/>\s+</g, "><");
}

function validateXml(xml: string): { valid: boolean; error?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return { valid: false, error: parseError.textContent ?? "Invalid XML" };
  return { valid: true };
}

export default function XmlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; error?: string } | null>(null);

  const format = useCallback(() => {
    setError(null);
    setValidationStatus(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      const result = formatXml(input, indent);
      setOutput(result);
      setValidationStatus({ valid: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Format failed");
      setOutput("");
      setValidationStatus({ valid: false, error: e instanceof Error ? e.message : "Invalid XML" });
    }
  }, [input, indent]);

  useEffect(() => {
    format();
  }, [format]);

  function handleMinify() {
    setError(null);
    if (!input.trim()) return;
    try {
      const result = minifyXml(input);
      setOutput(result);
      setValidationStatus({ valid: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minify failed");
      setValidationStatus({ valid: false, error: e instanceof Error ? e.message : "Invalid XML" });
    }
  }

  function handleValidate() {
    if (!input.trim()) return;
    const result = validateXml(input);
    setValidationStatus(result);
    if (result.valid) {
      toast({ title: "✓ Valid XML" });
    }
  }

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
    a.href = url;
    a.download = "formatted.xml";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage
      icon={Code}
      title="XML Formatter"
      description="Format, minify, and validate XML documents. Pretty-print with configurable indentation."
      metaDescription={getToolMetaDescription("xml-formatter")}
      seoContent={getToolSeo("xml-formatter")}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Indent</label>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="border border-border bg-background px-2 py-1 text-xs"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
            {validationStatus && (
              <div
                className={`flex items-center gap-1 text-xs font-bold ${
                  validationStatus.valid ? "text-green-600 dark:text-green-400" : "text-destructive"
                }`}
              >
                {validationStatus.valid ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Valid XML
                  </>
                ) : (
                  <>✗ Invalid</>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(sampleXml)}>
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleValidate} disabled={!input.trim()}>
              Validate
            </Button>
            <Button variant="outline" size="sm" onClick={handleMinify} disabled={!input.trim()}>
              Minify
            </Button>
            <Button onClick={format} disabled={!input.trim()}>
              Format
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                XML Input
              </label>
              <button
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError(null);
                  setValidationStatus(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste XML here…"
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Formatted Output
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
            <pre
              className="w-full h-[400px] overflow-auto border border-border bg-muted/30 px-3 py-2 text-xs font-mono whitespace-pre-wrap"
            >
              {output ? highlightXml(output) : <span className="text-muted-foreground">Output will appear here…</span>}
            </pre>
            {output && (
              <div className="text-xs text-muted-foreground px-1">
                {output.split("\n").length} lines · {new Blob([output]).size.toLocaleString()} bytes
              </div>
            )}
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
        <CrossToolLinks format="xml" excludeRoute="/xml-formatter" />
      </div>
    </ToolPage>
  );
}
