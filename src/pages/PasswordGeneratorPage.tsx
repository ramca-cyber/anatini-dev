import { useState, useCallback, useEffect } from "react";
import { KeyRound, Copy, RefreshCw } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
};

function generatePassword(length: number, options: Record<string, boolean>): string {
  let chars = "";
  if (options.uppercase) chars += CHARSETS.uppercase;
  if (options.lowercase) chars += CHARSETS.lowercase;
  if (options.digits) chars += CHARSETS.digits;
  if (options.symbols) chars += CHARSETS.symbols;
  if (!chars) chars = CHARSETS.lowercase + CHARSETS.digits;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

function calcStrength(pw: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-destructive", percent: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-yellow-500", percent: 50 };
  if (score <= 4) return { label: "Strong", color: "bg-green-500", percent: 75 };
  return { label: "Very Strong", color: "bg-green-600", percent: 100 };
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, digits: true, symbols: true });
  const [password, setPassword] = useState("");
  const [count, setCount] = useState(1);

  const generate = useCallback(() => {
    if (count === 1) {
      setPassword(generatePassword(length, options));
    } else {
      const passwords = Array.from({ length: count }, () => generatePassword(length, options));
      setPassword(passwords.join("\n"));
    }
  }, [length, options, count]);

  useEffect(() => { generate(); }, [generate]);

  const strength = calcStrength(password.split("\n")[0] || "");

  function handleCopy() {
    navigator.clipboard.writeText(password);
    toast({ title: "Password copied" });
  }

  const toggleOpt = (key: string) => setOptions((o) => ({ ...o, [key]: !o[key as keyof typeof o] }));

  return (
    <ToolPage icon={KeyRound} title="Password Generator" description="Generate cryptographically secure passwords with customizable rules." pageTitle="Password Generator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("password-generator")} seoContent={getToolSeo("password-generator")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs text-muted-foreground font-bold whitespace-nowrap">Length: {length}</label>
            <Slider value={[length]} onValueChange={([v]) => setLength(v)} min={4} max={128} step={1} className="w-32" />
          </div>
          <div className="flex items-center gap-2 min-w-[160px]">
            <label className="text-xs text-muted-foreground font-bold whitespace-nowrap">Count: {count}</label>
            <Slider value={[count]} onValueChange={([v]) => setCount(v)} min={1} max={20} step={1} className="w-24" />
          </div>
          {(["uppercase", "lowercase", "digits", "symbols"] as const).map((key) => (
            <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={options[key]} onChange={() => toggleOpt(key)} className="accent-primary" />
              <span className="capitalize">{key}</span>
            </label>
          ))}
          <Button variant="outline" size="sm" onClick={generate}>
            <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
          </Button>
        </div>

        <div className="border-2 border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generated Password{count > 1 ? "s" : ""}</h3>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </div>
          <pre className="bg-muted/30 border border-border p-3 text-sm font-mono break-all select-all whitespace-pre-wrap">{password}</pre>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
            </div>
            <span className="text-xs font-bold text-muted-foreground">{strength.label}</span>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
