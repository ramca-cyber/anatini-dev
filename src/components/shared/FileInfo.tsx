import { Loader2 } from "lucide-react";

interface FileInfoProps {
  name: string;
  size: string;
  rows?: number;
  columns?: number;
}

export function FileInfo({ name, size, rows, columns }: FileInfoProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
      <span className="font-mono font-medium text-foreground">{name}</span>
      <span className="text-muted-foreground">{size}</span>
      {rows !== undefined && <span className="text-muted-foreground">{rows.toLocaleString()} rows</span>}
      {columns !== undefined && <span className="text-muted-foreground">{columns} cols</span>}
    </div>
  );
}

export function LoadingState({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/20 p-8">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
