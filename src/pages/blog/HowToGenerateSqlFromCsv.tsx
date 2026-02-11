import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function HowToGenerateSqlFromCsv() {
  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="How to Generate SQL CREATE TABLE & INSERT from CSV — Anatini.dev"
        description="Generate SQL CREATE TABLE and INSERT statements from CSV files automatically. Free, offline tool for Postgres, MySQL, SQLite, and more."
      />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Generate SQL from CSV</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">How to Generate SQL CREATE TABLE & INSERT Statements from CSV</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Need to import a CSV into a database? Instead of manually writing DDL and INSERT statements, use Anatini's CSV to SQL tool to automatically generate type-inferred SQL — ready to paste into Postgres, MySQL, SQLite, or any SQL database.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">What the Tool Does</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Type inference:</strong> DuckDB analyzes your CSV and infers column types (INTEGER, VARCHAR, DATE, DOUBLE, etc.).</li>
          <li><strong>CREATE TABLE:</strong> Generates a complete DDL statement with proper column types.</li>
          <li><strong>INSERT statements:</strong> Produces INSERT INTO statements for all your data rows.</li>
          <li><strong>Schema generation:</strong> Use the <Link to="/schema-generator" className="text-primary hover:underline">Schema Generator</Link> for Postgres, MySQL, BigQuery, and more.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">Step-by-Step</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-muted-foreground">
          <li>Open the <Link to="/csv-to-sql" className="text-primary hover:underline">CSV to SQL tool</Link>.</li>
          <li>Upload your CSV file.</li>
          <li>Review the inferred schema and adjust table name if needed.</li>
          <li>Copy the generated CREATE TABLE and INSERT statements.</li>
          <li>Paste into your database client (pgAdmin, DBeaver, MySQL Workbench, etc.).</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">Example Output</h2>
        <pre className="bg-secondary border-2 border-border p-4 text-sm overflow-x-auto font-mono">
{`CREATE TABLE users (
  id INTEGER,
  name VARCHAR,
  email VARCHAR,
  signup_date DATE,
  plan VARCHAR
);

INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', '2024-01-15', 'pro');
INSERT INTO users VALUES (2, 'Bob', 'bob@example.com', '2024-02-20', 'free');`}
        </pre>

        <h2 className="text-xl font-bold mt-8 mb-3">Related Tools</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><Link to="/schema-generator" className="text-primary hover:underline">Schema Generator</Link> — DDL for Postgres, MySQL, BigQuery, SQLite</li>
          <li><Link to="/sql-playground" className="text-primary hover:underline">SQL Playground</Link> — Query CSV files with full SQL</li>
          <li><Link to="/csv-to-parquet" className="text-primary hover:underline">CSV to Parquet</Link> — Convert for analytics instead of SQL import</li>
        </ul>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Generate SQL from your CSV</h3>
          <Link to="/csv-to-sql" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open CSV → SQL <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
