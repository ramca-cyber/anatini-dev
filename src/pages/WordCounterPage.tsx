import { useState, useMemo } from "react";
import { FileText, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

export default function WordCounterPage() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const bytes = new Blob([text]).size;
    const readTime = Math.max(1, Math.ceil(words / 200));
    const speakTime = Math.max(1, Math.ceil(words / 130));

    // Frequency
    const wordList = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const freq = new Map<string, number>();
    wordList.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
    const topWords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { chars, charsNoSpace, words, sentences, paragraphs, lines, bytes, readTime, speakTime, topWords };
  }, [text]);

  const statCards = [
    { label: "Characters", value: stats.chars.toLocaleString() },
    { label: "No Spaces", value: stats.charsNoSpace.toLocaleString() },
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Sentences", value: stats.sentences.toLocaleString() },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
    { label: "Lines", value: stats.lines.toLocaleString() },
    { label: "Bytes", value: stats.bytes.toLocaleString() },
    { label: "Read Time", value: `~${stats.readTime} min` },
    { label: "Speak Time", value: `~${stats.speakTime} min` },
  ];

  return (
    <ToolPage icon={FileText} title="Word & Character Counter" description="Count words, characters, sentences, and reading time."
      metaDescription={getToolMetaDescription("word-counter")} seoContent={getToolSeo("word-counter")}>
      <div className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {statCards.map(s => (
            <div key={s.label} className="border border-border bg-muted/30 p-2 text-center">
              <div className="text-lg font-mono font-bold">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste text to analyze…"
          className="w-full h-[350px] border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
        {stats.topWords.length > 0 && (
          <div className="border border-border bg-muted/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Words</h3>
            <div className="flex flex-wrap gap-2">
              {stats.topWords.map(([word, count]) => (
                <span key={word} className="border border-border bg-background px-2 py-1 text-xs font-mono">
                  {word} <span className="text-muted-foreground">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
