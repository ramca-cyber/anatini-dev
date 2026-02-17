import { useState, useCallback } from "react";
import { Fingerprint, Copy, RefreshCw } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

function generateV4(): string {
  return crypto.randomUUID();
}

function generateV7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Timestamp (48 bits) in first 6 bytes
  bytes[0] = (now / 2**40) & 0xff;
  bytes[1] = (now / 2**32) & 0xff;
  bytes[2] = (now / 2**24) & 0xff;
  bytes[3] = (now / 2**16) & 0xff;
  bytes[4] = (now / 2**8) & 0xff;
  bytes[5] = now & 0xff;
  // Version 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Variant 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

type Version = "v4" | "v7";

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState<Version>("v4");
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, generateV4));
  const [uppercase, setUppercase] = useState(false);

  const generate = useCallback(() => {
    const gen = version === "v4" ? generateV4 : generateV7;
    setUuids(Array.from({ length: count }, gen));
  }, [version, count]);

  const display = uuids.map(u => uppercase ? u.toUpperCase() : u);

  return (
    <ToolPage icon={Fingerprint} title="UUID Generator" description="Generate v4 (random) and v7 (timestamp) UUIDs." pageTitle="UUID Generator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("uuid-generator")} seoContent={getToolSeo("uuid-generator")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-bold">Version</label>
            <ToggleButton options={[{ label: "v4 (random)", value: "v4" }, { label: "v7 (timestamp)", value: "v7" }]} value={version} onChange={(v) => setVersion(v as Version)} />
          </div>
          <div className="flex items-center gap-2 min-w-[160px]">
            <label className="text-xs text-muted-foreground font-bold whitespace-nowrap">Count: {count}</label>
            <Slider value={[count]} onValueChange={([v]) => setCount(v)} min={1} max={100} step={1} className="w-24" />
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={uppercase} onChange={() => setUppercase(!uppercase)} className="accent-primary" />
            Uppercase
          </label>
          <Button variant="outline" size="sm" onClick={generate}>
            <RefreshCw className="h-3 w-3 mr-1" /> Generate
          </Button>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(display.join("\n")); toast({ title: `${display.length} UUIDs copied` }); }}>
            <Copy className="h-3 w-3 mr-1" /> Copy All
          </Button>
        </div>

        <div className="border border-border bg-card">
          <div className="max-h-[500px] overflow-y-auto">
            {display.map((u, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-1 border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                <span className="text-xs text-muted-foreground w-8 text-right">{i + 1}</span>
                <code className="text-xs font-mono flex-1 select-all">{u}</code>
                <button onClick={() => { navigator.clipboard.writeText(u); toast({ title: "UUID copied" }); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
