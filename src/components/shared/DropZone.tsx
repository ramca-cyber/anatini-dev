import { useState, useCallback, useRef } from "react";
import { Upload, Lock } from "lucide-react";

interface DropZoneProps {
  accept: string[];
  onFile: (file: File) => void;
  label?: string;
  maxSizeMB?: number;
  sampleAction?: { label: string; onClick: () => void };
}

export function DropZone({ accept, onFile, label = "Drop a file here", maxSizeMB = 200, sampleAction }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkAndPass = useCallback((file: File) => {
    const mb = file.size / (1024 * 1024);
    if (mb > maxSizeMB) {
      setSizeWarning(`This file is ${mb.toFixed(0)} MB — large files may slow your browser.`);
    } else {
      setSizeWarning(null);
    }
    onFile(file);
  }, [onFile, maxSizeMB]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) checkAndPass(file);
    },
    [checkAndPass]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) checkAndPass(file);
    },
    [checkAndPass]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 md:p-10 transition-all ${
        dragOver
          ? "border-primary bg-primary/5 shadow-[0_0_30px_-5px_hsl(187_80%_55%/0.2)]"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <Upload className={`h-8 w-8 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-center">
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Accepts {accept.join(", ")} · Click or drag
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
        <Lock className="h-3 w-3" />
        Processed locally — never uploaded
      </div>
      {sampleAction && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); sampleAction.onClick(); }}
          className="mt-1 inline-flex items-center gap-1.5 border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
        >
          {sampleAction.label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        onChange={handleChange}
        className="hidden"
      />
      {sizeWarning && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
          <span>⚠️</span> {sizeWarning}
        </div>
      )}
    </div>
  );
}
