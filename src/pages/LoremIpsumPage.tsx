import { useState, useMemo } from "react";
import { Type, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");

function genWords(n: number): string {
  const result: string[] = [];
  for (let i = 0; i < n; i++) result.push(WORDS[i % WORDS.length]);
  result[0] = result[0].charAt(0).toUpperCase() + result[0].slice(1);
  return result.join(" ") + ".";
}

function genSentence(): string {
  const len = 8 + Math.floor(Math.random() * 12);
  return genWords(len);
}

function genParagraph(): string {
  const sentences = 3 + Math.floor(Math.random() * 5);
  return Array.from({ length: sentences }, genSentence).join(" ");
}

type Unit = "paragraphs" | "sentences" | "words";

export default function LoremIpsumPage() {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [startLorem, setStartLorem] = useState(true);

  const output = useMemo(() => {
    let text = "";
    if (unit === "paragraphs") {
      text = Array.from({ length: count }, (_, i) => {
        const p = genParagraph();
        if (i === 0 && startLorem) return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + p;
        return p;
      }).join("\n\n");
    } else if (unit === "sentences") {
      text = Array.from({ length: count }, genSentence).join(" ");
      if (startLorem) text = "Lorem ipsum dolor sit amet. " + text;
    } else {
      text = genWords(count);
      if (startLorem && count > 2) text = "Lorem ipsum " + genWords(count - 2);
    }
    return text;
  }, [count, unit, startLorem]);

  const stats = useMemo(() => {
    const words = output.split(/\s+/).filter(Boolean).length;
    const chars = output.length;
    const bytes = new Blob([output]).size;
    return { words, chars, bytes };
  }, [output]);

  return (
    <ToolPage icon={Type} title="Lorem Ipsum Generator" description="Generate placeholder text for design and development."
      metaDescription={getToolMetaDescription("lorem-ipsum")} seoContent={getToolSeo("lorem-ipsum")}>
      <div className="space-y-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Count:</label>
            <input type="number" min={1} max={100} value={count} onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 border border-border bg-background px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <ToggleButton options={[{ label: "Paragraphs", value: "paragraphs" }, { label: "Sentences", value: "sentences" }, { label: "Words", value: "words" }]} value={unit} onChange={v => setUnit(v as Unit)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={startLorem} onChange={e => setStartLorem(e.target.checked)} className="accent-primary" />
            Start with "Lorem ipsum"
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</label>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied" }); }}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
          </div>
          <textarea value={output} readOnly className="w-full h-[400px] border border-border bg-muted/30 px-3 py-2 text-sm resize-none" />
          <div className="text-xs text-muted-foreground">
            {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} chars · {stats.bytes.toLocaleString()} bytes
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
