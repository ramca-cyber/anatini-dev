import { Link } from "react-router-dom";
import {
  ArrowRight, FileSpreadsheet, Braces, Terminal, BarChart3, GitCompare, Database,
  Shield, FileJson, Table, Eye, Code, FileText, Zap, Lock, Globe,
} from "lucide-react";

const tools = [
  { path: "/csv-to-parquet", title: "CSV → Parquet", description: "Convert CSV files to columnar Parquet format with compression options.", icon: FileSpreadsheet },
  { path: "/parquet-to-csv", title: "Parquet → CSV", description: "Export Parquet files back to CSV with delimiter and quote options.", icon: FileSpreadsheet },
  { path: "/csv-to-json", title: "CSV → JSON", description: "Convert CSV to JSON array or NDJSON format with pretty print options.", icon: FileJson },
  { path: "/json-to-csv", title: "JSON → CSV", description: "Flatten and convert JSON/NDJSON to CSV with configurable delimiters.", icon: Table },
  { path: "/json-to-parquet", title: "JSON → Parquet", description: "Convert JSON to Parquet with compression and row group options.", icon: Braces },
  { path: "/excel-csv-converter", title: "Excel ↔ CSV", description: "Convert between Excel and CSV with multi-sheet support.", icon: FileText },
  { path: "/csv-viewer", title: "CSV Viewer", description: "View, search, filter, and sort CSV data with column statistics.", icon: Eye },
  { path: "/parquet-viewer", title: "Parquet Viewer", description: "Explore Parquet files — data, schema, and metadata in tabbed view.", icon: Eye },
  { path: "/json-formatter", title: "JSON Formatter", description: "Format, minify, and validate JSON with tree view and sorting.", icon: Code },
  { path: "/sql-playground", title: "SQL Playground", description: "Write and run SQL queries against local files with DuckDB.", icon: Terminal },
  { path: "/data-profiler", title: "Data Profiler", description: "Profile datasets to uncover nulls, duplicates, outliers and quality issues.", icon: BarChart3 },
  { path: "/json-flattener", title: "JSON Flattener", description: "Flatten deeply nested JSON into tabular format for analysis.", icon: Braces },
  { path: "/schema-generator", title: "Schema Generator", description: "Infer schemas and generate DDL for Postgres, MySQL, BigQuery and more.", icon: Database },
  { path: "/csv-to-sql", title: "CSV → SQL", description: "Generate CREATE TABLE and INSERT statements from CSV data.", icon: Database },
];

const features = [
  { icon: Zap, title: "Blazing Fast", description: "Powered by DuckDB-WASM — analytical SQL engine compiled to WebAssembly." },
  { icon: Lock, title: "100% Private", description: "Everything runs in your browser. No uploads, no servers, no tracking." },
  { icon: Globe, title: "No Install", description: "Works in any modern browser. No extensions, no downloads, no accounts." },
  { icon: Shield, title: "Open & Free", description: "All tools free forever. No paywalls, no premium tiers, no sign-ups." },
];

export default function Index() {
  return (
    <>
      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Browser-powered data tools.{" "}
            <span className="text-primary">Nothing leaves your machine.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground md:text-xl">
            Convert, query, profile and transform datasets entirely in your browser using DuckDB-WASM.
            No uploads, no servers, no accounts.
          </p>
        </div>
      </section>

      {/* Tool cards — 4 columns */}
      <section className="container pb-16">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_30px_-5px_hsl(187_80%_55%/0.15)] hover:-translate-y-0.5"
            >
              <tool.icon className="h-7 w-7 text-primary" />
              <h2 className="text-base font-semibold text-card-foreground">{tool.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
              <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open tool <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Anatini */}
      <section className="border-t border-border bg-card/50">
        <div className="container py-16">
          <h2 className="text-center text-2xl font-bold mb-10">Why Anatini?</h2>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-3 text-center">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="border-t border-border">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <Shield className="h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold">Your data stays yours</h2>
          <p className="max-w-xl text-muted-foreground">
            Every tool runs entirely in your browser via WebAssembly. No file ever leaves your machine —
            there's no server to send it to. Close the tab, and your data is gone.
          </p>
          <p className="text-sm font-medium text-muted-foreground/60">No accounts. No cookies. No analytics.</p>
        </div>
      </section>
    </>
  );
}
