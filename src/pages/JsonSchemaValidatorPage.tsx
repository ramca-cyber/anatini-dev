import { useState, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { CheckCircle2, XCircle, ArrowRight, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

const sampleSchema = `{
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "email": { "type": "string", "format": "email" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false
}`;

const sampleDocument = `{
  "name": "Alice Johnson",
  "age": 32,
  "email": "alice@example.com",
  "tags": ["admin", "developer"]
}`;

interface ValidationResult {
  valid: boolean;
  errors: { path: string; message: string }[];
}

export default function JsonSchemaValidatorPage() {
  const [schema, setSchema] = useState("");
  const [document, setDocument] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const validate = useCallback(() => {
    setParseError(null);
    setResult(null);
    if (!schema.trim() || !document.trim()) return;

    try {
      const parsedSchema = JSON.parse(schema);
      let parsedDoc: any;
      try {
        parsedDoc = JSON.parse(document);
      } catch (e) {
        setParseError(`Invalid JSON document: ${(e as Error).message}`);
        return;
      }

      const valid = ajv.validate(parsedSchema, parsedDoc);
      if (valid) {
        setResult({ valid: true, errors: [] });
      } else {
        const errors = (ajv.errors ?? []).map(err => ({
          path: err.instancePath || "/",
          message: err.message ?? "Unknown error",
        }));
        setResult({ valid: false, errors });
      }
    } catch (e) {
      setParseError(`Invalid JSON Schema: ${(e as Error).message}`);
    }
  }, [schema, document]);

  function loadSample() {
    setSchema(sampleSchema);
    setDocument(sampleDocument);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <ToolPage icon={CheckCircle2} title="JSON Schema Validator" description="Validate JSON documents against JSON Schema definitions." pageTitle="JSON Schema Validator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("json-schema-validator")} seoContent={getToolSeo("json-schema-validator")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSample}>Load Sample</Button>
          </div>
          <Button onClick={validate} disabled={!schema.trim() || !document.trim()}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Validate
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Schema</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(schema)} disabled={!schema}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <button onClick={() => setSchema("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              </div>
            </div>
            <textarea
              value={schema}
              onChange={e => setSchema(e.target.value)}
              placeholder="Paste your JSON Schema here…"
              className="w-full h-[350px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">JSON Document</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(document)} disabled={!document}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <button onClick={() => setDocument("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              </div>
            </div>
            <textarea
              value={document}
              onChange={e => setDocument(e.target.value)}
              placeholder="Paste your JSON document here…"
              className="w-full h-[350px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`border-2 p-4 space-y-2 ${result.valid ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
            <div className="flex items-center gap-2">
              {result.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-primary">Valid — document conforms to schema</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{result.errors.length} validation error{result.errors.length !== 1 ? "s" : ""}</span>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-destructive shrink-0">{err.path}</span>
                    <span className="text-muted-foreground">{err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {parseError && <ErrorAlert message={parseError} />}
      </div>
    </ToolPage>
  );
}
