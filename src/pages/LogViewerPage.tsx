import { useState, useCallback, useMemo } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { FileText, Upload, Copy, Download, Filter } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const LEVELS = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_COLORS: Record<Level, string> = {
  ERROR: "text-red-600 dark:text-red-400",
  WARN: "text-yellow-600 dark:text-yellow-400",
  INFO: "text-blue-600 dark:text-blue-400",
  DEBUG: "text-muted-foreground",
  TRACE: "text-muted-foreground/60",
};

const LEVEL_BG: Record<Level, string> = {
  ERROR: "bg-red-100 dark:bg-red-950/30",
  WARN: "bg-yellow-100 dark:bg-yellow-950/30",
  INFO: "",
  DEBUG: "",
  TRACE: "",
};

interface LogLine {
  lineNumber: number;
  raw: string;
  level: Level | null;
  timestamp: string | null;
  message: string;
}

function detectLevel(line: string): Level | null {
  const upper = line.toUpperCase();
  for (const level of LEVELS) {
    // Match common patterns: [ERROR], ERROR:, level=error, "level":"error"
    if (
      upper.includes(`[${level}]`) ||
      upper.includes(`${level} `) ||
      upper.includes(`${level}:`) ||
      upper.includes(`LEVEL=${level}`) ||
      upper.includes(`"LEVEL":"${level}"`) ||
      upper.includes(`"${level.toLowerCase()}"`)
    ) {
      return level;
    }
  }
  // Also match "warning" for WARN
  if (upper.includes("[WARNING]") || upper.includes("WARNING ") || upper.includes("WARNING:")) return "WARN";
  return null;
}

function detectTimestamp(line: string): string | null {
  // ISO 8601: 2024-01-15T12:34:56.789Z or similar
  const isoMatch = line.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*/);
  if (isoMatch) return isoMatch[0];
  // Common log format: 15/Jan/2024:12:34:56
  const clfMatch = line.match(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/);
  if (clfMatch) return clfMatch[0];
  return null;
}

function parseLines(text: string): LogLine[] {
  return text.split("\n").map((raw, i) => ({
    lineNumber: i + 1,
    raw,
    level: detectLevel(raw),
    timestamp: detectTimestamp(raw),
    message: raw,
  }));
}

const sampleLog = `2024-01-15T10:00:01.123Z [INFO] Application starting on port 8080
2024-01-15T10:00:01.456Z [INFO] Connected to database postgres://localhost:5432/myapp
2024-01-15T10:00:01.789Z [DEBUG] Loading configuration from /etc/app/config.yaml
2024-01-15T10:00:02.001Z [INFO] Health check endpoint registered at /healthz
2024-01-15T10:00:05.234Z [INFO] GET /api/users 200 12ms
2024-01-15T10:00:05.567Z [DEBUG] Cache hit for key: users:list:page1
2024-01-15T10:00:08.890Z [WARN] Slow query detected: SELECT * FROM orders took 2340ms
2024-01-15T10:00:09.123Z [INFO] POST /api/orders 201 45ms
2024-01-15T10:00:12.456Z [ERROR] Failed to send email notification: SMTP connection timeout after 30s
2024-01-15T10:00:12.789Z [ERROR] Stack trace: at EmailService.send (email.ts:42) at OrderHandler.notify (orders.ts:158)
2024-01-15T10:00:15.012Z [INFO] GET /api/products 200 8ms
2024-01-15T10:00:15.345Z [DEBUG] Cache miss for key: products:featured
2024-01-15T10:00:18.678Z [WARN] Rate limit approaching for IP 192.168.1.100 (95/100 requests)
2024-01-15T10:00:20.901Z [INFO] WebSocket connection established: client_id=abc123
2024-01-15T10:00:25.234Z [TRACE] Heartbeat sent to client abc123
2024-01-15T10:00:30.567Z [INFO] Batch job 'daily-report' completed in 4.2s, processed 15,432 records
2024-01-15T10:00:35.890Z [WARN] Memory usage at 82% (820MB / 1024MB)
2024-01-15T10:00:40.123Z [ERROR] Unhandled promise rejection: Cannot read property 'id' of undefined
2024-01-15T10:00:40.456Z [DEBUG] Request context: { userId: null, path: "/api/admin/users", method: "DELETE" }
2024-01-15T10:00:45.789Z [INFO] Graceful shutdown initiated, draining connections...`;

