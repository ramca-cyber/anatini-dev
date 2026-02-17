import { useState, useCallback, useEffect } from "react";
import { FileCode2, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function camelToTitle(s: string) { return capitalize(s.replace(/([A-Z])/g, " $1").trim().split(" ").map(capitalize).join("")); }

function jsonToTs(obj: unknown, name: string, style: "interface" | "type"): string {
  const lines: string[] = [];
  const seen = new Map<string, string>();

  function inferType(val: unknown, key: string, depth: number): string {
    if (val === null) return "null";
    if (Array.isArray(val)) {
      if (val.length === 0) return "unknown[]";
      const types = new Set(val.map(v => inferType(v, key, depth)));
      const inner = types.size === 1 ? [...types][0] : `(${[...types].join(" | ")})`;
      return `${inner}[]`;
    }
    if (typeof val === "object") {
      const typeName = camelToTitle(key);
      if (!seen.has(typeName)) {
        seen.set(typeName, ""); // prevent infinite recursion
        generateInterface(val as Record<string, unknown>, typeName, depth);
      }
      return typeName;
    }
    return typeof val;
  }

  function generateInterface(obj: Record<string, unknown>, typeName: string, depth: number) {
    const entries = Object.entries(obj);
    if (style === "interface") {
      lines.push(`export interface ${typeName} {`);
      entries.forEach(([k, v]) => {
        const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
        lines.push(`  ${safe}: ${inferType(v, k, depth + 1)};`);
      });
      lines.push("}");
    } else {
      lines.push(`export type ${typeName} = {`);
      entries.forEach(([k, v]) => {
        const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
        lines.push(`  ${safe}: ${inferType(v, k, depth + 1)};`);
      });
      lines.push("};");
    }
    lines.push("");
  }

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
      // Merge all array items to get the most complete type
      const merged: Record<string, unknown> = {};
      obj.forEach(item => { if (typeof item === "object" && item !== null) Object.assign(merged, item); });
      generateInterface(merged, name, 0);
    } else {
      const inner = obj.length > 0 ? typeof obj[0] : "unknown";
      lines.push(`export type ${name} = ${inner}[];`);
    }
  } else if (typeof obj === "object" && obj !== null) {
    generateInterface(obj as Record<string, unknown>, name, 0);
  } else {
    lines.push(`export type ${name} = ${typeof obj};`);
  }

  // Move the root type to the end (sub-types first)
  return lines.join("\n");
}

const sampleJson = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zipCode": "12345"
  },
  "tags": ["admin", "user"],
  "scores": [95, 87, 92]
}`;

export default function JsonToTypescriptPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [style, setStyle] = useState<"interface" | "type">("interface");
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(jsonToTs(parsed, rootName || "Root", style));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  }, [input, rootName, style]);

  useEffect(() => { convert(); }, [convert]);

  return (
    <ToolPage icon={FileCode2} title="JSON to TypeScript" description="Generate TypeScript interfaces or type aliases from JSON."
      metaDescription={getToolMetaDescription("json-to-typescript")} seoContent={getToolSeo("json-to-typescript")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 border border-border bg-muted/30 px-4 py-3">
          <ToggleButton options={[{ label: "Interface", value: "interface" }, { label: "Type", value: "type" }]} value={style} onChange={v => setStyle(v as "interface" | "type")} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Root name:</label>
            <input value={rootName} onChange={e => setRootName(e.target.value)} className="w-32 border border-border bg-background px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setInput(sampleJson)}>Load Sample</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Input</label>
              <button onClick={() => { setInput(""); setOutput(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button></div>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste JSON…" className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">TypeScript Output</label>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); }} disabled={!output}><Copy className="h-3 w-3 mr-1" /> Copy</Button></div>
            <textarea value={output} readOnly placeholder="TypeScript will appear…" className="w-full h-[400px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" spellCheck={false} />
          </div>
        </div>
        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
