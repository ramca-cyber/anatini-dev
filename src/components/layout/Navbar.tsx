import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const toolGroups = [
  {
    label: "Converters",
    tools: [
      { path: "/csv-to-parquet", label: "CSV → Parquet" },
      { path: "/parquet-to-csv", label: "Parquet → CSV" },
      { path: "/csv-to-json", label: "CSV → JSON" },
      { path: "/json-to-csv", label: "JSON → CSV" },
      { path: "/json-to-parquet", label: "JSON → Parquet" },
      { path: "/parquet-to-json", label: "Parquet → JSON" },
      { path: "/excel-to-csv", label: "Excel → CSV" },
      { path: "/csv-to-excel", label: "CSV → Excel" },
    ],
  },
  {
    label: "Viewers & Formatters",
    tools: [
      { path: "/csv-viewer", label: "CSV Viewer" },
      { path: "/parquet-viewer", label: "Parquet Viewer" },
      { path: "/json-formatter", label: "JSON Formatter" },
    ],
  },
  {
    label: "Inspectors",
    tools: [
      { path: "/csv-inspector", label: "CSV Inspector" },
      { path: "/json-inspector", label: "JSON Inspector" },
      { path: "/parquet-inspector", label: "Parquet Inspector" },
    ],
  },
  {
    label: "Analysis & SQL",
    tools: [
      { path: "/sql-playground", label: "SQL Playground" },
      { path: "/data-profiler", label: "Data Profiler" },
      { path: "/json-flattener", label: "JSON Flattener" },
      { path: "/schema-generator", label: "Schema Generator" },
      { path: "/csv-to-sql", label: "CSV → SQL" },
      { path: "/dataset-diff", label: "Dataset Diff" },
      { path: "/data-sampler", label: "Data Sampler" },
      { path: "/deduplicator", label: "Deduplicator" },
    ],
  },
];

const allTools = toolGroups.flatMap((g) => g.tools);

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isToolPage = allTools.some((t) => t.path === location.pathname);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <img src={logoImg} alt="SwiftDataTools logo" className="h-6 w-6" />
          <span className="text-lg tracking-tight">Anatini.dev</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isToolPage
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Tools <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {toolGroups.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </div>
                  {group.tools.map((t) => (
                    <DropdownMenuItem key={t.path} asChild>
                      <Link
                        to={t.path}
                        className={location.pathname === t.path ? "text-primary font-medium" : ""}
                      >
                        {t.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/blog"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              location.pathname.startsWith("/blog")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Blog
          </Link>

          <Link
            to="/about"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === "/about"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            About
          </Link>
        </div>

        {/* Privacy badge + mobile toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <Shield className="h-3 w-3" />
            100% Offline
          </div>
          <ThemeToggle />

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
            {toolGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.tools.map((t) => (
                  <Link
                    key={t.path}
                    to={t.path}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors block ${
                      location.pathname === t.path
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            ))}
            <Link
              to="/blog"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Blog
            </Link>
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
