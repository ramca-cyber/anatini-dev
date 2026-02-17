import { useState, useCallback, useEffect } from "react";
import { Code, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { toast } from "@/hooks/use-toast";

type Mode = "format" | "minify";

function formatCSS(css: string, indent: string): string {
  let result = "";
  let depth = 0;
  let inString: string | null = null;
  let i = 0;

  // Remove comments first for simpler parsing
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  css = css.trim();

  while (i < css.length) {
    const ch = css[i];

    if (inString) {
      result += ch;
      if (ch === inString && css[i - 1] !== "\\") inString = null;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      result += ch;
      i++;
      continue;
    }

    if (ch === "{") {
      result = result.trimEnd() + " {\n";
      depth++;
      result += indent.repeat(depth);
      i++;
      // skip whitespace after {
      while (i < css.length && /\s/.test(css[i])) i++;
      continue;
    }

    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd() + "\n" + indent.repeat(depth) + "}\n";
      if (depth === 0) result += "\n";
      i++;
      while (i < css.length && /\s/.test(css[i])) i++;
      if (i < css.length && css[i] !== "}") {
        result += indent.repeat(depth);
      }
      continue;
    }

    if (ch === ";") {
      result += ";\n" + indent.repeat(depth);
      i++;
      while (i < css.length && /\s/.test(css[i])) i++;
      continue;
    }

    if (ch === ":" && depth > 0) {
      result += ": ";
      i++;
      while (i < css.length && /\s/.test(css[i])) i++;
      continue;
    }

    if (/\s/.test(ch)) {
      if (result.length > 0 && !/[\s{:;,]/.test(result[result.length - 1])) {
        result += " ";
      }
      i++;
      while (i < css.length && /\s/.test(css[i])) i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export default function CssFormatterPage() {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState("  ");

  const process = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      setOutput(mode === "format" ? formatCSS(input, indent) : minifyCSS(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    }
  }, [input, mode, indent]);

  useEffect(() => { process(); }, [process]);

  const sample = `body {
  margin: 0; padding: 0; font-family: sans-serif; background-color: #f5f5f5;
}
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #ddd; }
.header h1 { font-size: 24px; color: #333; }
@media (max-width: 768px) { .container { padding: 10px; } .header { flex-direction: column; } }`;

  return (
    <ToolPage icon={Code} title="CSS Formatter" description="Format or minify CSS with proper indentation." metaDescription={getToolMetaDescription("css-formatter")} seoContent={getToolSeo("css-formatter")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <ToggleButton
              options={[{ label: "Format", value: "format" }, { label: "Minify", value: "minify" }]}
              value={mode}
              onChange={(v) => setMode(v as Mode)}
            />
            {mode === "format" && (
              <ToggleButton
                options={[{ label: "2 spaces", value: "  " }, { label: "4 spaces", value: "    " }, { label: "Tab", value: "\t" }]}
                value={indent}
                onChange={setIndent}
              />
            )}
            <Button variant="outline" size="sm" onClick={() => setInput(sample)}>Load Sample</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CSS Input</label>
              <button onClick={() => { setInput(""); setOutput(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste CSS here…"
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); }} disabled={!output}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  const blob = new Blob([output], { type: "text/css" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = mode === "minify" ? "style.min.css" : "style.css";
                  a.click();
                }} disabled={!output}>
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
