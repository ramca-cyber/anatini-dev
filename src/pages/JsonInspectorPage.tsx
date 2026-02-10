import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Search, FlaskConical, AlertTriangle, Info } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/contexts/FileStoreContext";
import { formatBytes } from "@/lib/duckdb-helpers";

interface JsonIdentity {
  encoding: string;
  bom: boolean;
  rootType: string;
  recordCount: number;
  format: string;
}

interface StructureAnalysis {
  totalKeys: number;
  maxDepth: number;
  hasNestedObjects: string[];
  hasNestedArrays: string[];
  keyNaming: string;
  minified: boolean;
}

interface SchemaSet {
  keys: string[];
  count: number;
  percent: number;
  missing?: string[];
}

interface KeyInfo {
  path: string;
  type: string;
  present: number;
  nullCount: number;
  sample: string;
}

interface Warning { level: "warning" | "info"; message: string; detail?: string; }

function detectJsonIdentity(text: string, parsed: any): JsonIdentity {
  const bom = text.charCodeAt(0) === 0xFEFF;
  const isArray = Array.isArray(parsed);
  const recordCount = isArray ? parsed.length : 1;
  const rootType = isArray ? `Array of ${recordCount.toLocaleString()} objects` : typeof parsed === "object" ? "Single object" : typeof parsed;
  const minCheck = text.trim();
  const isPretty = minCheck.includes("\n");
  return { encoding: bom ? "UTF-8 (with BOM)" : "UTF-8 (no BOM)", bom, rootType, recordCount, format: isPretty ? "Pretty-printed JSON" : "Minified JSON" };
}

function analyzeStructure(parsed: any): StructureAnalysis {
  const records = Array.isArray(parsed) ? parsed : [parsed];
  const allKeys = new Set<string>();
  let maxDepth = 0;
  const nestedObjs = new Set<string>();
  const nestedArrs = new Set<string>();

  function walk(obj: any, prefix: string, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      allKeys.add(p);
      if (v && typeof v === "object" && !Array.isArray(v)) { nestedObjs.add(k); walk(v, p, depth + 1); }
      else if (Array.isArray(v)) { nestedArrs.add(k); if (v.length > 0 && typeof v[0] === "object") walk(v[0], `${p}[]`, depth + 1); }
    }
  }

  const sample = records.slice(0, 100);
  sample.forEach(r => walk(r, "", 1));

  const firstRecord = records[0];
  const keys = firstRecord && typeof firstRecord === "object" ? Object.keys(firstRecord) : [];
  const hasCamel = keys.some(k => /[a-z][A-Z]/.test(k));
  const hasSnake = keys.some(k => k.includes("_"));
  const keyNaming = hasCamel ? "camelCase" : hasSnake ? "snake_case" : keys.length > 0 ? "flat" : "—";

  return { totalKeys: allKeys.size, maxDepth, hasNestedObjects: Array.from(nestedObjs), hasNestedArrays: Array.from(nestedArrs), keyNaming, minified: false };
}

function analyzeSchemaConsistency(records: any[]): SchemaSet[] {
  if (records.length === 0) return [];
  const keySetMap = new Map<string, number>();
  records.forEach(r => {
    if (!r || typeof r !== "object") return;
    const sig = Object.keys(r).sort().join(",");
    keySetMap.set(sig, (keySetMap.get(sig) || 0) + 1);
  });

  const allKeysSet = new Set<string>();
  records.forEach(r => { if (r && typeof r === "object") Object.keys(r).forEach(k => allKeysSet.add(k)); });
  const allKeys = Array.from(allKeysSet).sort();

  return Array.from(keySetMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sig, count]) => {
      const keys = sig.split(",");
      const missing = allKeys.filter(k => !keys.includes(k));
      return { keys, count, percent: (count / records.length) * 100, missing: missing.length > 0 ? missing : undefined };
    });
}

function analyzeValueTypes(records: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  function count(v: any) {
    if (v === null) { counts["null"] = (counts["null"] || 0) + 1; return; }
    if (Array.isArray(v)) { counts["array"] = (counts["array"] || 0) + 1; v.forEach(count); return; }
    const t = typeof v;
    if (t === "object") { counts["object"] = (counts["object"] || 0) + 1; Object.values(v).forEach(count); return; }
    counts[t] = (counts[t] || 0) + 1;
  }
  records.forEach(count);
  return counts;
}

