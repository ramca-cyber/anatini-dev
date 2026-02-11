import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Code, Copy, Check, ChevronRight, ChevronDown } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";

const SAMPLE = `{"name":"Alice","age":30,"address":{"city":"Portland","zip":"97201"},"tags":["dev","data"],"active":true}`;

type JsonNode = { key: string; value: unknown; depth: number; path: string };

function flattenForTree(obj: unknown, prefix = "", depth = 0): JsonNode[] {
  const nodes: JsonNode[] = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      nodes.push({ key: k, value: v, depth, path });
      if (v && typeof v === "object") nodes.push(...flattenForTree(v, path, depth + 1));
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      const path = `${prefix}[${i}]`;
      nodes.push({ key: `[${i}]`, value: item, depth, path });
      if (item && typeof item === "object") nodes.push(...flattenForTree(item, path, depth + 1));
    });
  }
  return nodes;
}

function countKeys(obj: unknown): number {
  if (!obj || typeof obj !== "object") return 0;
  if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countKeys(item), 0);
  return Object.keys(obj).reduce((sum, k) => sum + 1 + countKeys((obj as any)[k]), 0);
}

function TreeNode({ node }: { node: JsonNode }) {
  const [open, setOpen] = useState(true);
  const isExpandable = node.value && typeof node.value === "object";
  const display = isExpandable
    ? Array.isArray(node.value) ? `Array(${(node.value as unknown[]).length})` : `Object`
    : JSON.stringify(node.value);

  return (
    <div style={{ paddingLeft: node.depth * 16 }} className="flex items-center gap-1 py-0.5 text-xs font-mono">
      {isExpandable ? (
        <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      ) : <span className="w-3" />}
      <span className="text-foreground font-medium">{node.key}:</span>
      <span className={isExpandable ? "text-muted-foreground" : "text-primary"}>{display}</span>
    </div>
  );
}

export default function JsonFormatterPage() {
  const { addFile } = useFileStore();
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number | string>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [view, setView] = useState<"formatted" | "tree">("formatted");
  const [copied, setCopied] = useState(false);
  const [treeNodes, setTreeNodes] = useState<JsonNode[]>([]);
  const [stats, setStats] = useState<string | null>(null);

  function sortObject(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (obj && typeof obj === "object") {
      return Object.keys(obj as Record<string, unknown>).sort().reduce((acc, key) => {
        (acc as Record<string, unknown>)[key] = sortObject((obj as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
    }
    return obj;
  }

  function computeStats(parsed: unknown, rawSize: number) {
    const keys = countKeys(parsed);
    const topLevel = Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed === "object" && parsed ? `${Object.keys(parsed).length} keys` : "scalar";
    const sizeStr = rawSize < 1024 ? `${rawSize}B` : `${(rawSize / 1024).toFixed(1)}KB`;
    setStats(`Valid JSON — ${topLevel}, ${keys} total keys, ${sizeStr}`);
  }

  function getIndentArg(): string | number {
    return indent === "\t" ? "\t" : Number(indent);
  }

  function handleFormat() {
    try {
      let parsed = JSON.parse(input);
      if (sortKeys) parsed = sortObject(parsed);
      setOutput(JSON.stringify(parsed, null, getIndentArg()));
      setTreeNodes(flattenForTree(parsed));
      setError(null);
      computeStats(parsed, new Blob([input]).size);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput(""); setTreeNodes([]); setStats(null);
    }
  }

  function handleMinify() {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setTreeNodes(flattenForTree(parsed));
      setError(null);
      computeStats(parsed, new Blob([input]).size);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  function handleValidate() {
    try {
      const parsed = JSON.parse(input);
      setError(null);
      computeStats(parsed, new Blob([input]).size);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setStats(null);
    }
  }

  function handleFileUpload(f: File) {
    const stored = addFile(f);
    setStoredFileId(stored.id);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
    };
    reader.readAsText(f);
  }

  useAutoLoadFile(handleFileUpload);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "formatted.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage icon={Code} title="JSON Formatter" seoContent={getToolSeo("json-formatter")} metaDescription={getToolMetaDescription("json-formatter")} description="Format, minify, and validate JSON with tree view and sorting.">
      <div className="space-y-4">
        {!input && (
          <div className="space-y-4">
            <ToggleButton
              options={[{ label: "Upload File", value: "file" }, { label: "From URL", value: "url" }]}
              value={inputMode}
              onChange={setInputMode}
            />
            {inputMode === "file" ? (
              <DropZone accept={[".json"]} onFile={handleFileUpload} label="Drop a JSON file or paste below" />
            ) : (
              <UrlInput onFile={handleFileUpload} accept={[".json"]} placeholder="https://example.com/data.json" label="Load JSON from URL" />
            )}
          </div>
        )}

        {stats && (
          <div className="border-2 border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary font-medium rounded">
            {stats}
          </div>
        )}
        {error && <ErrorAlert message={error} />}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleFormat}>Format</Button>
          <Button variant="outline" onClick={handleMinify}>Minify</Button>
          <Button variant="outline" onClick={handleValidate}>Validate</Button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Indent:</label>
            <select value={String(indent)} onChange={(e) => setIndent(e.target.value === "\t" ? "\t" : Number(e.target.value))} className="border-2 border-border bg-background px-2 py-1 text-xs">
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value={"\t"}>Tab</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
              Sort keys
            </label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setInput(SAMPLE)}>Load sample</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json"; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileUpload(f); }; inp.click(); }}>Upload file</Button>
              </div>
            </div>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON here..." className="min-h-[400px] font-mono text-xs border-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setView("formatted")} className={`text-xs font-bold uppercase tracking-widest transition-colors ${view === "formatted" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Formatted</button>
                <button onClick={() => setView("tree")} className={`text-xs font-bold uppercase tracking-widest transition-colors ${view === "tree" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Tree</button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleCopy} disabled={!output}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDownload} disabled={!output}>Download</Button>
              </div>
            </div>

            {view === "formatted" ? (
              <pre className="min-h-[400px] overflow-auto border-2 border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap">
                {output || <span className="text-muted-foreground">Output will appear here...</span>}
              </pre>
            ) : (
              <div className="min-h-[400px] overflow-auto border-2 border-border bg-card p-4">
                {treeNodes.length > 0 ? treeNodes.map((node, i) => <TreeNode key={`${node.path}-${i}`} node={node} />) : <span className="text-xs text-muted-foreground">Format JSON to see tree view...</span>}
              </div>
            )}
          </div>
        </div>

        
      </div>
    </ToolPage>
  );
}
