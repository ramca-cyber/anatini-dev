import { Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>100% offline · No data leaves your browser</span>
      </div>
    </footer>
  );
}
