import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  ArrowRight, FileSpreadsheet, Braces, Terminal, BarChart3, Database,
  FileJson, Table, Eye, Code, FileText, Zap, Lock, Globe, Shield,
  GitCompare,
} from "lucide-react";

const converters = [
  { path: "/csv-to-parquet", title: "CSV → Parquet", description: "Columnar format with compression options.", icon: FileSpreadsheet },
  { path: "/parquet-to-csv", title: "Parquet → CSV", description: "Export Parquet back to CSV.", icon: FileSpreadsheet },
  { path: "/csv-to-json", title: "CSV → JSON", description: "Array or NDJSON output format.", icon: FileJson },
  { path: "/json-to-csv", title: "JSON → CSV", description: "Flatten and convert to CSV.", icon: Table },
  { path: "/json-to-parquet", title: "JSON → Parquet", description: "Compress JSON into Parquet.", icon: Braces },
  { path: "/excel-csv-converter", title: "Excel ↔ CSV", description: "Multi-sheet support.", icon: FileText },
];

const viewers = [
  { path: "/csv-viewer", title: "CSV Viewer", description: "Search, filter, sort with column stats.", icon: Eye },
  { path: "/parquet-viewer", title: "Parquet Viewer", description: "Data, schema, and metadata tabs.", icon: Eye },
  { path: "/json-formatter", title: "JSON Formatter", description: "Format, minify, validate with tree view.", icon: Code },
];

const analysis = [
  { path: "/sql-playground", title: "SQL Playground", description: "Full DuckDB SQL against local files.", icon: Terminal },
  { path: "/data-profiler", title: "Data Profiler", description: "Nulls, duplicates, outliers, quality.", icon: BarChart3 },
  { path: "/json-flattener", title: "JSON Flattener", description: "Flatten nested JSON to tabular.", icon: Braces },
  { path: "/schema-generator", title: "Schema Generator", description: "DDL for Postgres, MySQL, BigQuery.", icon: Database },
  { path: "/csv-to-sql", title: "CSV → SQL", description: "CREATE TABLE + INSERT statements.", icon: Database },
  { path: "/diff", title: "Dataset Diff", description: "Compare two dataset versions.", icon: GitCompare },
];

const features = [
  { icon: Zap, title: "WebAssembly Speed", description: "DuckDB compiled to WASM — analytical queries in milliseconds, not seconds." },
  { icon: Lock, title: "Zero Data Leaks", description: "No uploads. No servers. No tracking. Your files never leave your machine." },
  { icon: Globe, title: "No Install Needed", description: "Works in any modern browser. No extensions, no CLI, no accounts required." },
  { icon: Shield, title: "Free Forever", description: "All 14 tools, no paywalls. Open source philosophy, closed-source simplicity." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Anatini.dev",
  "url": "https://anatini.dev",
  "description": "Free, offline browser-powered data tools. Convert, query, profile and transform datasets using DuckDB-WASM.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": "CSV to Parquet, JSON Formatter, SQL Playground, Data Profiler, Schema Generator",
};

function ToolCard({ path, title, description, icon: Icon }: { path: string; title: string; description: string; icon: React.ElementType }) {
  return (
    <Link
      to={path}
      className="group flex flex-col gap-2 border-2 border-border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5 active:shadow-none active:translate-y-0"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-foreground" />
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-auto flex items-center gap-1 pt-1 text-xs font-bold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function Index() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Anatini.dev — Free, Offline Data Tools for Developers";
    return () => { document.title = prev; };
  }, []);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b-2 border-border">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="inline-block border-2 border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
              14 Tools · 100% Offline · Zero Tracking
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
          {/* Converters */}
          <div className="mb-12">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Converters</h2>
            <div className="mb-4 h-0.5 w-12 bg-foreground" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {converters.map((t) => <ToolCard key={t.path} {...t} />)}
            </div>
          </div>

          {/* Viewers & Formatters */}
          <div className="mb-12">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Viewers & Formatters</h2>
            <div className="mb-4 h-0.5 w-12 bg-foreground" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {viewers.map((t) => <ToolCard key={t.path} {...t} />)}
            </div>
          </div>

          {/* Analysis & SQL */}
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Analysis & SQL</h2>
            <div className="mb-4 h-0.5 w-12 bg-foreground" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {analysis.map((t) => <ToolCard key={t.path} {...t} />)}
            </div>
          </div>
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
