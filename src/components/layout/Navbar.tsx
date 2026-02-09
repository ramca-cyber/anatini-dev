import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bird, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  { path: "/convert", label: "Convert" },
  { path: "/flatten", label: "Flatten" },
  { path: "/sql", label: "SQL" },
  { path: "/profiler", label: "Profiler" },
  { path: "/diff", label: "Diff" },
  { path: "/schema", label: "Schema" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Bird className="h-6 w-6 text-[#FFD43B]" />
          <span className="text-lg tracking-tight">DuckTools</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {tools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === t.path
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Privacy badge + mobile toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <Shield className="h-3 w-3" />
            100% Offline
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {tools.map((t) => (
              <Link
                key={t.path}
                to={t.path}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === t.path
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            ))}
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
