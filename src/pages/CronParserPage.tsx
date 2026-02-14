import { useState, useCallback, useEffect } from "react";
import { Clock, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const FIELD_NAMES = ["Minute", "Hour", "Day of Month", "Month", "Day of Week"] as const;
const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeField(value: string, fieldIndex: number): string {
  if (value === "*") return `every ${FIELD_NAMES[fieldIndex].toLowerCase()}`;
  if (value.includes("/")) {
    const [base, step] = value.split("/");
    const unit = FIELD_NAMES[fieldIndex].toLowerCase();
    return base === "*" || base === "0"
      ? `every ${step} ${unit}${Number(step) > 1 ? "s" : ""}`
      : `every ${step} ${unit}${Number(step) > 1 ? "s" : ""} starting at ${base}`;
  }
  if (value.includes(",")) {
    const parts = value.split(",").map(v => formatValue(v.trim(), fieldIndex));
    return parts.join(", ");
  }
  if (value.includes("-")) {
    const [start, end] = value.split("-");
    return `${formatValue(start, fieldIndex)} through ${formatValue(end, fieldIndex)}`;
  }
  return formatValue(value, fieldIndex);
}

function formatValue(v: string, fieldIndex: number): string {
  const n = Number(v);
  if (fieldIndex === 3 && n >= 1 && n <= 12) return MONTH_NAMES[n];
  if (fieldIndex === 4 && n >= 0 && n <= 7) return DAY_NAMES[n % 7];
  return v;
}

function parseCron(expr: string): { fields: string[]; description: string; nextRuns: string[] } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    throw new Error(`Expected 5 fields (minute hour day month weekday), got ${parts.length}. Six-field (with seconds) is not standard cron.`);
  }
  const fields = parts.slice(0, 5);

  // Build human description
  const descriptions = fields.map((f, i) => describeField(f, i));
  let human = "Runs ";

  // Time
  const [min, hour] = fields;
  if (min !== "*" && hour !== "*" && !min.includes("/") && !hour.includes("/")) {
    human += `at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  } else {
    human += descriptions[0].startsWith("every") ? descriptions[0] : `at minute ${descriptions[0]}`;
    human += `, ${descriptions[1].startsWith("every") ? descriptions[1] : `at hour ${descriptions[1]}`}`;
  }

  // Day/Month/Weekday
  if (fields[2] !== "*") human += `, on day-of-month ${descriptions[2]}`;
  if (fields[3] !== "*") human += `, in ${descriptions[3]}`;
  if (fields[4] !== "*") human += `, on ${descriptions[4]}`;

  human += ".";

  // Compute next N runs (simple simulation)
  const nextRuns = computeNextRuns(fields, 5);

  return { fields, description: human, nextRuns };
}

function computeNextRuns(fields: string[], count: number): string[] {
  const results: string[] = [];
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  for (let i = 0; i < 525600 && results.length < count; i++) {
    if (matchesCron(d, fields)) {
      results.push(d.toLocaleString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

function matchesCron(d: Date, fields: string[]): boolean {
  const values = [d.getMinutes(), d.getHours(), d.getDate(), d.getMonth() + 1, d.getDay()];
  return fields.every((f, i) => matchesField(f, values[i], i));
}

function matchesField(field: string, value: number, _idx: number): boolean {
  if (field === "*") return true;
  return field.split(",").some(part => {
    if (part.includes("/")) {
      const [range, step] = part.split("/");
      const s = Number(step);
      if (range === "*") return value % s === 0;
      const start = Number(range);
      return value >= start && (value - start) % s === 0;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      return value >= a && value <= b;
    }
    return Number(part) === value || (_idx === 4 && Number(part) === 7 && value === 0);
  });
}

const presets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Weekly (Monday 9am)", value: "0 9 * * 1" },
  { label: "Monthly (1st, midnight)", value: "0 0 1 * *" },
  { label: "Weekdays at 8:30am", value: "30 8 * * 1-5" },
];

export default function CronParserPage() {
  const [input, setInput] = useState("0 9 * * 1-5");
  const [result, setResult] = useState<{ fields: string[]; description: string; nextRuns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(() => {
    setError(null);
    if (!input.trim()) { setResult(null); return; }
    try {
      setResult(parseCron(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid cron expression");
      setResult(null);
    }
  }, [input]);

  useEffect(() => { parse(); }, [parse]);

  return (
    <ToolPage
      icon={Clock}
      title="Cron Parser"
      description="Parse cron expressions into plain English with next scheduled runs."
      pageTitle="Cron Parser — Explain Cron Schedules | Anatini.dev"
      metaDescription="Parse and explain cron expressions in plain English. See next scheduled runs, validate syntax. Free, offline, no data leaves your browser."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/30 px-4 py-3">
          <span className="text-xs text-muted-foreground mr-1">Presets:</span>
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => setInput(p.value)}
              className="border border-border px-2 py-1 text-xs font-mono hover:bg-secondary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cron Expression</label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="* * * * *"
              className="flex-1 border border-border bg-background px-3 py-2 text-lg font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
            <Button variant="outline" size="sm" onClick={() => {
              if (result) { navigator.clipboard.writeText(result.description); toast({ title: "Description copied" }); }
            }} disabled={!result}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground font-mono">
            {FIELD_NAMES.map(n => (
              <span key={n} className="flex-1 text-center border-t border-dashed border-border pt-1">{n}</span>
            ))}
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {result && (
          <div className="space-y-4">
            {/* Description */}
            <div className="border border-border bg-card p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Human Description</div>
              <p className="text-sm font-medium">{result.description}</p>
            </div>

            {/* Field breakdown */}
            <div className="border border-border bg-card p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Field Breakdown</div>
              <div className="grid gap-1">
                {result.fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-mono font-bold w-16 text-right text-foreground">{f}</span>
                    <span className="text-muted-foreground">{FIELD_NAMES[i]}:</span>
                    <span className="text-foreground">{describeField(f, i)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next runs */}
            {result.nextRuns.length > 0 && (
              <div className="border border-border bg-card p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Next {result.nextRuns.length} Runs</div>
                <ol className="list-decimal list-inside space-y-1">
                  {result.nextRuns.map((r, i) => (
                    <li key={i} className="text-xs font-mono text-foreground">{r}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
