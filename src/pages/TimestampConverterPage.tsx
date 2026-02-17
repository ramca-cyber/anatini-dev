import { useState, useCallback, useEffect } from "react";
import { Clock, Copy, RefreshCw } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";

type Mode = "toDate" | "toEpoch";

function formatDate(d: Date): Record<string, string> {
  return {
    "ISO 8601": d.toISOString(),
    "UTC": d.toUTCString(),
    "Local": d.toLocaleString(),
    "Date only": d.toLocaleDateString("sv-SE"),
    "Time only": d.toLocaleTimeString(),
    "Unix (s)": Math.floor(d.getTime() / 1000).toString(),
    "Unix (ms)": d.getTime().toString(),
  };
}

export default function TimestampConverterPage() {
  const [mode, setMode] = useState<Mode>("toDate");
  const [input, setInput] = useState(Date.now().toString());
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 19));
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    setError(null);
    try {
      if (mode === "toDate") {
        const val = input.trim();
        if (!val) { setResult(null); return; }
        let ts = Number(val);
        if (isNaN(ts)) {
          // Try ISO string
          const d = new Date(val);
          if (isNaN(d.getTime())) throw new Error("Invalid timestamp or date string");
          setResult(formatDate(d));
          return;
        }
        // Auto-detect seconds vs milliseconds
        if (ts < 1e12) ts *= 1000;
        const d = new Date(ts);
        if (isNaN(d.getTime())) throw new Error("Invalid timestamp");
        setResult(formatDate(d));
      } else {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) throw new Error("Invalid date");
        setResult(formatDate(d));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setResult(null);
    }
  }, [mode, input, dateInput]);

  useEffect(() => { convert(); }, [convert]);

  function setNow() {
    const now = Date.now();
    setInput(now.toString());
    setDateInput(new Date(now).toISOString().slice(0, 19));
  }

  return (
    <ToolPage icon={Clock} title="Timestamp Converter" description="Convert between Unix epoch timestamps and human-readable dates." pageTitle="Timestamp / Epoch Converter — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("timestamp-converter")} seoContent={getToolSeo("timestamp-converter")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border border-border bg-muted/30 px-4 py-3">
          <ToggleButton
            options={[{ label: "Epoch → Date", value: "toDate" }, { label: "Date → Epoch", value: "toEpoch" }]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          <Button variant="outline" size="sm" onClick={setNow}>
            <RefreshCw className="h-3 w-3 mr-1" /> Now
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {mode === "toDate" ? "Unix Timestamp or ISO String" : "Date & Time"}
          </label>
          {mode === "toDate" ? (
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1700000000 or 2024-01-15T12:00:00Z"
              className="w-full border border-border bg-background px-3 py-2 text-lg font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          ) : (
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-lg font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        {error && <ErrorAlert message={error} />}

        {result && (
          <div className="border border-border bg-card p-4 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Results</h3>
            {Object.entries(result).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <button onClick={() => { navigator.clipboard.writeText(value); toast({ title: `${label} copied` }); }} className="text-xs font-mono hover:text-primary transition-colors flex items-center gap-1">
                  {value} <Copy className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
