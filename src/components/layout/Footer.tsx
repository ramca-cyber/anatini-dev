import { Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>Your data never leaves your browser</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://duckdb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Powered by DuckDB <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-border">·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border">·</span>
            <Link to="/" className="hover:text-foreground transition-colors">
              All Tools
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Anatini.dev
          </p>
        </div>
      </div>
    </footer>
  );
}
