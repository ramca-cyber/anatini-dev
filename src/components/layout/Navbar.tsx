import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { navToolGroups, allTools } from "@/lib/tool-registry";

const allToolPaths = allTools.map((t) => t.path);

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isToolPage = allToolPaths.includes(location.pathname);

  // Close mega-menu on route change
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mega-menu on click outside
  useEffect(() => {
    if (!megaOpen) return;
    function onClick(e: MouseEvent) {
      if (
        megaRef.current && !megaRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setMegaOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [megaOpen]);

  // Close on Escape
  useEffect(() => {
    if (!megaOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMegaOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = menu.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <img src={logoImg} alt="Anatini.dev logo" className="h-6 w-6" />
          <span className="text-lg tracking-tight">Anatini.dev</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <button
            ref={triggerRef}
            onClick={() => setMegaOpen((o) => !o)}
            className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isToolPage || megaOpen
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Tools <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
          </button>

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
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop mega-menu */}
      {megaOpen && (
        <div
          ref={megaRef}
          className="hidden md:block border-t border-border bg-background shadow-lg"
        >
          <div className="container py-6">
            <div className="grid grid-cols-5 gap-6">
              {navToolGroups.map((group) => (
                <div key={group.label}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {group.label}
                  </h4>
                  <ul className="space-y-1">
                    {group.tools.map((t) => (
                      <li key={t.path}>
                        <Link
                          to={t.path}
                          className={`block text-xs py-1 transition-colors ${
                            location.pathname === t.path
                              ? "text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileMenuRef} className="border-t border-border bg-background p-4 md:hidden max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navToolGroups.map((group) => (
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
