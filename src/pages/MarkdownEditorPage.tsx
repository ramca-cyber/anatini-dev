import { useState, useCallback, useEffect, useRef } from "react";
import { FileText, Copy, Download, Eye, Edit } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { toast } from "@/hooks/use-toast";
import { marked } from "marked";

type ViewMode = "split" | "edit" | "preview";

const SAMPLE = `# Hello World

This is a **Markdown** editor with _live preview_.

## Features

- Real-time rendering
- GitHub-flavored Markdown
- Code highlighting
- Tables support

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Links | ✅ |
| Images | ✅ |
| Tables | ✅ |

## Links

Visit [Anatini.dev](https://anatini.dev) for more tools.

> "The best way to predict the future is to invent it." — Alan Kay
`;

export default function MarkdownEditorPage() {
  const [input, setInput] = useState("");
  const [html, setHtml] = useState("");
  const [view, setView] = useState<ViewMode>("split");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const render = useCallback(async (md: string) => {
    setError(null);
    if (!md.trim()) { setHtml(""); return; }
    try {
      const result = await marked.parse(md, { gfm: true, breaks: true });
      setHtml(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Render failed");
    }
  }, []);

  useEffect(() => { render(input); }, [input, render]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
  }

  return (
    <ToolPage icon={FileText} title="Markdown Editor" description="Write and preview Markdown with live rendering." metaDescription={getToolMetaDescription("markdown-editor")} seoContent={getToolSeo("markdown-editor")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <ToggleButton
              options={[
                { label: "Split", value: "split" },
                { label: "Edit", value: "edit" },
                { label: "Preview", value: "preview" },
              ]}
              value={view}
              onChange={(v) => setView(v as ViewMode)}
            />
            <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>Load Sample</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Open .md</Button>
            <input ref={fileRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(input); toast({ title: "Markdown copied" }); }} disabled={!input}>
              <Copy className="h-3 w-3 mr-1" /> Copy MD
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(html); toast({ title: "HTML copied" }); }} disabled={!html}>
              <Copy className="h-3 w-3 mr-1" /> Copy HTML
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const blob = new Blob([input], { type: "text/markdown" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "document.md";
              a.click();
            }} disabled={!input}>
              <Download className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 ${view === "split" ? "lg:grid-cols-2" : ""}`}>
          {(view === "split" || view === "edit") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Edit className="h-3 w-3" /> Markdown
                </label>
                <span className="text-xs text-muted-foreground">
                  {input.length} chars · {input.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type Markdown here…"
                className="w-full h-[500px] border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                spellCheck={false}
              />
            </div>
          )}
          {(view === "split" || view === "preview") && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" /> Preview
              </label>
              <div
                className="w-full h-[500px] border border-border bg-background px-4 py-3 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: html || '<p class="text-muted-foreground">Preview will appear here…</p>' }}
              />
            </div>
          )}
        </div>

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
