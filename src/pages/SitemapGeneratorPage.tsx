import { useState, useMemo } from "react";
import { Map, Copy, Download, Plus, Trash2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface SitemapEntry {
  id: string;
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

const today = new Date().toISOString().split("T")[0];

function makeEntry(loc = ""): SitemapEntry {
  return { id: crypto.randomUUID(), loc, lastmod: today, changefreq: "monthly", priority: "0.8" };
}

export default function SitemapGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState("https://example.com");
  const [entries, setEntries] = useState<SitemapEntry[]>([
    makeEntry("/"),
    makeEntry("/about"),
    makeEntry("/blog"),
  ]);

  const addEntry = () => setEntries(p => [...p, makeEntry("")]);
  const removeEntry = (id: string) => setEntries(p => p.filter(e => e.id !== id));
  const updateEntry = (id: string, field: keyof SitemapEntry, value: string) =>
    setEntries(p => p.map(e => e.id === id ? { ...e, [field]: value } : e));

  const output = useMemo(() => {
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    entries.forEach(e => {
      if (!e.loc.trim()) return;
      const url = e.loc.startsWith("http") ? e.loc : `${baseUrl.replace(/\/$/, "")}${e.loc.startsWith("/") ? "" : "/"}${e.loc}`;
      lines.push("  <url>");
      lines.push(`    <loc>${url}</loc>`);
      if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
      lines.push("  </url>");
    });
    lines.push("</urlset>");
    return lines.join("\n");
  }, [entries, baseUrl]);

  const handleCopy = () => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); };
  const handleDownload = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([output], { type: "application/xml" }));
    a.download = "sitemap.xml"; a.click(); URL.revokeObjectURL(a.href);
  };

  const fieldClass = "border border-border bg-background px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <ToolPage icon={Map} title="Sitemap Generator" description="Build XML sitemaps with URLs, priorities, and change frequencies."
      metaDescription={getToolMetaDescription("sitemap-generator")} seoContent={getToolSeo("sitemap-generator")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="border border-border bg-muted/30 p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Base URL</label>
            <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={fieldClass + " w-full"} placeholder="https://example.com" />
          </div>
          <div className="space-y-3">
            {entries.map(e => (
              <div key={e.id} className="border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={e.loc} onChange={ev => updateEntry(e.id, "loc", ev.target.value)} placeholder="/page" className={fieldClass + " flex-1"} />
                  <button onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="date" value={e.lastmod} onChange={ev => updateEntry(e.id, "lastmod", ev.target.value)} className={fieldClass} />
                  <select value={e.changefreq} onChange={ev => updateEntry(e.id, "changefreq", ev.target.value)} className={fieldClass}>
                    <option>always</option><option>hourly</option><option>daily</option><option>weekly</option><option>monthly</option><option>yearly</option><option>never</option>
                  </select>
                  <select value={e.priority} onChange={ev => updateEntry(e.id, "priority", ev.target.value)} className={fieldClass}>
                    {["1.0","0.9","0.8","0.7","0.6","0.5","0.4","0.3","0.2","0.1","0.0"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addEntry}><Plus className="h-3.5 w-3.5 mr-1" /> Add URL</Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">sitemap.xml</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}><Download className="h-3 w-3 mr-1" /> Download</Button>
            </div>
          </div>
          <textarea value={output} readOnly className="w-full h-[500px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" />
          <div className="text-xs text-muted-foreground">{entries.filter(e => e.loc.trim()).length} URLs · {new Blob([output]).size.toLocaleString()} bytes</div>
        </div>
      </div>
    </ToolPage>
  );
}
