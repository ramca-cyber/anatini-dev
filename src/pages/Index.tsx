import { useState } from "react";
import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import {
  ArrowRight, FileSpreadsheet, Braces, Terminal, BarChart3, Database,
  FileJson, Table, Eye, Code, FileText, Zap, Lock, Globe, Shield,
  GitCompare, Search, Shuffle, Copy, AlignLeft, Columns3, Merge,
  TableProperties, RefreshCw, Filter, Scissors, Binary, ShieldOff, Hash, Wand2,
  CheckCircle2,
} from "lucide-react";

const converters = [
  { path: "/csv-to-parquet", title: "CSV → Parquet", description: "Columnar format with compression options.", icon: FileSpreadsheet },
  { path: "/parquet-to-csv", title: "Parquet → CSV", description: "Export Parquet back to CSV.", icon: FileSpreadsheet },
  { path: "/csv-to-json", title: "CSV → JSON", description: "Array or NDJSON output format.", icon: FileJson },
  { path: "/json-to-csv", title: "JSON → CSV", description: "Flatten and convert to CSV.", icon: Table },
  { path: "/json-to-parquet", title: "JSON → Parquet", description: "Compress JSON into Parquet.", icon: Braces },
  { path: "/parquet-to-json", title: "Parquet → JSON", description: "Export Parquet to JSON/NDJSON.", icon: Braces },
  { path: "/excel-to-csv", title: "Excel → CSV", description: "Multi-sheet export to CSV.", icon: FileText },
  { path: "/csv-to-excel", title: "CSV → Excel", description: "Combine CSVs into a workbook.", icon: FileText },
  { path: "/yaml-to-json", title: "YAML → JSON", description: "Convert YAML documents to JSON.", icon: RefreshCw },
  { path: "/json-to-yaml", title: "JSON → YAML", description: "Convert JSON documents to YAML.", icon: RefreshCw },
  { path: "/xml-to-json", title: "XML → JSON", description: "Convert XML documents to JSON.", icon: RefreshCw },
  { path: "/json-to-xml", title: "JSON → XML", description: "Convert JSON documents to XML.", icon: RefreshCw },
  { path: "/toml-to-json", title: "TOML → JSON", description: "Convert TOML config files to JSON.", icon: RefreshCw },
  { path: "/json-to-toml", title: "JSON → TOML", description: "Convert JSON to TOML config format.", icon: RefreshCw },
];

const viewers = [
  { path: "/csv-viewer", title: "Delimited Viewer", description: "View CSV, TSV, DSV with search & stats.", icon: Eye },
  { path: "/parquet-viewer", title: "Parquet Viewer", description: "Data, schema, and metadata tabs.", icon: Eye },
  { path: "/excel-viewer", title: "Excel Viewer", description: "Browse XLSX/XLS with multi-sheet tabs.", icon: Eye },
  { path: "/json-formatter", title: "JSON Formatter", description: "Format, minify, validate with tree view.", icon: Code },
  { path: "/xml-formatter", title: "XML Formatter", description: "Format, minify, validate XML documents.", icon: Code },
  { path: "/yaml-formatter", title: "YAML Formatter", description: "Format, minify, validate YAML documents.", icon: Code },
  { path: "/log-viewer", title: "Log Viewer", description: "Filter logs by level, regex search, line numbers.", icon: FileText },
  { path: "/hex-viewer", title: "Hex Viewer", description: "Inspect binary files with hex + ASCII columns.", icon: Binary },
];

const inspectors = [
  { path: "/csv-inspector", title: "CSV Inspector", description: "Analyze encoding, structure & quality.", icon: Search },
  { path: "/json-inspector", title: "JSON Inspector", description: "Analyze schema, types & consistency.", icon: Search },
  { path: "/parquet-inspector", title: "Parquet Inspector", description: "View metadata, row groups & stats.", icon: Search },
];

