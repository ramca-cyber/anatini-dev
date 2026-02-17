import { useState, useCallback, useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Hash, Copy, Upload } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { toast } from "@/hooks/use-toast";
import SparkMD5 from "spark-md5";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

async function computeHash(data: ArrayBuffer, algo: Algorithm): Promise<string> {
  if (algo === "MD5") {
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(data);
    return spark.end();
  }
  const hashBuffer = await crypto.subtle.digest(algo, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const ALGO_BITS: Record<Algorithm, number> = {
  "MD5": 128,
  "SHA-1": 160,
  "SHA-256": 256,
  "SHA-384": 384,
  "SHA-512": 512,
};

export default function HashGeneratorPage() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [allHashes, setAllHashes] = useState<{ algo: Algorithm; hash: string }[] | null>(null);

  const hashText = useCallback(async () => {
    setError(null);
    if (!input.trim()) { setOutput(""); setAllHashes(null); return; }
    try {
      const encoded = new TextEncoder().encode(input);
      const hex = await computeHash(encoded.buffer, algorithm);
      setOutput(hex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hash failed");
      setOutput("");
    }
  }, [input, algorithm]);

  const hashFile = useCallback(async () => {
    if (!fileBuffer) return;
    setError(null);
    try {
      const hex = await computeHash(fileBuffer, algorithm);
      setOutput(hex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hash failed");
      setOutput("");
    }
  }, [fileBuffer, algorithm]);

  useEffect(() => {
    if (mode === "text") hashText();
    else if (fileBuffer) hashFile();
  }, [mode, hashText, hashFile, fileBuffer]);

  async function computeAll() {
    const data = mode === "text" ? new TextEncoder().encode(input).buffer : fileBuffer;
    if (!data) return;
    const algos: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    const results = await Promise.all(algos.map(async (a) => ({ algo: a, hash: await computeHash(data, a) })));
    setAllHashes(results);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setAllHashes(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBuffer(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <ToolPage icon={Hash} title="Hash Generator" description="Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes from text or files." pageTitle="Hash Generator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("hash-generator")} seoContent={getToolSeo("hash-generator")}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setMode("text"); setInput("The quick brown fox jumps over the lazy dog"); setAllHashes(null); }}>Load Sample</Button>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Input</label>
              <ToggleButton
                options={[{ label: "Text", value: "text" }, { label: "File", value: "file" }]}
                value={mode}
                onChange={(v) => { setMode(v as "text" | "file"); setOutput(""); setError(null); setAllHashes(null); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Algorithm</label>
              <ToggleButton
                options={[
                  { label: "MD5", value: "MD5" },
                  { label: "SHA-1", value: "SHA-1" },
                  { label: "SHA-256", value: "SHA-256" },
                  { label: "SHA-384", value: "SHA-384" },
                  { label: "SHA-512", value: "SHA-512" },
                ]}
                value={algorithm}
                onChange={(v) => { setAlgorithm(v as Algorithm); setAllHashes(null); }}
              />
            </div>
          </div>
        </div>

        {mode === "text" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text Input</label>
              <button onClick={() => { setInput(""); setAllHashes(null); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setAllHashes(null); }}
              placeholder="Type or paste text to hash…"
              className="w-full h-[200px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-border p-8 text-center">
            <label className="cursor-pointer flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{fileName ? fileName : "Click to select a file"}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="space-y-2 border-2 border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{algorithm} Hash</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={computeAll}>
                  All Algorithms
                </Button>
              </div>
            </div>
            <pre className="bg-muted/30 border border-border p-3 text-xs font-mono break-all select-all">{output}</pre>
            <p className="text-xs text-muted-foreground">{output.length} hex characters · {ALGO_BITS[algorithm]} bits</p>
          </div>
        )}

        {/* All hashes comparison */}
        {allHashes && (
          <div className="border border-border bg-card p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">All Algorithms</h3>
            {allHashes.map(({ algo, hash }) => (
              <div key={algo} className="flex items-start gap-3 py-1 border-b border-border last:border-0">
                <span className="text-xs font-bold text-muted-foreground w-16 shrink-0 pt-0.5">{algo}</span>
                <code className="text-xs font-mono break-all flex-1 select-all">{hash}</code>
                <button onClick={() => { navigator.clipboard.writeText(hash); toast({ title: `${algo} hash copied` }); }} className="shrink-0">
                  <Copy className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
