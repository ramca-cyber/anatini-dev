import { useState, useCallback, useEffect } from "react";
import { GitCompare, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface DiffLine {
  type: "equal" | "added" | "removed";
  content: string;
  lineOld?: number;
  lineNew?: number;
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");

  // Simple LCS-based diff
  const m = linesA.length, n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = linesA[i - 1] === linesB[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffLine[] = [];
  let i = m, j = n;
  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: "equal", content: linesA[i - 1], lineOld: i, lineNew: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", content: linesB[j - 1], lineNew: j });
      j--;
    } else {
      stack.push({ type: "removed", content: linesA[i - 1], lineOld: i });
      i--;
    }
  }
  while (stack.length) result.push(stack.pop()!);
  return result;
}

const SAMPLE_A = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}`;

const SAMPLE_B = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return true;
}

greet("World");`;

export default function TextDiffPage() {
  const [left, setLeft] = useState(SAMPLE_A);
  const [right, setRight] = useState(SAMPLE_B);
  const [diff, setDiff] = useState<DiffLine[]>([]);

  const compare = useCallback(() => {
    setDiff(computeDiff(left, right));
  }, [left, right]);

  useEffect(() => { compare(); }, [compare]);

  const stats = {
    added: diff.filter((d) => d.type === "added").length,
    removed: diff.filter((d) => d.type === "removed").length,
    unchanged: diff.filter((d) => d.type === "equal").length,
  };

  return (
    <ToolPage icon={GitCompare} title="Text Diff" description="Compare two text blocks side-by-side with line-by-line diff." pageTitle="Text Diff — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("text-diff")} seoContent={getToolSeo("text-diff")}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 border border-border bg-muted/30 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            <span className="text-green-600 font-bold">+{stats.added}</span> added ·{" "}
            <span className="text-red-500 font-bold">−{stats.removed}</span> removed ·{" "}
            {stats.unchanged} unchanged
          </span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
            const text = diff.map(d => `${d.type === "added" ? "+" : d.type === "removed" ? "-" : " "} ${d.content}`).join("\n");
            navigator.clipboard.writeText(text);
            toast({ title: "Diff copied" });
          }}>
            <Copy className="h-3 w-3 mr-1" /> Copy Diff
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original</label>
            <textarea value={left} onChange={(e) => setLeft(e.target.value)} className="w-full h-[200px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Modified</label>
            <textarea value={right} onChange={(e) => setRight(e.target.value)} className="w-full h-[200px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
          </div>
        </div>

        {diff.length > 0 && (
          <div className="border border-border bg-card overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-4 py-2 border-b border-border">Unified Diff</div>
            <div className="max-h-[500px] overflow-y-auto font-mono text-xs">
              {diff.map((d, i) => (
                <div
                  key={i}
                  className={`flex px-4 py-0.5 ${
                    d.type === "added" ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                    d.type === "removed" ? "bg-red-500/10 text-red-600 dark:text-red-400" : ""
                  }`}
                >
                  <span className="w-8 text-right text-muted-foreground mr-2 select-none shrink-0">{d.lineOld ?? ""}</span>
                  <span className="w-8 text-right text-muted-foreground mr-2 select-none shrink-0">{d.lineNew ?? ""}</span>
                  <span className="w-4 select-none shrink-0">{d.type === "added" ? "+" : d.type === "removed" ? "−" : " "}</span>
                  <span className="whitespace-pre">{d.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
