import { useState, useMemo } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Braces, Download, Eye, Columns, Copy, Check, ArrowRight } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { DataTable } from "@/components/shared/DataTable";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { PasteInput } from "@/components/shared/PasteInput";
import { UrlInput } from "@/components/shared/UrlInput";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes, warnLargeFile } from "@/lib/duckdb-helpers";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { getSampleJSON } from "@/lib/sample-data";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface StructureInfo {
  rootType: string;
  objectCount: number;
  depth: number;
  paths: { path: string; type: string }[];
}

function analyzeJSON(parsed: any): StructureInfo {
  const isArray = Array.isArray(parsed);
  const rootObj = isArray ? parsed[0] : parsed;
  const objectCount = isArray ? parsed.length : 1;
  const paths: { path: string; type: string }[] = [];
  let maxDepth = 0;

  function walk(obj: any, prefix: string, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (obj === null || obj === undefined || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      paths.push({ path: prefix || "root", type: `Array[${obj.length}]` });
      if (obj.length > 0 && typeof obj[0] === "object") walk(obj[0], prefix + "[]", depth + 1);
      return;
    }
    for (const [key, val] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (val === null || val === undefined) paths.push({ path: p, type: "null" });
      else if (Array.isArray(val)) {
        paths.push({ path: p, type: `Array[${val.length}]` });
        if (val.length > 0 && typeof val[0] === "object") walk(val[0], p + "[]", depth + 1);
      } else if (typeof val === "object") walk(val, p, depth + 1);
      else paths.push({ path: p, type: typeof val });
    }
  }

  if (rootObj && typeof rootObj === "object") walk(rootObj, "", 1);
  return { rootType: isArray ? `Array of ${objectCount} objects` : "Single object", objectCount, depth: maxDepth, paths };
}

