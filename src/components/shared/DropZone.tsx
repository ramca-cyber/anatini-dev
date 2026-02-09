import { useState, useCallback, useRef } from "react";
import { Upload, Lock } from "lucide-react";

interface DropZoneProps {
  accept: string[];
  onFile: (file: File) => void;
  label?: string;
}

export function DropZone({ accept, onFile, label = "Drop a file here" }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all ${
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
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
