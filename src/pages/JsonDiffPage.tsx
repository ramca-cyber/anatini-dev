import { useState, useCallback, useEffect } from "react";
import { GitCompare, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type DiffEntry = {
  path: string;
  type: "added" | "removed" | "changed";
  left?: unknown;
  right?: unknown;
};

function deepDiff(a: unknown, b: unknown, path = ""): DiffEntry[] {
  if (a === b) return [];
  if (a === null || b === null || typeof a !== typeof b) {
    return [{ path: path || "(root)", type: "changed", left: a, right: b }];
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const entries: DiffEntry[] = [];
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const p = `${path}[${i}]`;
      if (i >= a.length) entries.push({ path: p, type: "added", right: b[i] });
      else if (i >= b.length) entries.push({ path: p, type: "removed", left: a[i] });
      else entries.push(...deepDiff(a[i], b[i], p));
    }
    return entries;
  }
  if (typeof a === "object" && typeof b === "object") {
    const entries: DiffEntry[] = [];
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    for (const key of allKeys) {
      const p = path ? `${path}.${key}` : key;
      if (!(key in aObj)) entries.push({ path: p, type: "added", right: bObj[key] });
      else if (!(key in bObj)) entries.push({ path: p, type: "removed", left: aObj[key] });
      else entries.push(...deepDiff(aObj[key], bObj[key], p));
    }
    return entries;
  }
  return [{ path: path || "(root)", type: "changed", left: a, right: b }];
}

function truncate(v: unknown): string {
  const s = JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 77) + "…" : s;
}

const sampleLeft = `{
  "name": "Alice",
  "age": 30,
  "hobbies": ["reading", "hiking"],
  "address": { "city": "Portland", "zip": "97201" }
}`;

const sampleRight = `{
  "name": "Alice",
  "age": 31,
  "hobbies": ["reading", "cycling"],
  "address": { "city": "Seattle", "zip": "98101" },
  "email": "alice@example.com"
}`;

export default function JsonDiffPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diffs, setDiffs] = useState<DiffEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(() => {
    setError(null);
    setDiffs(null);
    if (!left.trim() || !right.trim()) return;
    try {
      const a = JSON.parse(left);
      const b = JSON.parse(right);
      setDiffs(deepDiff(a, b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [left, right]);

  useEffect(() => { compare(); }, [compare]);

  function handleCopy() {
    if (!diffs) return;
    const text = diffs.map(d => {
      if (d.type === "added") return `+ ${d.path}: ${truncate(d.right)}`;
      if (d.type === "removed") return `- ${d.path}: ${truncate(d.left)}`;
      return `~ ${d.path}: ${truncate(d.left)} → ${truncate(d.right)}`;
    }).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Diff copied to clipboard" });
  }

  return (
    <ToolPage
      icon={GitCompare}
      title="JSON Diff"
      description="Compare two JSON documents and see every difference at a glance."
      pageTitle="JSON Diff — Compare JSON Online, Free | Anatini.dev"
      metaDescription="Compare two JSON objects or arrays side-by-side. See added, removed, and changed keys instantly. Free, offline, no data leaves your browser."
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 border border-border bg-muted/30 px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => { setLeft(sampleLeft); setRight(sampleRight); }}>
            Load Sample
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setLeft(""); setRight(""); setDiffs(null); setError(null); }}>
            Clear
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Left (Original)</label>
            <textarea
              value={left}
              onChange={e => setLeft(e.target.value)}
              placeholder="Paste original JSON…"
              className="w-full h-[350px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Right (Modified)</label>
            <textarea
              value={right}
              onChange={e => setRight(e.target.value)}
              placeholder="Paste modified JSON…"
              className="w-full h-[350px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {diffs !== null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {diffs.length === 0 ? "No differences found ✓" : `${diffs.length} difference${diffs.length > 1 ? "s" : ""}`}
                </span>
                {diffs.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600 dark:text-green-400">+{diffs.filter(d => d.type === "added").length} added</span>
                    <span className="text-red-600 dark:text-red-400">-{diffs.filter(d => d.type === "removed").length} removed</span>
                    <span className="text-amber-600 dark:text-amber-400">~{diffs.filter(d => d.type === "changed").length} changed</span>
                  </div>
                )}
              </div>
              {diffs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              )}
            </div>

            {diffs.length > 0 && (
              <div className="border border-border divide-y divide-border max-h-[400px] overflow-auto">
                {diffs.map((d, i) => (
                  <div key={i} className={`flex items-start gap-3 px-3 py-2 text-xs font-mono ${
                    d.type === "added" ? "bg-green-50 dark:bg-green-950/20" :
                    d.type === "removed" ? "bg-red-50 dark:bg-red-950/20" :
                    "bg-amber-50 dark:bg-amber-950/20"
                  }`}>
                    <span className={`font-bold flex-shrink-0 ${
                      d.type === "added" ? "text-green-600 dark:text-green-400" :
                      d.type === "removed" ? "text-red-600 dark:text-red-400" :
                      "text-amber-600 dark:text-amber-400"
                    }`}>
                      {d.type === "added" ? "+" : d.type === "removed" ? "−" : "~"}
                    </span>
                    <span className="font-semibold text-foreground flex-shrink-0">{d.path}</span>
                    <span className="text-muted-foreground truncate">
                      {d.type === "added" && truncate(d.right)}
                      {d.type === "removed" && truncate(d.left)}
                      {d.type === "changed" && <>{truncate(d.left)} <span className="text-foreground">→</span> {truncate(d.right)}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
