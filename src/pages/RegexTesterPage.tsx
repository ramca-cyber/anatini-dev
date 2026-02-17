import { useState, useCallback, useEffect, useMemo } from "react";
import { Regex, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface MatchResult {
  index: number;
  match: string;
  groups: string[];
}

const PRESETS = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
  { label: "URL", pattern: "https?://[^\\s]+", flags: "g" },
  { label: "IPv4", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", flags: "g" },
  { label: "ISO Date", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g" },
];

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState("Contact us at hello@example.com or support@anatini.dev for help.");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const test = useCallback(() => {
    setError(null);
    setMatches([]);
    if (!pattern || !input) return;
    try {
      const re = new RegExp(pattern, flags);
      const results: MatchResult[] = [];
      if (flags.includes("g")) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(input)) !== null) {
          results.push({ index: m.index, match: m[0], groups: m.slice(1) });
          if (!m[0]) re.lastIndex++;
        }
      } else {
        const m = re.exec(input);
        if (m) results.push({ index: m.index, match: m[0], groups: m.slice(1) });
      }
      setMatches(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid regex");
    }
  }, [pattern, flags, input]);

  useEffect(() => { test(); }, [test]);

  const highlighted = useMemo(() => {
    if (!matches.length || !input) return null;
    const parts: { text: string; isMatch: boolean }[] = [];
    let last = 0;
    for (const m of matches) {
      if (m.index > last) parts.push({ text: input.slice(last, m.index), isMatch: false });
      parts.push({ text: m.match, isMatch: true });
      last = m.index + m.match.length;
    }
    if (last < input.length) parts.push({ text: input.slice(last), isMatch: false });
    return parts;
  }, [matches, input]);

  return (
    <ToolPage icon={Regex} title="Regex Tester" description="Test regular expressions with match highlighting and capture groups." pageTitle="Regex Tester — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("regex-tester")} seoContent={getToolSeo("regex-tester")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/30 px-4 py-3">
          <span className="text-xs text-muted-foreground mr-1">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => { setPattern(p.pattern); setFlags(p.flags); }} className="border border-border px-2 py-1 text-xs font-mono hover:bg-secondary transition-colors">{p.label}</button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pattern</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-border bg-background px-3 py-2 font-mono text-sm">
              <span className="text-muted-foreground mr-1">/</span>
              <input value={pattern} onChange={(e) => setPattern(e.target.value)} className="flex-1 bg-transparent outline-none" spellCheck={false} />
              <span className="text-muted-foreground mx-1">/</span>
              <input value={flags} onChange={(e) => setFlags(e.target.value)} className="w-12 bg-transparent outline-none text-primary" spellCheck={false} placeholder="flags" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`/${pattern}/${flags}`); toast({ title: "Regex copied" }); }}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test String</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to test against…"
            className="w-full h-[150px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            spellCheck={false}
          />
        </div>

        {error && <ErrorAlert message={error} />}

        {highlighted && (
          <div className="border border-border bg-card p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Highlighted Matches — {matches.length} found</h3>
            <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {highlighted.map((part, i) =>
                part.isMatch ? (
                  <mark key={i} className="bg-primary/20 text-primary font-bold px-0.5">{part.text}</mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="border border-border bg-card p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Match Details</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="flex items-start gap-3 text-xs font-mono py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground w-8 text-right shrink-0">#{i + 1}</span>
                  <span className="text-primary font-bold">{m.match}</span>
                  <span className="text-muted-foreground">@{m.index}</span>
                  {m.groups.length > 0 && (
                    <span className="text-muted-foreground">groups: [{m.groups.map((g, j) => <span key={j} className="text-foreground">{g || "∅"}{j < m.groups.length - 1 ? ", " : ""}</span>)}]</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