export default function LogViewerPage() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enabledLevels, setEnabledLevels] = useState<Set<Level>>(new Set(LEVELS));
  const [regexFilter, setRegexFilter] = useState("");
  const [regexError, setRegexError] = useState<string | null>(null);
  const [wrapLines, setWrapLines] = useState(false);

  const lines = useMemo(() => parseLines(text), [text]);

  const filteredLines = useMemo(() => {
    let result = lines;

    // Level filter
    result = result.filter((l) => l.level === null || enabledLevels.has(l.level));

    // Regex filter
    if (regexFilter.trim()) {
      try {
        const re = new RegExp(regexFilter, "i");
        setRegexError(null);
        result = result.filter((l) => re.test(l.raw));
      } catch (e) {
        setRegexError(e instanceof Error ? e.message : "Invalid regex");
      }
    } else {
      setRegexError(null);
    }

    return result;
  }, [lines, enabledLevels, regexFilter]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const level of LEVELS) counts[level] = 0;
    for (const l of lines) if (l.level) counts[l.level]++;
    return counts;
  }, [lines]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleCopy() {
    const text = filteredLines.map((l) => l.raw).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied filtered lines to clipboard" });
  }

  function handleDownload() {
    const content = filteredLines.map((l) => l.raw).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered.log";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleLevel(level: Level) {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  const hasContent = text.trim().length > 0;

  return (
    <ToolPage
      icon={FileText}
      title="Log Viewer"
      description="View and filter log files with level detection, regex search, and line numbers."
      metaDescription={getToolMetaDescription("log-viewer")}
      seoContent={getToolSeo("log-viewer")}
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`px-2 py-0.5 text-xs font-bold border border-border transition-all ${
                    enabledLevels.has(level)
                      ? `${LEVEL_COLORS[level]} bg-background`
                      : "text-muted-foreground/40 bg-muted line-through"
                  }`}
                >
                  {level} {hasContent ? `(${levelCounts[level]})` : ""}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={wrapLines}
                  onChange={(e) => setWrapLines(e.target.checked)}
                  className="accent-primary"
                />
                Wrap
              </label>
              <Button variant="outline" size="sm" onClick={() => setText(sampleLog)}>
                Load Sample
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".log,.txt,.out"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </span>
                </Button>
              </label>
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!hasContent}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!hasContent}>
                <Download className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          </div>

          {/* Regex filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={regexFilter}
              onChange={(e) => setRegexFilter(e.target.value)}
              placeholder="Filter by regex (e.g. GET|POST, error.*timeout)"
              className="flex-1 border border-border bg-background px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {regexError && <span className="text-xs text-destructive">{regexError}</span>}
            {hasContent && (
              <span className="text-xs text-muted-foreground">
                {filteredLines.length}/{lines.length} lines
              </span>
            )}
          </div>
        </div>

        {/* Log content area */}
        {!hasContent ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border p-12 text-center"
          >
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop a log file here, paste text below, or click Upload
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Or paste log content here…"
              className="mt-2 w-full max-w-xl h-32 border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="border border-border bg-background overflow-auto max-h-[600px]">
            <table className="w-full text-xs font-mono">
              <tbody>
                {filteredLines.map((line) => (
                  <tr
                    key={line.lineNumber}
                    className={`border-b border-border/30 hover:bg-muted/30 ${
                      line.level ? LEVEL_BG[line.level] : ""
                    }`}
                  >
                    <td className="px-2 py-0.5 text-right text-muted-foreground/50 select-none w-12 align-top border-r border-border/30">
                      {line.lineNumber}
                    </td>
                    {line.level && (
                      <td className={`px-2 py-0.5 font-bold w-16 align-top ${LEVEL_COLORS[line.level]}`}>
                        {line.level}
                      </td>
                    )}
                    <td
                      colSpan={line.level ? 1 : 2}
                      className={`px-2 py-0.5 ${wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}
                    >
                      {line.raw}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
