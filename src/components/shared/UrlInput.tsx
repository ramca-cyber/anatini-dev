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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder={placeholder || "https://example.com/data.csv"}
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
      <p className="text-[10px] text-muted-foreground">
        The file is fetched directly in your browser — nothing is sent to any server.
        CORS restrictions may prevent loading from some domains.
      </p>
    </div>
  );
}
