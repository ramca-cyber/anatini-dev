import { useState, useCallback, useEffect } from "react";
import { Link, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

type Separator = "-" | "_" | ".";

function slugify(text: string, separator: Separator, lowercase: boolean, maxLen: number): string {
  let s = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip diacritics
  if (lowercase) s = s.toLowerCase();
  s = s.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/[\s_-]+/g, separator).replace(new RegExp(`^\\${separator}|\\${separator}$`, "g"), "");
  if (maxLen > 0) s = s.slice(0, maxLen).replace(new RegExp(`\\${separator}$`), "");
  return s;
}

const samples = [
  "How to Convert CSV Files to Parquet Format",
  "10 Best Practices for API Design in 2025",
  "Héllo Wörld! Thïs ís à tëst",
  "  Extra   spaces   and ---dashes---  ",
];

export default function SlugGeneratorPage() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<Separator>("-");
  const [lowercase, setLowercase] = useState(true);
  const [maxLen, setMaxLen] = useState(0);
  const [output, setOutput] = useState("");

  const convert = useCallback(() => {
    if (!input.trim()) { setOutput(""); return; }
    const lines = input.split("\n").filter(Boolean);
    setOutput(lines.map(l => slugify(l, separator, lowercase, maxLen)).join("\n"));
  }, [input, separator, lowercase, maxLen]);

  useEffect(() => { convert(); }, [convert]);

  return (
    <ToolPage icon={Link} title="Slug Generator" description="Generate URL-friendly slugs from text with customizable separators."
      metaDescription={getToolMetaDescription("slug-generator")} seoContent={getToolSeo("slug-generator")}>
      <div className="space-y-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <ToggleButton options={[{ label: "Hyphen (-)", value: "-" }, { label: "Underscore (_)", value: "_" }, { label: "Dot (.)", value: "." }]} value={separator} onChange={v => setSeparator(v as Separator)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowercase} onChange={e => setLowercase(e.target.checked)} className="accent-primary" />Lowercase</label>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Max length:</label>
            <input type="number" min={0} max={200} value={maxLen} onChange={e => setMaxLen(parseInt(e.target.value) || 0)}
              className="w-20 border border-border bg-background px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setInput(samples.join("\n"))}>Load Samples</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input (one per line)</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type or paste titles…"
              className="w-full h-[300px] border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slugs</label>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); }} disabled={!output}><Copy className="h-3 w-3 mr-1" /> Copy</Button></div>
            <textarea value={output} readOnly className="w-full h-[300px] border border-border bg-muted/30 px-3 py-2 text-sm font-mono resize-none" />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
