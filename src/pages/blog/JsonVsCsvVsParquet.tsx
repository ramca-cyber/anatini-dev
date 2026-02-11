import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight } from "lucide-react";

export default function JsonVsCsvVsParquet() {
  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="JSON vs CSV vs Parquet: Which Data Format Should You Use? — Anatini.dev"
        description="Compare JSON, CSV, and Parquet data formats. Learn when to use each, their pros and cons, and how to convert between them for free."
      />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">JSON vs CSV vs Parquet</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">JSON vs CSV vs Parquet: Which Data Format Should You Use?</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Choosing the right data format can dramatically impact your workflow's performance, storage costs, and compatibility. Here's an honest comparison of the three most common data formats.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Quick Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-2 border-border">
            <thead>
              <tr className="bg-secondary">
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Feature</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">CSV</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">JSON</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Parquet</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Human readable</td><td className="border-2 border-border px-3 py-2">✅ Yes</td><td className="border-2 border-border px-3 py-2">✅ Yes</td><td className="border-2 border-border px-3 py-2">❌ Binary</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Schema</td><td className="border-2 border-border px-3 py-2">❌ None</td><td className="border-2 border-border px-3 py-2">⚠️ Implicit</td><td className="border-2 border-border px-3 py-2">✅ Embedded</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Compression</td><td className="border-2 border-border px-3 py-2">❌ None</td><td className="border-2 border-border px-3 py-2">❌ None</td><td className="border-2 border-border px-3 py-2">✅ Excellent</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Nested data</td><td className="border-2 border-border px-3 py-2">❌ Flat only</td><td className="border-2 border-border px-3 py-2">✅ Native</td><td className="border-2 border-border px-3 py-2">✅ STRUCT/LIST</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Query speed</td><td className="border-2 border-border px-3 py-2">⚠️ Slow</td><td className="border-2 border-border px-3 py-2">⚠️ Slow</td><td className="border-2 border-border px-3 py-2">✅ Fast</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-medium">Universal support</td><td className="border-2 border-border px-3 py-2">✅ Everywhere</td><td className="border-2 border-border px-3 py-2">✅ Everywhere</td><td className="border-2 border-border px-3 py-2">⚠️ Analytics tools</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-3">When to Use CSV</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          CSV is the universal interchange format. Use it when you need maximum compatibility — importing into spreadsheets, legacy systems, or any tool that reads text. It's simple but lacks schema, compression, and nested data support.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">When to Use JSON</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          JSON is ideal for APIs, configuration files, and data with nested structures. It's human-readable and natively supported by every programming language. However, it's verbose and slow to query at scale.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">When to Use Parquet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Parquet is the best choice for analytical workloads, data lakes, and long-term storage. Its columnar format enables fast queries and excellent compression. Use it with tools like DuckDB, Spark, Athena, BigQuery, and Snowflake.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Convert Between Formats</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><Link to="/csv-to-parquet" className="text-primary hover:underline">CSV → Parquet</Link></li>
          <li><Link to="/csv-to-json" className="text-primary hover:underline">CSV → JSON</Link></li>
          <li><Link to="/json-to-parquet" className="text-primary hover:underline">JSON → Parquet</Link></li>
          <li><Link to="/parquet-to-csv" className="text-primary hover:underline">Parquet → CSV</Link></li>
          <li><Link to="/parquet-to-json" className="text-primary hover:underline">Parquet → JSON</Link></li>
          <li><Link to="/json-to-csv" className="text-primary hover:underline">JSON → CSV</Link></li>
        </ul>
      </article>
    </div>
  );
}
