import { useState } from "react";
import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { ArrowRight, Search, Zap, Lock, Globe, Shield } from "lucide-react";
import { toolCategories, toolCount, featureListString } from "@/lib/tool-registry";

const features = [
  { icon: Zap, title: "WebAssembly Speed", description: "DuckDB compiled to WASM — analytical queries in milliseconds, not seconds." },
  { icon: Lock, title: "Zero Data Leaks", description: "No uploads. No servers. No tracking. Your files never leave your machine." },
  { icon: Globe, title: "No Install Needed", description: "Works in any modern browser. No extensions, no CLI, no accounts required." },
  { icon: Shield, title: "Free Forever", description: `All ${toolCount} tools, no paywalls. Open source philosophy, closed-source simplicity.` },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Anatini.dev",
  "url": "https://anatini.dev",
  "description": `Free, offline browser-powered data tools. Convert, query, profile and transform datasets using DuckDB-WASM.`,
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": featureListString,
};

function ToolCard({ path, label, description, icon: Icon }: { path: string; label: string; description: string; icon: React.ElementType }) {
  return (
    <Link
      to={path}
      className="group flex flex-col gap-2 border-2 border-border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5 active:shadow-none active:translate-y-0"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-foreground" />
        <h3 className="text-sm font-bold tracking-tight">{label}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-auto flex items-center gap-1 pt-1 text-xs font-bold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function Index() {
  const [search, setSearch] = useState("");
  const lowerSearch = search.toLowerCase();

  const filteredCategories = toolCategories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) =>
          t.label.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch)
      ),
    }))
    .filter((cat) => cat.tools.length > 0);

  return (
    <>
      <PageMeta
        title="Anatini.dev — Free, Offline Data Tools for Developers"
        description={`${toolCount} free, offline data tools powered by DuckDB-WASM. Convert CSV, Parquet, JSON, Excel, XML, TOML. Query with SQL. Profile datasets. All in your browser.`}
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b-2 border-border">
        <div className="container py-12 md:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="inline-block border-2 border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
             {toolCount} Tools · 100% Offline · Zero Tracking
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Data tools that run
              <br />
              <span className="inline-block border-b-4 border-foreground">entirely in your browser.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg leading-relaxed">
              Convert, query, profile and transform datasets with DuckDB-WASM.
              No uploads, no servers, no accounts. Close the tab, your data is gone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/sql-playground"
                className="inline-flex items-center gap-2 border-2 border-border bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-all hover:shadow-xs active:shadow-none"
              >
                Try SQL Playground <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#tools"
                className="inline-flex items-center gap-2 border-2 border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:shadow-xs active:shadow-none"
              >
                Browse All Tools
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="border-b-2 border-border">
        <div className="container py-16">
          {/* Search bar */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tools… (or press ⌘K)"
                className="w-full border-2 border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            {search && (
              <span className="text-xs text-muted-foreground">
                {filteredCategories.reduce((s, c) => s + c.tools.length, 0)} results
              </span>
            )}
          </div>

          {filteredCategories.map((cat, i) => (
            <div key={cat.label} className={i < filteredCategories.length - 1 ? "mb-12" : ""}>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</h2>
              <div className="mb-4 h-0.5 w-12 bg-foreground" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cat.tools.map((t) => <ToolCard key={t.path} {...t} />)}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No tools match "{search}"
            </div>
          )}
        </div>
      </section>

      {/* Why Anatini */}
      <section className="border-b-2 border-border">
        <div className="container py-16">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Why Anatini?</h2>
          <div className="mb-8 h-0.5 w-12 bg-foreground" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="border-2 border-border bg-card p-5"
              >
                <f.icon className="mb-3 h-6 w-6 text-foreground" />
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy CTA */}
      <section className="border-b-2 border-border bg-foreground text-background">
        <div className="container py-16 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8" />
          <h2 className="text-2xl font-bold mb-3">Your data stays yours.</h2>
          <p className="mx-auto max-w-lg text-sm opacity-80 leading-relaxed">
            Every tool runs via WebAssembly in your browser tab. There is no server.
            No file ever leaves your machine. Close the tab, and your data is gone forever.
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest opacity-50">
            No accounts · No cookies · No analytics
          </p>
        </div>
      </section>
    </>
  );
}
