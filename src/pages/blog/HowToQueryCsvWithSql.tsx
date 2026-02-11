import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function HowToQueryCsvWithSql() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Query CSV Files with SQL in Your Browser",
    "description": "Run SQL queries on local CSV files using DuckDB-WASM. JOINs, CTEs, window functions — all offline.",
    "step": [
      { "@type": "HowToStep", "name": "Open SQL Playground", "text": "Navigate to anatini.dev/sql-playground." },
      { "@type": "HowToStep", "name": "Load your CSV", "text": "Drag and drop a CSV file. It becomes a queryable table." },
      { "@type": "HowToStep", "name": "Write SQL", "text": "Use full DuckDB SQL syntax including JOINs, CTEs, and window functions." },
      { "@type": "HowToStep", "name": "Export results", "text": "Download query results as CSV, Parquet, or JSON." },
    ],
  };

  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="How to Query CSV Files with SQL in Your Browser — Anatini.dev"
        description="Learn how to run SQL queries on local CSV files directly in your browser using DuckDB-WASM. JOINs, CTEs, window functions — all offline, no uploads."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Query CSV with SQL</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">How to Query CSV Files with SQL in Your Browser</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You don't need a database to run SQL. With DuckDB-WASM, you can query CSV files with full SQL syntax — JOINs, CTEs, window functions, aggregations — directly in your browser. No installs, no uploads.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Why SQL on CSV?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Spreadsheets hit their limits fast. SQL lets you filter, aggregate, join, and transform data with precision. DuckDB is an in-process analytical database that runs natively in WebAssembly, making it perfect for browser-based data work.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>No setup:</strong> No database server, no Docker, no CLI. Just open a browser tab.</li>
          <li><strong>Full SQL:</strong> JOINs, CTEs, window functions (ROW_NUMBER, LAG, LEAD), PIVOT, UNNEST, and 400+ built-in functions.</li>
          <li><strong>Multi-file queries:</strong> Load multiple CSV/Parquet/JSON files and JOIN them together.</li>
          <li><strong>Export anywhere:</strong> Download results as CSV, Parquet, or JSON.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">Example Queries</h2>

        <h3 className="text-lg font-bold mt-6 mb-2">Basic filtering and aggregation</h3>
        <pre className="bg-secondary border-2 border-border p-4 text-sm overflow-x-auto font-mono">
{`SELECT department, COUNT(*) as headcount, AVG(salary) as avg_salary
FROM employees
WHERE hire_date > '2023-01-01'
GROUP BY department
ORDER BY headcount DESC;`}
        </pre>

        <h3 className="text-lg font-bold mt-6 mb-2">Window functions</h3>
        <pre className="bg-secondary border-2 border-border p-4 text-sm overflow-x-auto font-mono">
{`SELECT name, department, salary,
       RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;`}
        </pre>

        <h3 className="text-lg font-bold mt-6 mb-2">JOIN multiple files</h3>
        <pre className="bg-secondary border-2 border-border p-4 text-sm overflow-x-auto font-mono">
{`SELECT o.order_id, c.name, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.total > 100;`}
        </pre>

        <h2 className="text-xl font-bold mt-8 mb-3">Step-by-Step Guide</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-muted-foreground">
          <li>Open the <Link to="/sql-playground" className="text-primary hover:underline">SQL Playground</Link>.</li>
          <li>Drop one or more CSV, Parquet, or JSON files. Each file becomes a table.</li>
          <li>Write your SQL query in the editor (with syntax highlighting and autocomplete).</li>
          <li>Click <strong>Run</strong> (or Ctrl+Enter) to execute.</li>
          <li>Browse results in the table view. Export as CSV, Parquet, or JSON.</li>
        </ol>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Try it now</h3>
          <Link to="/sql-playground" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open SQL Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
