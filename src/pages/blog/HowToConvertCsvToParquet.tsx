import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function HowToConvertCsvToParquet() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Convert CSV to Parquet Online (Free, No Upload)",
    "description": "Step-by-step guide to converting CSV files to Apache Parquet format using a free, offline browser tool.",
    "step": [
      { "@type": "HowToStep", "name": "Open the tool", "text": "Navigate to the CSV to Parquet converter at anatini.dev/csv-to-parquet." },
      { "@type": "HowToStep", "name": "Upload your CSV", "text": "Drag and drop your CSV file or click to browse. The file stays in your browser." },
      { "@type": "HowToStep", "name": "Choose compression", "text": "Select Snappy (fast), Zstd (smaller), or None." },
      { "@type": "HowToStep", "name": "Download Parquet", "text": "Click Convert and download the resulting Parquet file." },
    ],
  };

  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="How to Convert CSV to Parquet Online (Free) — Anatini.dev"
        description="Learn how to convert CSV files to Apache Parquet format for free, directly in your browser. No uploads, no installs. Step-by-step guide with compression tips."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">CSV to Parquet Guide</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">How to Convert CSV to Parquet Online (Free, No Upload Required)</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Apache Parquet is the gold standard for analytical data storage. It offers <strong>columnar compression</strong> that can shrink your CSV files by 50–90%, while enabling lightning-fast queries in tools like DuckDB, Spark, and BigQuery. Here's how to convert CSV to Parquet entirely in your browser — no installs, no uploads.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Why Convert CSV to Parquet?</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Smaller files:</strong> Parquet's columnar compression typically reduces file sizes by 50–90% compared to CSV.</li>
          <li><strong>Faster queries:</strong> Columnar storage means analytical queries only read the columns they need.</li>
          <li><strong>Schema preservation:</strong> Unlike CSV, Parquet embeds data types (integers, dates, strings) directly in the file.</li>
          <li><strong>Industry standard:</strong> Parquet is used by AWS Athena, Google BigQuery, Apache Spark, Snowflake, and more.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">Step-by-Step: Convert CSV to Parquet</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-muted-foreground">
          <li><strong>Open the converter:</strong> Go to <Link to="/csv-to-parquet" className="text-primary hover:underline">CSV to Parquet Converter</Link>.</li>
          <li><strong>Drop your CSV file:</strong> Drag and drop or click to upload. Your file never leaves your browser — everything runs via DuckDB-WASM (WebAssembly).</li>
          <li><strong>Choose compression:</strong> Pick <strong>Snappy</strong> (fast, good default), <strong>Zstd</strong> (best compression ratio), or <strong>None</strong> (uncompressed).</li>
          <li><strong>Click Convert:</strong> The tool parses your CSV, infers column types, and generates a Parquet file in seconds.</li>
          <li><strong>Download:</strong> Save the .parquet file to your machine.</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">Compression Options Explained</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-2 border-border">
            <thead>
              <tr className="bg-secondary">
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Method</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Speed</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Compression</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Best For</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border-2 border-border px-3 py-2">Snappy</td><td className="border-2 border-border px-3 py-2">Fast</td><td className="border-2 border-border px-3 py-2">Good</td><td className="border-2 border-border px-3 py-2">General use, Spark/Athena</td></tr>
              <tr><td className="border-2 border-border px-3 py-2">Zstd</td><td className="border-2 border-border px-3 py-2">Medium</td><td className="border-2 border-border px-3 py-2">Excellent</td><td className="border-2 border-border px-3 py-2">Long-term storage, archiving</td></tr>
              <tr><td className="border-2 border-border px-3 py-2">None</td><td className="border-2 border-border px-3 py-2">Fastest</td><td className="border-2 border-border px-3 py-2">None</td><td className="border-2 border-border px-3 py-2">Debugging, compatibility</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-3">Privacy & Security</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This tool runs <strong>100% in your browser</strong> using WebAssembly. No file is ever uploaded to a server. No data is logged, tracked, or stored. Close the tab, and everything is gone.
        </p>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Ready to convert?</h3>
          <Link to="/csv-to-parquet" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open CSV → Parquet Converter <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
