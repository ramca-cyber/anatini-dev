import { Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const toolGrid = {
  Converters: [
    { label: "CSV → Parquet", path: "/csv-to-parquet" },
    { label: "Parquet → CSV", path: "/parquet-to-csv" },
    { label: "CSV → JSON", path: "/csv-to-json" },
    { label: "JSON → CSV", path: "/json-to-csv" },
    { label: "JSON → Parquet", path: "/json-to-parquet" },
    { label: "Parquet → JSON", path: "/parquet-to-json" },
    { label: "Excel → CSV", path: "/excel-to-csv" },
    { label: "CSV → Excel", path: "/csv-to-excel" },
    { label: "YAML → JSON", path: "/yaml-to-json" },
    { label: "JSON → YAML", path: "/json-to-yaml" },
    { label: "XML → JSON", path: "/xml-to-json" },
    { label: "JSON → XML", path: "/json-to-xml" },
    { label: "TOML → JSON", path: "/toml-to-json" },
    { label: "JSON → TOML", path: "/json-to-toml" },
  ],
  "Viewers & Formatters": [
    { label: "Delimited Viewer", path: "/csv-viewer" },
    { label: "Parquet Viewer", path: "/parquet-viewer" },
    { label: "Excel Viewer", path: "/excel-viewer" },
    { label: "JSON Formatter", path: "/json-formatter" },
    { label: "XML Formatter", path: "/xml-formatter" },
    { label: "YAML Formatter", path: "/yaml-formatter" },
    { label: "Log Viewer", path: "/log-viewer" },
    { label: "Hex Viewer", path: "/hex-viewer" },
  ],
  Inspectors: [
    { label: "CSV Inspector", path: "/csv-inspector" },
    { label: "JSON Inspector", path: "/json-inspector" },
    { label: "Parquet Inspector", path: "/parquet-inspector" },
  ],
  "Analysis & SQL": [
    { label: "SQL Playground", path: "/sql-playground" },
    { label: "Data Profiler", path: "/data-profiler" },
    { label: "JSON Flattener", path: "/json-flattener" },
    { label: "Schema Generator", path: "/schema-generator" },
    { label: "CSV → SQL", path: "/csv-to-sql" },
    { label: "Dataset Diff", path: "/dataset-diff" },
    { label: "Data Sampler", path: "/data-sampler" },
    { label: "Deduplicator", path: "/deduplicator" },
    { label: "SQL Formatter", path: "/sql-formatter" },
    { label: "Markdown Table", path: "/markdown-table" },
    { label: "Column Editor", path: "/column-editor" },
    { label: "Data Merge", path: "/data-merge" },
    { label: "Pivot Table", path: "/pivot-table" },
    { label: "Chart Builder", path: "/chart-builder" },
    { label: "Regex Filter", path: "/regex-filter" },
    { label: "CSV Splitter", path: "/csv-splitter" },
    { label: "Data Anonymizer", path: "/data-anonymizer" },
    { label: "Data Generator", path: "/data-generator" },
  ],
  Utilities: [
    { label: "Base64 Encoder/Decoder", path: "/base64" },
    { label: "Hash Generator", path: "/hash-generator" },
    { label: "JSON Schema Validator", path: "/json-schema-validator" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container py-10">
        {/* Tool grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mb-8">
          {Object.entries(toolGrid).map(([category, tools]) => (
            <div key={category}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{category}</h4>
              <ul className="space-y-1.5">
                {tools.map((t) => (
                  <li key={t.path}>
                    <Link to={t.path} className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col items-center gap-4 text-sm text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>Your data never leaves your browser</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://duckdb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Powered by DuckDB <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-border">·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Anatini.dev
          </p>
        </div>
      </div>
    </footer>
  );
}
