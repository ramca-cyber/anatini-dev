import { useState, useCallback, useEffect } from "react";
import { Code2, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

type Mode = "encode" | "decode";

function encodeHtml(str: string): string {
  return str.replace(/[&<>"'`]/g, c => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
    return map[c] || c;
  });
}

function encodeAll(str: string): string {
  return [...str].map(c => {
    const code = c.codePointAt(0)!;
    if (code > 127 || /[&<>"'`]/.test(c)) return `&#${code};`;
    return c;
  }).join("");
}

function decodeHtml(str: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

const COMMON_ENTITIES = [
  ["&amp;", "&", "Ampersand"], ["&lt;", "<", "Less than"], ["&gt;", ">", "Greater than"],
  ["&quot;", '"', "Double quote"], ["&#39;", "'", "Apostrophe"], ["&nbsp;", " ", "Non-breaking space"],
  ["&copy;", "©", "Copyright"], ["&reg;", "®", "Registered"], ["&trade;", "™", "Trademark"],
  ["&mdash;", "—", "Em dash"], ["&ndash;", "–", "En dash"], ["&laquo;", "«", "Left guillemet"],
  ["&raquo;", "»", "Right guillemet"], ["&bull;", "•", "Bullet"], ["&hellip;", "…", "Ellipsis"],
  ["&euro;", "€", "Euro"], ["&pound;", "£", "Pound"], ["&yen;", "¥", "Yen"],
];

export default function HtmlEntityPage() {
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeMode, setEncodeMode] = useState<"special" | "all">("special");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const convert = useCallback(() => {
    if (!input) { setOutput(""); return; }
    if (mode === "encode") {
      setOutput(encodeMode === "special" ? encodeHtml(input) : encodeAll(input));
    } else {
      setOutput(decodeHtml(input));
    }
  }, [input, mode, encodeMode]);

  useEffect(() => { convert(); }, [convert]);

  return (
    <ToolPage icon={Code2} title="HTML Entity Encoder" description="Encode and decode HTML entities, special characters, and Unicode."
      metaDescription={getToolMetaDescription("html-entity-encoder")} seoContent={getToolSeo("html-entity-encoder")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 border border-border bg-muted/30 px-4 py-3">
          <ToggleButton options={[{ label: "Encode", value: "encode" }, { label: "Decode", value: "decode" }]} value={mode}
            onChange={v => { setMode(v as Mode); setInput(""); setOutput(""); }} />
          {mode === "encode" && (
            <ToggleButton options={[{ label: "Special Only", value: "special" }, { label: "All Non-ASCII", value: "all" }]} value={encodeMode}
              onChange={v => setEncodeMode(v as "special" | "all")} />
          )}
          <Button variant="outline" size="sm" onClick={() => setInput(mode === "encode" ? '<h1>Hello & "World"</h1>' : '&lt;h1&gt;Hello &amp; &quot;World&quot;&lt;/h1&gt;')}>
            Load Sample
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{mode === "encode" ? "Plain Text" : "Encoded Input"}</label>
              <button onClick={() => { setInput(""); setOutput(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button></div>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type or paste text…"
              className="w-full h-[300px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{mode === "encode" ? "Encoded Output" : "Decoded Output"}</label>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); }} disabled={!output}><Copy className="h-3 w-3 mr-1" /> Copy</Button></div>
            <textarea value={output} readOnly className="w-full h-[300px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" spellCheck={false} />
          </div>
        </div>
        <div className="border border-border bg-muted/30 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Common Entities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            {COMMON_ENTITIES.map(([entity, char, name]) => (
              <button key={entity} onClick={() => { navigator.clipboard.writeText(entity); toast({ title: `Copied ${entity}` }); }}
                className="border border-border bg-background px-2 py-1.5 hover:bg-muted/50 text-left" title={name}>
                <span className="text-primary">{char}</span> <span className="text-muted-foreground">{entity}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
