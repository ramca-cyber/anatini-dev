import { useState, useMemo } from "react";
import { Tags, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

export default function MetaTagPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [siteName, setSiteName] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [type, setType] = useState("website");
  const [robots, setRobots] = useState("index, follow");
  const [viewport, setViewport] = useState("width=device-width, initial-scale=1");
  const [charset, setCharset] = useState("UTF-8");
  const [themeColor, setThemeColor] = useState("#ffffff");
  const [author, setAuthor] = useState("");

  const output = useMemo(() => {
    const lines: string[] = [];
    lines.push(`<meta charset="${charset}" />`);
    lines.push(`<meta name="viewport" content="${viewport}" />`);
    if (title) lines.push(`<title>${title}</title>`);
    if (description) lines.push(`<meta name="description" content="${description}" />`);
    if (robots) lines.push(`<meta name="robots" content="${robots}" />`);
    if (author) lines.push(`<meta name="author" content="${author}" />`);
    if (themeColor) lines.push(`<meta name="theme-color" content="${themeColor}" />`);
    if (url) lines.push(`<link rel="canonical" href="${url}" />`);
    // OG
    lines.push("");
    lines.push("<!-- Open Graph -->");
    if (title) lines.push(`<meta property="og:title" content="${title}" />`);
    if (description) lines.push(`<meta property="og:description" content="${description}" />`);
    if (url) lines.push(`<meta property="og:url" content="${url}" />`);
    if (image) lines.push(`<meta property="og:image" content="${image}" />`);
    if (siteName) lines.push(`<meta property="og:site_name" content="${siteName}" />`);
    lines.push(`<meta property="og:type" content="${type}" />`);
    // Twitter
    lines.push("");
    lines.push("<!-- Twitter Card -->");
    lines.push(`<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`);
    if (title) lines.push(`<meta name="twitter:title" content="${title}" />`);
    if (description) lines.push(`<meta name="twitter:description" content="${description}" />`);
    if (image) lines.push(`<meta name="twitter:image" content="${image}" />`);
    if (twitterHandle) lines.push(`<meta name="twitter:site" content="${twitterHandle}" />`);
    return lines.join("\n");
  }, [title, description, url, image, siteName, twitterHandle, type, robots, viewport, charset, themeColor, author]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meta-tags.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const fieldClass = "w-full border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground";

  return (
    <ToolPage
      icon={Tags}
      title="Meta Tag Generator"
      description="Generate HTML meta tags for SEO, Open Graph, and Twitter Cards."
      metaDescription={getToolMetaDescription("meta-tag-generator")}
      seoContent={getToolSeo("meta-tag-generator")}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-3 border border-border bg-muted/30 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Basic</h2>
            <div><label className={labelClass}>Page Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome Page" className={fieldClass} /></div>
            <div><label className={labelClass}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description of the page..." rows={2} className={fieldClass + " resize-none"} /></div>
            <div><label className={labelClass}>Canonical URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/page" className={fieldClass} /></div>
            <div><label className={labelClass}>Author</label><input value={author} onChange={e => setAuthor(e.target.value)} placeholder="John Doe" className={fieldClass} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Robots</label><input value={robots} onChange={e => setRobots(e.target.value)} className={fieldClass} /></div>
              <div><label className={labelClass}>Theme Color</label><input value={themeColor} onChange={e => setThemeColor(e.target.value)} className={fieldClass} /></div>
            </div>
          </div>
          <div className="space-y-3 border border-border bg-muted/30 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Open Graph & Twitter</h2>
            <div><label className={labelClass}>OG Image URL</label><input value={image} onChange={e => setImage(e.target.value)} placeholder="https://example.com/og.png" className={fieldClass} /></div>
            <div><label className={labelClass}>Site Name</label><input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="My Site" className={fieldClass} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>OG Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className={fieldClass}>
                  <option value="website">website</option><option value="article">article</option><option value="product">product</option><option value="profile">profile</option>
                </select>
              </div>
              <div><label className={labelClass}>Twitter @handle</label><input value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="@username" className={fieldClass} /></div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Generated Meta Tags</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}><Download className="h-3 w-3 mr-1" /> Download</Button>
            </div>
          </div>
          <textarea value={output} readOnly className="w-full h-[500px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" spellCheck={false} />
          <div className="text-xs text-muted-foreground">{title.length}/60 title chars · {description.length}/160 description chars</div>
        </div>
      </div>
    </ToolPage>
  );
}
