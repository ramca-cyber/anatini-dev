import { useState } from "react";
import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { ArrowRight, Search, Lock } from "lucide-react";
import { toolCategories, toolCount, featureListString } from "@/lib/tool-registry";

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

function ToolRow({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) {
  return (
    <Link
      to={path}
      className="group flex items-center gap-2 border border-border px-3 py-2 bg-card text-sm font-medium transition-all hover:bg-secondary hover:-translate-y-px"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
      <span className="truncate">{label}</span>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Compact Hero */}
      <section className="border-b-2 border-border">
        <div className="container py-10 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="inline-block border-2 border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              {toolCount} Tools · 100% Offline · Zero Tracking
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              Data tools that run{" "}
              <span className="border-b-4 border-foreground">in your browser.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base leading-relaxed">
              Convert, query, profile and transform datasets with DuckDB-WASM.
              No uploads, no servers, no accounts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/sql-playground"
                className="inline-flex items-center gap-2 border-2 border-border bg-foreground px-4 py-2 text-sm font-bold text-background transition-all hover:shadow-xs active:shadow-none"
              >
                SQL Playground <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="#tools"
                className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:shadow-xs active:shadow-none"
              >
                Browse Tools
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tools — compact grid */}
      <section id="tools" className="border-b-2 border-border">
        <div className="container py-10">
          {/* Search */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tools… (⌘K)"
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
            <div key={cat.label} className={i < filteredCategories.length - 1 ? "mb-8" : ""}>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</h2>
              <div className="mb-3 h-0.5 w-10 bg-foreground" />
              <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {cat.tools.map((t) => <ToolRow key={t.path} {...t} />)}
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

      {/* Privacy strip */}
      <section className="bg-foreground text-background">
        <div className="container py-10 flex flex-col items-center text-center gap-3">
          <Lock className="h-6 w-6" />
          <h2 className="text-xl font-bold">Your data stays yours.</h2>
          <p className="max-w-lg text-sm opacity-80 leading-relaxed">
            Every tool runs via WebAssembly in your browser tab. No server. No uploads.
            Close the tab, and your data is gone forever.
          </p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50">
            No accounts · No cookies · No analytics
          </p>
        </div>
      </section>
    </>
  );
}