function flattenObject(obj: any, sep: string, prefix = "", maxDepth: number = Infinity, currentDepth: number = 0, preserveNulls: boolean = true, arrayHandling: string = "index"): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}${sep}${key}` : key;
    if (val === null || val === undefined) {
      if (preserveNulls) result[newKey] = val;
    } else if (Array.isArray(val)) {
      if (currentDepth >= maxDepth) {
        result[newKey] = arrayHandling === "stringify" ? JSON.stringify(val) : val.join(", ");
      } else if (val.length === 0 || typeof val[0] !== "object") {
        if (arrayHandling === "stringify") result[newKey] = JSON.stringify(val);
        else if (arrayHandling === "bracket") {
          val.forEach((item, i) => { result[`${newKey}[${i}]`] = item; });
        } else {
          val.forEach((item, i) => { result[`${newKey}${sep}${i}`] = item; });
        }
      } else {
        result[newKey] = val;
      }
    } else if (typeof val === "object") {
      if (currentDepth >= maxDepth) {
        result[newKey] = JSON.stringify(val);
      } else {
        Object.assign(result, flattenObject(val, sep, newKey, maxDepth, currentDepth + 1, preserveNulls, arrayHandling));
      }
    } else {
      result[newKey] = val;
    }
  }
  return result;
}

function flattenData(data: any[], sep: string, maxDepth: number, preserveNulls: boolean, arrayHandling: string): { columns: string[]; rows: any[][]; nestedRemoved: number } {
  let nestedRemoved = 0;

  function expandAndFlatten(item: any): Record<string, any>[] {
    const flat = flattenObject(item, sep, "", maxDepth, 0, preserveNulls, arrayHandling);
    const arrayKeys = Object.keys(flat).filter(k => Array.isArray(flat[k]));
    if (arrayKeys.length === 0) return [flat];
    nestedRemoved += arrayKeys.length;
    const key = arrayKeys[0];
    const arr = flat[key] as any[];
    delete flat[key];
    return arr.flatMap((el) => {
      const expanded = typeof el === "object" && el !== null ? flattenObject(el, sep, key, maxDepth, 0, preserveNulls, arrayHandling) : { [key]: el };
      const merged = { ...flat, ...expanded };
      const remaining = Object.keys(merged).filter(k => Array.isArray(merged[k]));
      if (remaining.length > 0) return expandAndFlatten(merged);
      return [merged];
    });
  }

  const allRows = data.flatMap(expandAndFlatten);
  const colSet = new Set<string>();
  allRows.forEach(r => Object.keys(r).forEach(k => colSet.add(k)));
  const columns = Array.from(colSet);
  const rows = allRows.map(r => columns.map(c => r[c] ?? null));
  return { columns, rows, nestedRemoved };
}

export default function FlattenPage() {
  const { addFile } = useFileStore();
  const [file, setFile] = useState<File | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structure, setStructure] = useState<StructureInfo | null>(null);
  const [naming, setNaming] = useState<"dot" | "underscore">("underscore");
  const [flattened, setFlattened] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [showSideBySide, setShowSideBySide] = useState(true);
  const [inputMode, setInputMode] = useState<"file" | "paste" | "url">("file");
  const [maxDepth, setMaxDepth] = useState<number>(Infinity);
  const [arrayHandling, setArrayHandling] = useState<"index" | "bracket" | "stringify">("index");
  const [preserveNulls, setPreserveNulls] = useState(true);
  const [flatStats, setFlatStats] = useState<{ depth: number; keys: number; nested: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useAutoLoadFile(handleFile);

  async function handleFile(f: File) {
    warnLargeFile(f);
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    setFlattened(null);
    setStructure(null);
    setFlatStats(null);
    try {
      const text = await f.text();
      setRawText(text);
      const p = JSON.parse(text);
      setParsed(p);
      setStructure(analyzeJSON(p));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read JSON");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(text: string) {
    const blob = new Blob([text], { type: "application/json" });
    const f = new File([blob], "pasted_data.json", { type: "application/json" });
    handleFile(f);
  }

  function handleFlatten() {
    if (!parsed) return;
    setLoading(true);
    setError(null);
    try {
      const data = Array.isArray(parsed) ? parsed : [parsed];
      const sep = naming === "dot" ? "." : "_";
      const result = flattenData(data, sep, maxDepth, preserveNulls, arrayHandling);
      setFlattened({ columns: result.columns, rows: result.rows });
      setFlatStats({ depth: structure?.depth ?? 0, keys: result.columns.length, nested: result.nestedRemoved });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to flatten JSON");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!flattened) return;
    const header = flattened.columns.map(c => `"${c.replace(/"/g, '""')}"`).join(",");
    const rows = flattened.rows.map(r =>
      r.map(v => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    );
    downloadBlob([header, ...rows].join("\n"), file!.name.replace(/\.[^.]+$/, "") + "_flat.csv", "text/csv");
  }

  async function handleCopyFlat() {
    if (!flattened) return;
    const data = Array.isArray(parsed) ? parsed : [parsed];
    const sep = naming === "dot" ? "." : "_";
    const flatArr = data.map(item => flattenObject(item, sep, "", maxDepth, 0, preserveNulls, arrayHandling));
    await navigator.clipboard.writeText(JSON.stringify(flatArr, null, 2));
    setCopied(true);
    toast({ title: "Flat JSON copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  const truncatedJson = useMemo(() => {
    if (!rawText) return "";
    return rawText.length > 3000 ? rawText.slice(0, 3000) + "\n... (truncated)" : rawText;
  }, [rawText]);

  return (
    <ToolPage icon={Braces} title="JSON Flattener" description="Flatten nested JSON/JSONL into tabular format for analysis."
      pageTitle="Flatten JSON Online — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("json-flattener")} seoContent={getToolSeo("json-flattener")}>
      <div className="space-y-6">
        {!file && (
          <div className="space-y-4">
            <ToggleButton
              options={[{ label: "Upload File", value: "file" }, { label: "Paste Data", value: "paste" }, { label: "From URL", value: "url" }]}
              value={inputMode}
              onChange={setInputMode}
            />

            {inputMode === "file" ? (
              <DropZone
                accept={[".json", ".jsonl"]}
                onFile={handleFile}
                label="Drop a JSON or JSONL file"
                sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleJSON()) }}
              />
            ) : inputMode === "paste" ? (
              <PasteInput
                onSubmit={handlePaste}
                placeholder='Paste JSON here... e.g. {"name": "Alice", "address": {"city": "Portland"}}'
                label="Paste JSON data"
                accept={[".json", ".jsonl"]}
                onFile={handleFile}
              />
            ) : (
              <UrlInput onFile={handleFile} accept={[".json", ".jsonl"]} placeholder="https://example.com/data.json" label="Load JSON from URL" />
            )}
          </div>
        )}

        {/* Structure Detection */}
        {file && structure && !flattened && (
          <div className="space-y-4">
            <FileInfo name={file.name} size={formatBytes(file.size)} />
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Structure Detected</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-muted-foreground">Root type</div><div className="text-sm font-medium">{structure.rootType}</div></div>
                <div><div className="text-xs text-muted-foreground">Nesting depth</div><div className="text-sm font-medium">{structure.depth} levels</div></div>
                <div><div className="text-xs text-muted-foreground">Detected paths</div><div className="text-sm font-medium">{structure.paths.length}</div></div>
              </div>
              <div className="max-h-[200px] overflow-auto rounded border border-border/50 bg-background">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border/50"><th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Path</th><th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Type</th></tr></thead>
                  <tbody>
                    {structure.paths.map((p, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-1 font-mono text-foreground">{p.path}</td>
                        <td className="px-3 py-1 font-mono text-muted-foreground">{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold">Naming:</span>
                  <ToggleButton
                    options={[{ label: "address_city", value: "underscore" }, { label: "address.city", value: "dot" }]}
                    value={naming}
                    onChange={setNaming}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold">Max depth:</span>
                  <select value={maxDepth === Infinity ? "" : maxDepth} onChange={(e) => setMaxDepth(e.target.value ? Number(e.target.value) : Infinity)} className="border border-border bg-background px-2 py-1 text-xs">
                    <option value="">Unlimited</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold">Arrays:</span>
                  <select value={arrayHandling} onChange={(e) => setArrayHandling(e.target.value as any)} className="border border-border bg-background px-2 py-1 text-xs">
                    <option value="index">Index notation (key_0)</option>
                    <option value="bracket">Bracket notation (key[0])</option>
                    <option value="stringify">Stringify</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={preserveNulls} onChange={(e) => setPreserveNulls(e.target.checked)} className="rounded" />
                  <span className="font-bold">Preserve null values</span>
                </label>
              </div>

              <Button onClick={handleFlatten} disabled={loading}>
                <Braces className="h-4 w-4 mr-1" /> Flatten
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {file && flattened && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} rows={flattened.rows.length} columns={flattened.columns.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format="json" />}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSideBySide(!showSideBySide)} title="Toggle side-by-side view">
                  <Columns className="h-4 w-4 mr-1" /> {showSideBySide ? "Table only" : "Side-by-side"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyFlat}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy JSON"}
                </Button>
                <Link to="/json-to-csv">
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-1" /> Convert to CSV
                  </Button>
                </Link>
                <Button onClick={handleDownload}><Download className="h-4 w-4 mr-1" /> Download CSV</Button>
                <Button variant="outline" onClick={() => { setFile(null); setFlattened(null); setStructure(null); setParsed(null); setRawText(""); setFlatStats(null); }}>New file</Button>
              </div>
            </div>

            {/* Flattening stats */}
            {flatStats && (
              <div className="border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong>Depth:</strong> {flatStats.depth} → 1 · <strong>Keys:</strong> {flatStats.keys} · <strong>Nested objects removed:</strong> {flatStats.nested}
              </div>
            )}

            {showSideBySide ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Original JSON</h3>
                  <pre className="rounded-lg border border-border bg-card p-4 font-mono text-xs text-foreground overflow-auto max-h-[500px] whitespace-pre-wrap">
                    {truncatedJson}
                  </pre>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Flattened ({flattened.rows.length} rows × {flattened.columns.length} cols)</h3>
                  <DataTable columns={flattened.columns} rows={flattened.rows} types={flattened.columns.map(() => "VARCHAR")} className="max-h-[500px]" />
                </div>
              </div>
            ) : (
              <DataTable columns={flattened.columns} rows={flattened.rows} types={flattened.columns.map(() => "VARCHAR")} className="max-h-[500px]" />
            )}
          </div>
        )}

        {file && storedFileId && <CrossToolLinks format="json" fileId={storedFileId} excludeRoute="/json-flattener" />}

        {loading && <LoadingState message="Processing JSON..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      </div>
    </ToolPage>
  );
}