const analysis = [
  { path: "/sql-playground", title: "SQL Playground", description: "Full DuckDB SQL against local files.", icon: Terminal },
  { path: "/data-profiler", title: "Data Profiler", description: "Nulls, duplicates, outliers, quality.", icon: BarChart3 },
  { path: "/json-flattener", title: "JSON Flattener", description: "Flatten nested JSON to tabular.", icon: Braces },
  { path: "/schema-generator", title: "Schema Generator", description: "DDL for Postgres, MySQL, BigQuery.", icon: Database },
  { path: "/csv-to-sql", title: "CSV → SQL", description: "CREATE TABLE + INSERT statements.", icon: Database },
  { path: "/dataset-diff", title: "Dataset Diff", description: "Compare two dataset versions.", icon: GitCompare },
  { path: "/data-sampler", title: "Data Sampler", description: "Random or stratified sampling.", icon: Shuffle },
  { path: "/deduplicator", title: "Deduplicator", description: "Find and remove duplicate rows.", icon: Copy },
  { path: "/sql-formatter", title: "SQL Formatter", description: "Beautify and minify SQL queries.", icon: Code },
  { path: "/markdown-table", title: "Markdown Table", description: "Convert data to Markdown tables.", icon: AlignLeft },
  { path: "/column-editor", title: "Column Editor", description: "Select, reorder, rename columns.", icon: Columns3 },
  { path: "/data-merge", title: "Data Merge", description: "Join two datasets visually.", icon: Merge },
  { path: "/pivot-table", title: "Pivot Table", description: "Build pivot tables with aggregation.", icon: TableProperties },
  { path: "/chart-builder", title: "Chart Builder", description: "Bar, line, area, pie, scatter charts.", icon: BarChart3 },
  { path: "/regex-filter", title: "Regex Filter", description: "Filter rows by regex pattern.", icon: Filter },
  { path: "/csv-splitter", title: "CSV Splitter", description: "Split files by row count or column.", icon: Scissors },
  { path: "/data-anonymizer", title: "Data Anonymizer", description: "Mask, redact, or fake sensitive columns.", icon: ShieldOff },
  { path: "/data-generator", title: "Data Generator", description: "Generate realistic sample datasets.", icon: Wand2 },
];

const utilities = [
  { path: "/base64", title: "Base64 Encoder/Decoder", description: "Encode and decode Base64 text or files.", icon: Binary },
  { path: "/hash-generator", title: "Hash Generator", description: "SHA-256, SHA-384, SHA-512 from text or files.", icon: Hash },
  { path: "/json-schema-validator", title: "JSON Schema Validator", description: "Validate JSON against schema definitions.", icon: CheckCircle2 },
];

const features = [
  { icon: Zap, title: "WebAssembly Speed", description: "DuckDB compiled to WASM — analytical queries in milliseconds, not seconds." },
  { icon: Lock, title: "Zero Data Leaks", description: "No uploads. No servers. No tracking. Your files never leave your machine." },
  { icon: Globe, title: "No Install Needed", description: "Works in any modern browser. No extensions, no CLI, no accounts required." },
  { icon: Shield, title: "Free Forever", description: "All 46+ tools, no paywalls. Open source philosophy, closed-source simplicity." },
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
  "featureList": "CSV to Parquet, Parquet to CSV, CSV to JSON, JSON to CSV, JSON to Parquet, Parquet to JSON, Excel to CSV, CSV to Excel, YAML to JSON, JSON to YAML, XML to JSON, JSON to XML, TOML to JSON, JSON to TOML, Delimited Viewer, Parquet Viewer, Excel Viewer, JSON Formatter, XML Formatter, YAML Formatter, Log Viewer, Hex Viewer, CSV Inspector, JSON Inspector, Parquet Inspector, SQL Playground, Data Profiler, JSON Flattener, Schema Generator, CSV to SQL, Dataset Diff, Data Sampler, Deduplicator, SQL Formatter, Markdown Table, Column Editor, Data Merge, Pivot Table, Chart Builder, Regex Filter, CSV Splitter, Base64 Encoder/Decoder, Data Anonymizer, Hash Generator, Data Generator, JSON Schema Validator",
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
  const [search, setSearch] = useState("");
  const lowerSearch = search.toLowerCase();

  const allCategories = [
    { label: "Converters", items: converters },
    { label: "Viewers & Formatters", items: viewers },
    { label: "Inspectors", items: inspectors },
    { label: "Analysis & SQL", items: analysis },
    { label: "Utilities", items: utilities },
  ];

  const filteredCategories = allCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch)
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      <PageMeta
        title="Anatini.dev — Free, Offline Data Tools for Developers"
        description="46+ free, offline data tools powered by DuckDB-WASM. Convert CSV, Parquet, JSON, Excel, XML, TOML. Query with SQL. Profile datasets. All in your browser."
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
             46 Tools · 100% Offline · Zero Tracking
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
                {filteredCategories.reduce((s, c) => s + c.items.length, 0)} results
              </span>
            )}
          </div>

          {filteredCategories.map((cat, i) => (
            <div key={cat.label} className={i < filteredCategories.length - 1 ? "mb-12" : ""}>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</h2>
              <div className="mb-4 h-0.5 w-12 bg-foreground" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cat.items.map((t) => <ToolCard key={t.path} {...t} />)}
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
