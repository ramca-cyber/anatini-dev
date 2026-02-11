import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  onFile: (file: File) => void;
  accept?: string[];
  placeholder?: string;
  label?: string;
}

export function UrlInput({ onFile, accept, placeholder, label }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const blob = await res.blob();
      const urlObj = new URL(url.trim());
      const segments = urlObj.pathname.split("/");
      let filename = segments[segments.length - 1] || "downloaded_file";
      if (!filename.includes(".") && accept?.length) {
        filename += accept[0];
      }
      const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
      onFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{label}</label>
      )}
      <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-muted-foreground">
        <strong className="text-amber-600 dark:text-amber-400">⚠ CORS note:</strong> Files are fetched directly in your browser — nothing is sent to any server.
        Some domains block cross-origin requests. Try GitHub raw URLs or public dataset links.
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder={placeholder || "https://raw.githubusercontent.com/user/repo/main/data.csv"}
            className="w-full h-10 pl-9 pr-3 border-2 border-border bg-background text-sm font-mono focus:outline-none focus:border-primary transition-colors"
            disabled={loading}
          />
        </div>
        <Button onClick={handleFetch} disabled={loading || !url.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
        </Button>
      </div>
      {error && (
        <div className="text-xs text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </div>
      )}
      <div className="text-[10px] text-muted-foreground space-y-1">
        <p className="font-medium">Example URLs that work:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><code>https://raw.githubusercontent.com/...</code> — GitHub raw files</li>
          <li><code>https://data.gov/...</code> — US government open data</li>
          <li><code>https://storage.googleapis.com/...</code> — Public GCS buckets</li>
        </ul>
      </div>
    </div>
  );
}
