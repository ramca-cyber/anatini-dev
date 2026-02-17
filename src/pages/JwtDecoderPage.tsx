import { useState, useCallback, useEffect } from "react";
import { Shield, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return decodeURIComponent(
    atob(base64).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT: expected 3 parts separated by dots");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return { header, payload, signature: parts[2] };
}

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  if (value < 1e9 || value > 3e10) return null;
  return new Date(value * 1000).toISOString();
}

const SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtDecoderPage() {
  const [input, setInput] = useState(SAMPLE);
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decode = useCallback(() => {
    setError(null);
    if (!input.trim()) { setDecoded(null); return; }
    try {
      setDecoded(decodeJwt(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode JWT");
      setDecoded(null);
    }
  }, [input]);

  useEffect(() => { decode(); }, [decode]);

  const isExpired = decoded?.payload?.exp
    ? typeof decoded.payload.exp === "number" && decoded.payload.exp * 1000 < Date.now()
    : null;

  return (
    <ToolPage icon={Shield} title="JWT Decoder" description="Decode JSON Web Tokens to inspect header, payload, and claims." pageTitle="JWT Decoder — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("jwt-decoder")} seoContent={getToolSeo("jwt-decoder")}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 border border-border bg-muted/30 px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>Load Sample</Button>
          <button onClick={() => { setInput(""); setDecoded(null); setError(null); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          {isExpired !== null && (
            <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${isExpired ? "bg-destructive/20 text-destructive" : "bg-green-500/20 text-green-700"}`}>
              {isExpired ? "Expired" : "Valid (not expired)"}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JWT Token</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a JWT token (eyJhbG…)"
            className="w-full h-[120px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary break-all"
            spellCheck={false}
          />
        </div>

        {error && <ErrorAlert message={error} />}

        {decoded && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Header */}
            <div className="border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Header</h3>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify(decoded.header, null, 2)); toast({ title: "Header copied" }); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-xs font-mono bg-muted/30 border border-border p-3 overflow-auto max-h-[300px]">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div className="border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Payload</h3>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify(decoded.payload, null, 2)); toast({ title: "Payload copied" }); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-xs font-mono bg-muted/30 border border-border p-3 overflow-auto max-h-[300px]">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
              {/* Timestamp annotations */}
              {Object.entries(decoded.payload).map(([key, val]) => {
                const ts = formatTimestamp(val);
                if (!ts) return null;
                return (
                  <div key={key} className="text-xs text-muted-foreground">
                    <span className="font-mono font-bold">{key}</span>: {ts}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
