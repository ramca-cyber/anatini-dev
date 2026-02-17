import { Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { navToolGroups } from "@/lib/tool-registry";

const FOOTER_TOOL_LIMIT = 5;

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container py-10">
        {/* Tool grid — top 5 per category */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5 mb-8">
          {navToolGroups.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{group.label}</h4>
              <ul className="space-y-1.5">
                {group.tools.slice(0, FOOTER_TOOL_LIMIT).map((t) => (
                  <li key={t.path}>
                    <Link to={t.path} className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">
                      {t.label}
                    </Link>
                  </li>
                ))}
                {group.tools.length > FOOTER_TOOL_LIMIT && (
                  <li>
                    <Link to="/#tools" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                      View all {group.tools.length} →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col items-center gap-4 text-sm text-muted-foreground md:flex-row md:justify-between">
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
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <span className="text-border">·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span className="text-border">·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
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
