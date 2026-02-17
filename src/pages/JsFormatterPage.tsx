import { useState, useCallback, useEffect } from "react";
import { Code, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { toast } from "@/hooks/use-toast";

type Mode = "format" | "minify";

function formatJS(code: string, indentStr: string): string {
  // Simple brace/bracket-aware formatter
  let result = "";
  let depth = 0;
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1] || "";

    // Handle line comments
    if (!inString && !inBlockComment && ch === "/" && next === "/") {
      inLineComment = true;
      result += "//";
      i += 2;
      continue;
    }
    if (inLineComment) {
      result += ch;
      if (ch === "\n") {
        inLineComment = false;
        result += indentStr.repeat(depth);
      }
      i++;
      continue;
    }

    // Handle block comments
    if (!inString && !inLineComment && ch === "/" && next === "*") {
      inBlockComment = true;
      result += "/*";
      i += 2;
      continue;
    }
    if (inBlockComment) {
      result += ch;
      if (ch === "*" && next === "/") {
        result += "/";
        inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Handle strings
    if (inString) {
      result += ch;
      if (ch === inString && code[i - 1] !== "\\") inString = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      result += ch;
      i++;
      continue;
    }

    if (ch === "{" || ch === "[" || ch === "(") {
      result += ch + "\n";
      depth++;
      result += indentStr.repeat(depth);
      i++;
      while (i < code.length && /\s/.test(code[i])) i++;
      continue;
    }

    if (ch === "}" || ch === "]" || ch === ")") {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd() + "\n" + indentStr.repeat(depth) + ch;
      i++;
      continue;
    }

    if (ch === ";") {
      result += ";\n" + indentStr.repeat(depth);
      i++;
      while (i < code.length && /\s/.test(code[i])) i++;
      continue;
    }

    if (ch === ",") {
      result += ",\n" + indentStr.repeat(depth);
      i++;
      while (i < code.length && /\s/.test(code[i])) i++;
      continue;
    }

    if (/\s/.test(ch)) {
      if (result.length > 0 && !/[\s({[\n]/.test(result[result.length - 1])) {
        result += " ";
      }
      i++;
      while (i < code.length && /\s/.test(code[i])) i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function minifyJS(code: string): string {
  // Remove comments
  let result = code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  // Collapse whitespace (naive but functional for most JS)
  result = result.replace(/\s+/g, " ").trim();
  // Remove spaces around operators (simplified)
  result = result.replace(/\s*([{}();,=:+\-*/<>!&|?])\s*/g, "$1");
  return result;
}

export default function JsFormatterPage() {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState("  ");

  const process = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      setOutput(mode === "format" ? formatJS(input, indent) : minifyJS(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    }
  }, [input, mode, indent]);

  useEffect(() => { process(); }, [process]);

  const sample = `function greet(name){const msg="Hello, "+name+"!";console.log(msg);return{greeting:msg,timestamp:Date.now()}}const users=["Alice","Bob","Charlie"];users.forEach(function(user){greet(user)});`;

  return (
    <ToolPage icon={Code} title="JavaScript Formatter" description="Format or minify JavaScript code." metaDescription={getToolMetaDescription("js-formatter")} seoContent={getToolSeo("js-formatter")}>
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
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JavaScript Input</label>
              <button onClick={() => { setInput(""); setOutput(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste JavaScript here…"
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
                  const blob = new Blob([output], { type: "text/javascript" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = mode === "minify" ? "script.min.js" : "script.js";
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
