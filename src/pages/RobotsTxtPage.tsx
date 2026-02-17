import { useState, useMemo } from "react";
import { Bot, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface Rule {
  id: string;
  userAgent: string;
  allow: string;
  disallow: string;
}

const presets: Record<string, () => Rule[]> = {
  "Allow All": () => [{ id: crypto.randomUUID(), userAgent: "*", allow: "/", disallow: "" }],
  "Block All": () => [{ id: crypto.randomUUID(), userAgent: "*", allow: "", disallow: "/" }],
  "Block AI Crawlers": () => [
    { id: crypto.randomUUID(), userAgent: "*", allow: "/", disallow: "" },
    { id: crypto.randomUUID(), userAgent: "GPTBot", allow: "", disallow: "/" },
    { id: crypto.randomUUID(), userAgent: "ChatGPT-User", allow: "", disallow: "/" },
    { id: crypto.randomUUID(), userAgent: "CCBot", allow: "", disallow: "/" },
    { id: crypto.randomUUID(), userAgent: "anthropic-ai", allow: "", disallow: "/" },
    { id: crypto.randomUUID(), userAgent: "Google-Extended", allow: "", disallow: "/" },
  ],
  "Standard": () => [
    { id: crypto.randomUUID(), userAgent: "*", allow: "/", disallow: "/admin\n/api\n/private" },
  ],
};

export default function RobotsTxtPage() {
  const [rules, setRules] = useState<Rule[]>(presets["Allow All"]());
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");

  const output = useMemo(() => {
    const lines: string[] = [];
    rules.forEach((r, i) => {
      if (i > 0) lines.push("");
      lines.push(`User-agent: ${r.userAgent}`);
      if (r.disallow) r.disallow.split("\n").filter(Boolean).forEach(d => lines.push(`Disallow: ${d.trim()}`));
      if (r.allow) r.allow.split("\n").filter(Boolean).forEach(a => lines.push(`Allow: ${a.trim()}`));
      if (crawlDelay && r.userAgent === "*") lines.push(`Crawl-delay: ${crawlDelay}`);
    });
    if (sitemapUrl) { lines.push(""); lines.push(`Sitemap: ${sitemapUrl}`); }
    return lines.join("\n");
  }, [rules, sitemapUrl, crawlDelay]);

  const addRule = () => setRules(p => [...p, { id: crypto.randomUUID(), userAgent: "*", allow: "", disallow: "" }]);
  const removeRule = (id: string) => setRules(p => p.filter(r => r.id !== id));
  const updateRule = (id: string, field: keyof Rule, value: string) =>
    setRules(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleCopy = () => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); };
  const handleDownload = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    a.download = "robots.txt"; a.click(); URL.revokeObjectURL(a.href);
  };

  const fieldClass = "w-full border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <ToolPage icon={Bot} title="robots.txt Generator" description="Generate robots.txt with presets for AI crawlers and search engines."
      metaDescription={getToolMetaDescription("robots-txt-generator")} seoContent={getToolSeo("robots-txt-generator")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(presets).map(p => (
              <Button key={p} variant="outline" size="sm" onClick={() => setRules(presets[p]())}>{p}</Button>
            ))}
          </div>
          {rules.map(r => (
            <div key={r.id} className="space-y-2 border border-border bg-muted/30 p-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rule</label>
                {rules.length > 1 && <button onClick={() => removeRule(r.id)} className="text-xs text-destructive hover:underline">Remove</button>}
              </div>
              <input value={r.userAgent} onChange={e => updateRule(r.id, "userAgent", e.target.value)} placeholder="User-agent" className={fieldClass} />
              <textarea value={r.disallow} onChange={e => updateRule(r.id, "disallow", e.target.value)} placeholder="Disallow paths (one per line)" rows={2} className={fieldClass + " resize-none"} />
              <textarea value={r.allow} onChange={e => updateRule(r.id, "allow", e.target.value)} placeholder="Allow paths (one per line)" rows={2} className={fieldClass + " resize-none"} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRule}>+ Add Rule</Button>
          <div className="space-y-2 border border-border bg-muted/30 p-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Extras</label>
            <input value={sitemapUrl} onChange={e => setSitemapUrl(e.target.value)} placeholder="Sitemap URL" className={fieldClass} />
            <input value={crawlDelay} onChange={e => setCrawlDelay(e.target.value)} placeholder="Crawl-delay (seconds)" className={fieldClass} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}><Download className="h-3 w-3 mr-1" /> .txt</Button>
            </div>
          </div>
          <textarea value={output} readOnly className="w-full h-[500px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" />
        </div>
      </div>
    </ToolPage>
  );
}
