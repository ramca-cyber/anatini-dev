import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    slug: "/blog/how-to-convert-csv-to-parquet",
    title: "How to Convert CSV to Parquet Online (Free, No Upload)",
    description: "Step-by-step guide to converting CSV files to Apache Parquet with compression options. 100% in your browser.",
  },
  {
    slug: "/blog/how-to-query-csv-with-sql",
    title: "How to Query CSV Files with SQL in Your Browser",
    description: "Run JOINs, CTEs, and window functions on local CSV files using DuckDB-WASM. No database needed.",
  },
  {
    slug: "/blog/offline-data-quality-profiler",
    title: "Offline Data Quality Profiler: Find Nulls, Duplicates & Outliers",
    description: "Profile CSV, Parquet, and JSON datasets offline. Detect quality issues before they hit your pipelines.",
  },
  {
    slug: "/blog/json-vs-csv-vs-parquet",
    title: "JSON vs CSV vs Parquet: Which Data Format Should You Use?",
    description: "Side-by-side comparison of the three most common data formats with conversion links.",
  },
  {
    slug: "/blog/how-to-generate-sql-from-csv",
    title: "How to Generate SQL CREATE TABLE & INSERT from CSV",
    description: "Auto-generate type-inferred DDL and INSERT statements from CSV files for any database.",
  },
];

export default function BlogIndex() {
  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="Blog — Data Engineering Guides & Tutorials | Anatini.dev"
        description="Practical guides on CSV, Parquet, JSON conversion, SQL querying, data profiling, and more. Free, offline browser tools."
      />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">Practical guides for working with data — conversions, SQL, profiling, and more.</p>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={post.slug}
            className="group block border-2 border-border bg-card p-5 transition-all hover:shadow-sm hover:-translate-y-0.5"
          >
            <h2 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{post.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{post.description}</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Read more <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
