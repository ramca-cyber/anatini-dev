import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function OfflineDataQualityProfiler() {
  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="Offline Data Quality Profiler — Find Nulls, Duplicates & Outliers Free | Anatini.dev"
        description="Profile CSV, Parquet, and JSON datasets offline. Detect nulls, duplicates, outliers, and data quality issues — free, in your browser, no uploads."
      />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Offline Data Quality Profiler</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Offline Data Quality Profiler: Find Nulls, Duplicates & Outliers for Free</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Bad data costs businesses <strong>$12.9 million per year</strong> on average. Data profiling is the first line of defense — it reveals null values, duplicate rows, outliers, and structural issues before they pollute your pipelines. Anatini's Data Profiler runs entirely offline in your browser.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">What Data Profiling Reveals</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Null/missing values:</strong> Which columns have gaps and how many?</li>
          <li><strong>Duplicate rows:</strong> How many exact duplicates exist in your dataset?</li>
          <li><strong>Cardinality:</strong> How many distinct values per column? High cardinality may indicate IDs; low cardinality suggests categories.</li>
          <li><strong>Value distributions:</strong> Min, max, mean, median, standard deviation for numeric columns.</li>
          <li><strong>Outliers:</strong> Values that fall far outside the expected range.</li>
          <li><strong>Constant columns:</strong> Columns where every row has the same value (often safe to drop).</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">How to Profile a Dataset</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-muted-foreground">
          <li>Open the <Link to="/data-profiler" className="text-primary hover:underline">Data Profiler</Link>.</li>
          <li>Drop a CSV, Parquet, or JSON file.</li>
          <li>The profiler automatically analyzes every column and generates a full report.</li>
          <li>Review the overview for dataset-level stats, then drill into individual columns.</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">Why Offline Matters</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Many data profiling tools require uploading your data to a cloud service. That's a non-starter for sensitive datasets — healthcare records, financial data, PII. Anatini's profiler runs 100% in your browser via WebAssembly. No file is ever uploaded. No data is logged. Close the tab, and it's gone.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Supported Formats</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>CSV</strong> — with auto-detected delimiters (comma, tab, semicolon, pipe)</li>
          <li><strong>Parquet</strong> — including compressed files (Snappy, Zstd)</li>
          <li><strong>JSON / JSONL</strong> — standard arrays and newline-delimited formats</li>
        </ul>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Profile your data now</h3>
          <Link to="/data-profiler" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open Data Profiler <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