function analyzeKeys(records: any[]): KeyInfo[] {
  if (records.length === 0) return [];
  const keyMap = new Map<string, { type: Set<string>; present: number; nulls: number; sample: string }>();

  function walk(obj: any, prefix: string) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (!keyMap.has(path)) keyMap.set(path, { type: new Set(), present: 0, nulls: 0, sample: "" });
      const info = keyMap.get(path)!;
      info.present++;
      if (v === null) { info.nulls++; info.type.add("null"); }
      else { info.type.add(Array.isArray(v) ? "array" : typeof v); if (!info.sample && typeof v !== "object") info.sample = String(v).slice(0, 30); }
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, path);
    }
  }

  const sample = records.slice(0, 500);
  sample.forEach(r => walk(r, ""));

  return Array.from(keyMap.entries()).map(([path, info]) => ({
    path, type: Array.from(info.type).join(" | "), present: Math.round((info.present / sample.length) * 100), nullCount: info.nulls, sample: info.sample,
  }));
}

export default function JsonInspectorPage() {
  const { addFile, getFile } = useFileStore();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<JsonIdentity | null>(null);
  const [structure, setStructure] = useState<StructureAnalysis | null>(null);
  const [schemas, setSchemas] = useState<SchemaSet[]>([]);
  const [valueTypes, setValueTypes] = useState<Record<string, number>>({});
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const autoLoaded = useRef(false);

  useEffect(() => {
    if (autoLoaded.current) return;
    const fileId = searchParams.get("fileId");
    if (fileId) {
      const stored = getFile(fileId);
      if (stored) { autoLoaded.current = true; setStoredFileId(fileId); processFile(stored.file); }
    }
  }, []);

  async function processFile(f: File) {
    setFile(f); setLoading(true); setError(null);
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const id = detectJsonIdentity(text, parsed);
      setIdentity(id);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      setStructure(analyzeStructure(parsed));
      setSchemas(analyzeSchemaConsistency(records));
      setValueTypes(analyzeValueTypes(records));
      setKeys(analyzeKeys(records));

      const warns: Warning[] = [];
      if (id.bom) warns.push({ level: "info", message: "File has UTF-8 BOM marker" });
      const schemaSetCount = new Set(records.map(r => r && typeof r === "object" ? Object.keys(r).sort().join(",") : "")).size;
      if (schemaSetCount > 1) warns.push({ level: "warning", message: `Inconsistent schema — ${schemaSetCount} different key sets found`, detail: "Some records are missing fields. Check Schema Consistency section." });
      const emptyStrings = records.reduce((c, r) => c + (r && typeof r === "object" ? Object.values(r).filter(v => v === "").length : 0), 0);
      if (emptyStrings > 0) warns.push({ level: "info", message: `${emptyStrings.toLocaleString()} empty string values found` });
      setWarnings(warns);
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid JSON"); } finally { setLoading(false); }
  }

  function handleFile(f: File) {
    const stored = addFile(f);
    setStoredFileId(stored.id);
    processFile(f);
  }

  function handlePaste(text: string) {
    handleFile(new File([new Blob([text], { type: "application/json" })], "pasted_data.json", { type: "application/json" }));
  }

  function handleSample() {
    const sample = JSON.stringify([
      { id: 1, name: "Alice", email: "alice@example.com", address: { city: "Portland", zip: "97201" }, tags: ["dev", "data"], active: true },
      { id: 2, name: "Bob", email: "bob@example.com", address: { city: "Seattle", zip: "98101" }, tags: ["ops"], active: false },
      { id: 3, name: "Charlie", email: null, address: { city: "Austin" }, tags: [], active: true },
    ], null, 2);
    handleFile(new File([new Blob([sample], { type: "application/json" })], "sample.json", { type: "application/json" }));
  }

  const totalValues = Object.values(valueTypes).reduce((a, b) => a + b, 0);
  const done = file && identity && structure && !loading;

  return (
    <ToolPage icon={Search} title="JSON Inspector" description="Analyze JSON file structure, schema consistency, and data patterns." metaDescription={getToolMetaDescription("json-inspector")} seoContent={getToolSeo("json-inspector")}>
      <div className="space-y-6">
        {!file && !loading && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["file", "paste"] as const).map((m) => (
                <button key={m} onClick={() => setInputMode(m)} className={`px-3 py-1 text-xs font-bold border-2 border-border transition-colors ${inputMode === m ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}>
                  {m === "file" ? "Upload File" : "Paste Data"}
                </button>
              ))}
            </div>
            {inputMode === "file" ? (
              <div className="space-y-3">
                <DropZone accept={[".json", ".jsonl", ".ndjson"]} onFile={handleFile} label="Drop a JSON or JSONL file" />
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSample}>
                    <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
                  </Button>
                </div>
              </div>
            ) : (
              <PasteInput onSubmit={handlePaste} placeholder='Paste JSON here...' label="Paste JSON data" accept={[".json"]} onFile={handleFile} />
            )}
          </div>
        )}

        {loading && <LoadingState message="Analyzing JSON structure..." />}
        {error && <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive font-mono">{error}</div>}

        {done && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} />
              <Button variant="outline" onClick={() => { setFile(null); setIdentity(null); setStructure(null); setSchemas([]); setValueTypes({}); setKeys([]); setWarnings([]); }}>New file</Button>
            </div>

            {/* File Identity */}
            <div className="border-2 border-border">
              <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">File Identity</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                {[["File name", file.name], ["File size", formatBytes(file.size)], ["Encoding", identity.encoding], ["Format", identity.format], ["Root type", identity.rootType], ["Records", identity.recordCount.toLocaleString()]].map(([k, v]) => (
                  <div key={k} className="bg-card px-4 py-3"><div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div><div className="text-sm font-medium font-mono">{v}</div></div>
                ))}
              </div>
            </div>

            {/* Structure Analysis */}
            <div className="border-2 border-border">
              <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Structure Analysis</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                {[
                  ["Unique keys", String(structure.totalKeys)],
                  ["Max nesting depth", `${structure.maxDepth} level${structure.maxDepth !== 1 ? "s" : ""}`],
                  ["Nested objects", structure.hasNestedObjects.length > 0 ? structure.hasNestedObjects.join(", ") : "None"],
                  ["Nested arrays", structure.hasNestedArrays.length > 0 ? structure.hasNestedArrays.join(", ") : "None"],
                  ["Key naming", structure.keyNaming],
                ].map(([k, v]) => (
                  <div key={k} className="bg-card px-4 py-3"><div className="text-[10px] text-muted-foreground font-bold uppercase">{k}</div><div className="text-sm font-medium font-mono">{v}</div></div>
                ))}
              </div>
            </div>

            {/* Schema Consistency */}
            {schemas.length > 0 && (
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Schema Consistency</span>
                  <span className={`text-xs font-bold ${schemas.length === 1 ? "text-primary" : "text-amber-500"}`}>
                    {schemas.length === 1 ? "✓ Consistent" : `⚠ ${schemas.length} different key sets`}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {schemas.map((s, i) => (
                    <div key={i} className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">Key set {String.fromCharCode(65 + i)}</span>
                        <span className="text-muted-foreground">({s.count.toLocaleString()} records — {s.percent.toFixed(1)}%)</span>
                      </div>
                      <div className="font-mono text-muted-foreground">{s.keys.join(", ")}</div>
                      {s.missing && <div className="text-amber-500 mt-1">⚠ Missing: {s.missing.join(", ")}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Value Type Distribution */}
            {totalValues > 0 && (
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Value Types</div>
                <div className="p-4 space-y-2">
                  {Object.entries(valueTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const pct = (count / totalValues) * 100;
                    return (
                      <div key={type} className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-mono font-bold">{type}</span>
                        <div className="flex-1 h-4 bg-muted/30 border border-border">
                          <div className="h-full bg-foreground/80" style={{ width: `${Math.max(pct, 1)}%` }} />
                        </div>
                        <span className="w-20 text-right text-muted-foreground">{pct.toFixed(1)}% ({count.toLocaleString()})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Inventory */}
            {keys.length > 0 && (
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">All Keys ({keys.length})</div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border bg-muted/30">{["Key path", "Type", "Present", "Null", "Sample"].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.path} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-mono font-medium">{k.path}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{k.type}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{k.present}%</td>
                          <td className={`px-3 py-1.5 font-mono ${k.nullCount > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{k.nullCount}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground max-w-[150px] truncate">{k.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="border-2 border-border">
                <div className="border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Issues ({warnings.length})</div>
                <div className="divide-y divide-border/50">
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      {w.level === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" /> : <Info className="h-4 w-4 text-primary flex-shrink-0" />}
                      <div><div className="text-sm font-medium">{w.message}</div>{w.detail && <div className="text-xs text-muted-foreground mt-0.5">{w.detail}</div>}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <CrossToolLinks format="json" fileId={storedFileId ?? undefined} />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
