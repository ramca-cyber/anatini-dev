import { useState } from "react";
import { Code, Check, Copy, Download } from "lucide-react";
import { highlightSql } from "@/components/shared/SyntaxHighlight";
import { format as formatSql } from "sql-formatter";
import { ToolPage } from "@/components/shared/ToolPage";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = `SELECT u.id, u.name, o.total_amount, o.created_at FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.created_at >= '2024-01-01' AND o.status IN ('completed', 'shipped') GROUP BY u.id, u.name, o.total_amount, o.created_at HAVING o.total_amount > 100 ORDER BY o.created_at DESC LIMIT 50;`;

const DIALECTS = [
  { value: "sql", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "bigquery", label: "BigQuery" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "SQL Server" },
] as const;

type Dialect = (typeof DIALECTS)[number]["value"];

const KEYWORD_CASE = [
  { value: "upper", label: "UPPER" },
  { value: "lower", label: "lower" },
  { value: "preserve", label: "Preserve" },
] as const;

type KeywordCase = (typeof KEYWORD_CASE)[number]["value"];

export default function SqlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);

  function handleFormat() {
    if (!input.trim()) return;
    try {
      const result = formatSql(input, {
        language: dialect,
        keywordCase: keywordCase as any,
        tabWidth: indentSize,
        useTabs: false,
      });
      setOutput(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to format SQL");
    }
  }

  function handleMinify() {
    if (!input.trim()) return;
    try {
      const result = formatSql(input, {
        language: dialect,
        keywordCase: keywordCase as any,
        tabWidth: 0,
        useTabs: false,
      });
      // Collapse whitespace to single spaces, trim lines
      const minified = result.replace(/\n\s*/g, " ").replace(/\s+/g, " ").trim();
      setOutput(minified);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to minify SQL");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.sql";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage
      icon={Code}
      title="SQL Formatter"
      seoContent={getToolSeo("sql-formatter")}
      metaDescription={getToolMetaDescription("sql-formatter")}
      description="Format, beautify, and minify SQL with dialect-aware formatting."
    >
      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}

        {/* Config bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Dialect:</label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="border-2 border-border bg-background px-2 py-1 text-xs"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Keywords:</label>
            <select
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
              className="border-2 border-border bg-background px-2 py-1 text-xs"
            >
              {KEYWORD_CASE.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Indent:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="border-2 border-border bg-background px-2 py-1 text-xs"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={handleFormat} disabled={!input.trim()}>Format</Button>
            <Button variant="outline" onClick={handleMinify} disabled={!input.trim()}>Minify</Button>
          </div>
        </div>

        {/* Editor panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setInput(SAMPLE)}>
                Load sample
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste SQL here..."
              className="min-h-[400px] font-mono text-xs border-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleCopy} disabled={!output}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDownload} disabled={!output}>
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
            <pre className="min-h-[400px] overflow-auto border-2 border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap">
              {output ? highlightSql(output) : <span className="text-muted-foreground">Formatted SQL will appear here...</span>}
            </pre>
            {output && (
              <div className="text-xs text-muted-foreground px-1">
                {output.split("\n").length} lines · {new Blob([output]).size.toLocaleString()} bytes
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
