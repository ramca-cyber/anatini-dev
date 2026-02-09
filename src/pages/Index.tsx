import { Link } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, Braces, Terminal, BarChart3, GitCompare, Database, Shield } from "lucide-react";

const tools = [
  {
    path: "/convert",
    title: "CSV ↔ Parquet Converter",
    description: "Convert between CSV and Parquet formats with full type preservation and compression options.",
    icon: FileSpreadsheet,
  },
  {
    path: "/flatten",
    title: "JSON Flattener",
    description: "Flatten deeply nested JSON/JSONL into tabular format ready for analysis.",
    icon: Braces,
  },
  {
    path: "/sql",
    title: "SQL Playground",
    description: "Write and run SQL queries against your local files with DuckDB's full SQL dialect.",
    icon: Terminal,
  },
  {
    path: "/profiler",
    title: "Data Quality Profiler",
    description: "Profile datasets to uncover nulls, duplicates, outliers and data quality issues.",
    icon: BarChart3,
  },
  {
    path: "/diff",
    title: "Dataset Diff",
    description: "Compare two dataset versions side-by-side to see added, removed and modified rows.",
    icon: GitCompare,
  },
  {
    path: "/schema",
    title: "Schema Generator",
    description: "Infer schemas from data and generate DDL for Postgres, MySQL, BigQuery and more.",
    icon: Database,
  },
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
            Convert, query, profile and diff datasets entirely in your browser using DuckDB-WASM.
            No uploads, no servers, no accounts.
          </p>
        </div>
      </section>

      {/* Tool cards */}
      <section className="container pb-20">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_30px_-5px_hsl(187_80%_55%/0.15)] hover:-translate-y-0.5"
            >
              <tool.icon className="h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">{tool.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
              <div className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Privacy section */}
      <section className="border-t border-border bg-card/50">
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
