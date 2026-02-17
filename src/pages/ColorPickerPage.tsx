import { useState, useCallback, useEffect } from "react";
import { Palette, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface ColorData {
  hex: string;
  r: number; g: number; b: number;
  h: number; s: number; l: number;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t++; if (t > 1) t--;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [Math.round(hue2rgb(p, q, h + 1/3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1/3) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1: ColorData, c2: ColorData): number {
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(input: string): ColorData | null {
  let r: number, g: number, b: number;
  const hex = input.trim();
  const rgb = hexToRgb(hex.startsWith("#") ? hex : `#${hex}`);
  if (rgb) {
    [r, g, b] = rgb;
  } else {
    const m = hex.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) { [r, g, b] = [+m[1], +m[2], +m[3]]; }
    else {
      const hm = hex.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
      if (hm) { [r, g, b] = hslToRgb(+hm[1], +hm[2], +hm[3]); }
      else return null;
    }
  }
  const [h, s, l] = rgbToHsl(r, g, b);
  return { hex: rgbToHex(r, g, b), r, g, b, h, s, l };
}

function copyText(text: string) { navigator.clipboard.writeText(text); toast({ title: "Copied" }); }

export default function ColorPickerPage() {
  const [input, setInput] = useState("#3b82f6");
  const [color, setColor] = useState<ColorData | null>(null);
  const [input2, setInput2] = useState("#ffffff");
  const [color2, setColor2] = useState<ColorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(() => {
    setError(null);
    const c1 = parseColor(input);
    const c2 = parseColor(input2);
    if (!c1 && input.trim()) setError("Invalid color format");
    setColor(c1);
    setColor2(c2);
  }, [input, input2]);

  useEffect(() => { parse(); }, [parse]);

  const ratio = color && color2 ? contrastRatio(color, color2) : null;
  const wcagAA = ratio ? ratio >= 4.5 : false;
  const wcagAAA = ratio ? ratio >= 7 : false;

  return (
    <ToolPage icon={Palette} title="Color Picker / Converter" description="Convert between Hex, RGB, HSL. Check WCAG contrast ratios." pageTitle="Color Picker / Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("color-picker")} seoContent={getToolSeo("color-picker")}>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Color 1 */}
          <div className="border border-border p-4 space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color 1</label>
            <div className="flex gap-2">
              <input type="color" value={color?.hex || "#000000"} onChange={(e) => setInput(e.target.value)} className="h-10 w-14 cursor-pointer border border-border" />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="#3b82f6 or rgb(59,130,246)" className="flex-1 border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
            </div>
            {color && (
              <div className="space-y-1">
                {[
                  { label: "HEX", value: color.hex },
                  { label: "RGB", value: `rgb(${color.r}, ${color.g}, ${color.b})` },
                  { label: "HSL", value: `hsl(${color.h}, ${color.s}%, ${color.l}%)` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{label}</span>
                    <button onClick={() => copyText(value)} className="hover:text-primary transition-colors flex items-center gap-1">
                      {value} <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="h-16 rounded border border-border" style={{ backgroundColor: color.hex }} />
              </div>
            )}
          </div>

          {/* Color 2 */}
          <div className="border border-border p-4 space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color 2 (contrast check)</label>
            <div className="flex gap-2">
              <input type="color" value={color2?.hex || "#ffffff"} onChange={(e) => setInput2(e.target.value)} className="h-10 w-14 cursor-pointer border border-border" />
              <input value={input2} onChange={(e) => setInput2(e.target.value)} className="flex-1 border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" spellCheck={false} />
            </div>
            {color2 && (
              <div className="space-y-1">
                {[
                  { label: "HEX", value: color2.hex },
                  { label: "RGB", value: `rgb(${color2.r}, ${color2.g}, ${color2.b})` },
                  { label: "HSL", value: `hsl(${color2.h}, ${color2.s}%, ${color2.l}%)` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{label}</span>
                    <button onClick={() => copyText(value)} className="hover:text-primary transition-colors flex items-center gap-1">
                      {value} <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="h-16 rounded border border-border" style={{ backgroundColor: color2.hex }} />
              </div>
            )}
          </div>
        </div>

        {/* Contrast results */}
        {ratio !== null && color && color2 && (
          <div className="border border-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WCAG Contrast</h3>
            <div className="flex items-center gap-6">
              <span className="text-2xl font-bold font-mono">{ratio.toFixed(2)}:1</span>
              <span className={`px-2 py-1 text-xs font-bold rounded ${wcagAAA ? "bg-green-500/20 text-green-700" : wcagAA ? "bg-yellow-500/20 text-yellow-700" : "bg-destructive/20 text-destructive"}`}>
                {wcagAAA ? "AAA Pass" : wcagAA ? "AA Pass" : "Fail"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded border border-border text-center text-sm font-bold" style={{ backgroundColor: color.hex, color: color2.hex }}>
                Text Preview
              </div>
              <div className="p-4 rounded border border-border text-center text-sm font-bold" style={{ backgroundColor: color2.hex, color: color.hex }}>
                Text Preview
              </div>
            </div>
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
