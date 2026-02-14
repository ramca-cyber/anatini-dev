import { useState, useCallback, useEffect } from "react";
import { highlightYaml } from "@/components/shared/SyntaxHighlight";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Code, Copy, Download, CheckCircle2 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import * as yaml from "js-yaml";

const sampleYaml = `# Server configuration
server:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /etc/ssl/cert.pem
    key: /etc/ssl/key.pem

database:
  driver: postgres
  host: localhost
  port: 5432
  name: myapp
  pool:
    min: 5
    max: 20

logging:
  level: info
  outputs:
    - type: console
      format: json
    - type: file
      path: /var/log/app.log
      rotate: true

features:
  - name: dark-mode
    enabled: true
    rollout: 100
  - name: beta-dashboard
    enabled: false
    rollout: 10`;

function formatYaml(input: string, indent: number): string {
  const parsed = yaml.load(input);
  return yaml.dump(parsed, { indent, lineWidth: -1, noRefs: true });
}

function minifyYaml(input: string): string {
  const parsed = yaml.load(input);
  return yaml.dump(parsed, { flowLevel: 0, lineWidth: -1, noRefs: true });
}

function validateYaml(input: string): { valid: boolean; error?: string } {
  try {
    yaml.load(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Invalid YAML" };
  }
}

export default function YamlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; error?: string } | null>(null);

  const format = useCallback(() => {
    setError(null);
    setValidationStatus(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      const result = formatYaml(input, indent);
      setOutput(result);
      setValidationStatus({ valid: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Format failed");
      setOutput("");
      setValidationStatus({ valid: false, error: e instanceof Error ? e.message : "Invalid YAML" });
    }
  }, [input, indent]);

  useEffect(() => {
    format();
  }, [format]);

  function handleMinify() {
    setError(null);
    if (!input.trim()) return;
    try {
      const result = minifyYaml(input);
      setOutput(result);
      setValidationStatus({ valid: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minify failed");
      setValidationStatus({ valid: false, error: e instanceof Error ? e.message : "Invalid YAML" });
    }
  }

  function handleValidate() {
    if (!input.trim()) return;
    const result = validateYaml(input);
    setValidationStatus(result);
    if (result.valid) {
      toast({ title: "✓ Valid YAML" });
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.yaml";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPage
      icon={Code}
      title="YAML Formatter"
      description="Format, minify, and validate YAML documents. Pretty-print with configurable indentation."
      metaDescription={getToolMetaDescription("yaml-formatter")}
      seoContent={getToolSeo("yaml-formatter")}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Indent</label>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="border border-border bg-background px-2 py-1 text-xs"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
            {validationStatus && (
              <div
                className={`flex items-center gap-1 text-xs font-bold ${
                  validationStatus.valid ? "text-green-600 dark:text-green-400" : "text-destructive"
                }`}
              >
                {validationStatus.valid ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Valid YAML
                  </>
                ) : (
                  <>✗ Invalid</>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInput(sampleYaml)}>
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleValidate} disabled={!input.trim()}>
              Validate
            </Button>
            <Button variant="outline" size="sm" onClick={handleMinify} disabled={!input.trim()}>
              Minify
            </Button>
            <Button onClick={format} disabled={!input.trim()}>
              Format
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                YAML Input
              </label>
              <button
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError(null);
                  setValidationStatus(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste YAML here…"
              className="w-full h-[400px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Formatted Output
              </label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!output}>
                  <Download className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
            <pre
              className="w-full h-[400px] overflow-auto border border-border bg-muted/30 px-3 py-2 text-xs font-mono whitespace-pre-wrap"
            >
              {output ? highlightYaml(output) : <span className="text-muted-foreground">Output will appear here…</span>}
            </pre>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
        <CrossToolLinks format="yaml" excludeRoute="/yaml-formatter" />
      </div>
    </ToolPage>
  );
}
