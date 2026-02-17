import { useState, useMemo } from "react";
import { GitBranch, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface Template { label: string; patterns: string[] }

const TEMPLATES: Template[] = [
  { label: "Node.js", patterns: ["node_modules/", "dist/", "build/", ".env", ".env.local", "*.log", "npm-debug.log*", "coverage/", ".nyc_output/"] },
  { label: "Python", patterns: ["__pycache__/", "*.py[cod]", "*.egg-info/", "dist/", "build/", ".venv/", "venv/", ".env", "*.egg", ".pytest_cache/"] },
  { label: "React/Vite", patterns: ["node_modules/", "dist/", ".env", ".env.local", "*.log", ".DS_Store", "coverage/", ".vite/"] },
  { label: "Go", patterns: ["bin/", "*.exe", "*.dll", "*.so", "*.dylib", "vendor/", ".env"] },
  { label: "Rust", patterns: ["target/", "Cargo.lock", "*.pdb"] },
  { label: "Java", patterns: ["*.class", "*.jar", "*.war", "target/", ".gradle/", "build/", ".idea/", "*.iml"] },
  { label: "macOS", patterns: [".DS_Store", ".AppleDouble", ".LSOverride", "._*", ".Spotlight-V100", ".Trashes"] },
  { label: "Windows", patterns: ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/", "*.lnk"] },
  { label: "Linux", patterns: ["*~", ".nfs*", ".fuse_hidden*"] },
  { label: "IDEs", patterns: [".idea/", ".vscode/", "*.swp", "*.swo", "*~", ".project", ".classpath", ".settings/", "*.sublime-*"] },
  { label: "Docker", patterns: [".dockerignore", "docker-compose.override.yml"] },
  { label: "Terraform", patterns: [".terraform/", "*.tfstate", "*.tfstate.*", "crash.log", "*.tfvars"] },
];

export default function GitignoreGeneratorPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Node.js", "macOS"]));
  const [custom, setCustom] = useState("");

  const toggle = (label: string) => setSelected(prev => {
    const n = new Set(prev);
    n.has(label) ? n.delete(label) : n.add(label);
    return n;
  });

  const output = useMemo(() => {
    const sections: string[] = [];
    TEMPLATES.filter(t => selected.has(t.label)).forEach(t => {
      sections.push(`# ${t.label}`);
      t.patterns.forEach(p => sections.push(p));
      sections.push("");
    });
    if (custom.trim()) { sections.push("# Custom"); sections.push(custom.trim()); sections.push(""); }
    return sections.join("\n");
  }, [selected, custom]);

  const handleCopy = () => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); };
  const handleDownload = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    a.download = ".gitignore"; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <ToolPage icon={GitBranch} title=".gitignore Generator" description="Generate .gitignore files from popular templates."
      metaDescription={getToolMetaDescription("gitignore-generator")} seoContent={getToolSeo("gitignore-generator")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="border border-border bg-muted/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Templates</h3>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => toggle(t.label)}
                  className={`px-3 py-1.5 text-sm border-2 transition-colors ${selected.has(t.label) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Patterns</label>
            <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="One pattern per line…" rows={5}
              className="w-full border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">.gitignore</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}><Download className="h-3 w-3 mr-1" /> Download</Button>
            </div>
          </div>
          <textarea value={output} readOnly className="w-full h-[500px] border border-border bg-muted/30 px-3 py-2 text-xs font-mono resize-none" />
        </div>
      </div>
    </ToolPage>
  );
}
