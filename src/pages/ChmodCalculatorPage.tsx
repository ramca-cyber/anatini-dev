import { useState, useMemo } from "react";
import { Shield, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

const PERMS = ["Read", "Write", "Execute"] as const;
const GROUPS = ["Owner", "Group", "Others"] as const;

export default function ChmodCalculatorPage() {
  const [bits, setBits] = useState([true, true, false, true, false, false, true, false, false]); // 644

  const toggle = (i: number) => setBits(p => { const n = [...p]; n[i] = !n[i]; return n; });

  const octal = useMemo(() => {
    const o = GROUPS.map((_, gi) => {
      let v = 0;
      if (bits[gi * 3]) v += 4;
      if (bits[gi * 3 + 1]) v += 2;
      if (bits[gi * 3 + 2]) v += 1;
      return v;
    });
    return o.join("");
  }, [bits]);

  const symbolic = useMemo(() => {
    return GROUPS.map((_, gi) =>
      (bits[gi * 3] ? "r" : "-") + (bits[gi * 3 + 1] ? "w" : "-") + (bits[gi * 3 + 2] ? "x" : "-")
    ).join("");
  }, [bits]);

  const fromOctal = (val: string) => {
    if (!/^[0-7]{3}$/.test(val)) return;
    const newBits = val.split("").flatMap(d => {
      const n = parseInt(d);
      return [(n & 4) !== 0, (n & 2) !== 0, (n & 1) !== 0];
    });
    setBits(newBits);
  };

  const presets = [
    { label: "644", desc: "Files (default)" },
    { label: "755", desc: "Executables/Dirs" },
    { label: "600", desc: "Private files" },
    { label: "777", desc: "Full access" },
    { label: "400", desc: "Read-only" },
    { label: "750", desc: "Group read+exec" },
  ];

  return (
    <ToolPage icon={Shield} title="Chmod Calculator" description="Calculate Unix file permissions in octal and symbolic notation."
      metaDescription={getToolMetaDescription("chmod-calculator")} seoContent={getToolSeo("chmod-calculator")}>
      <div className="space-y-6 max-w-2xl">
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => fromOctal(p.label)}>
              {p.label} <span className="text-muted-foreground ml-1">({p.desc})</span>
            </Button>
          ))}
        </div>

        <div className="border border-border bg-muted/30 p-4">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2" />{PERMS.map(p => <th key={p} className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2">{p}</th>)}</tr></thead>
            <tbody>
              {GROUPS.map((g, gi) => (
                <tr key={g} className="border-t border-border">
                  <td className="py-3 font-medium">{g}</td>
                  {PERMS.map((_, pi) => (
                    <td key={pi} className="text-center py-3">
                      <button
                        onClick={() => toggle(gi * 3 + pi)}
                        className={`h-8 w-8 border-2 transition-colors font-mono text-xs ${bits[gi * 3 + pi] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}
                      >
                        {bits[gi * 3 + pi] ? "✓" : "—"}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border bg-muted/30 p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Octal</label>
            <div className="flex items-center gap-2">
              <input value={octal} onChange={e => fromOctal(e.target.value)} maxLength={3}
                className="w-24 border border-border bg-background px-3 py-2 text-2xl font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(octal); toast({ title: "Copied" }); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="border border-border bg-muted/30 p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Symbolic</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono">-{symbolic}</span>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(symbolic); toast({ title: "Copied" }); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-border bg-muted/30 p-4 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Command</label>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm">chmod {octal} filename</code>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`chmod ${octal} filename`); toast({ title: "Copied" }); }}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
