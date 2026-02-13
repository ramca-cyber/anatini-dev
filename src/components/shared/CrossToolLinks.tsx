import { Link } from "react-router-dom";

const linksByFormat: Record<string, { label: string; route: string }[]> = {
  csv: [
    { label: "Convert to JSON", route: "/csv-to-json" },
    { label: "Convert to Parquet", route: "/csv-to-parquet" },
    { label: "Generate SQL", route: "/csv-to-sql" },
    { label: "View Data", route: "/csv-viewer" },
    { label: "SQL Playground", route: "/sql-playground" },
    { label: "Profile Data", route: "/data-profiler" },
    { label: "Sample Data", route: "/data-sampler" },
    { label: "Deduplicate", route: "/deduplicator" },
    { label: "Edit Columns", route: "/column-editor" },
    { label: "Merge Data", route: "/data-merge" },
    { label: "Pivot Table", route: "/pivot-table" },
    { label: "Chart Builder", route: "/chart-builder" },
    { label: "Regex Filter", route: "/regex-filter" },
  ],
  json: [
    { label: "Convert to CSV", route: "/json-to-csv" },
    { label: "Convert to Parquet", route: "/json-to-parquet" },
    { label: "Flatten JSON", route: "/json-flattener" },
    { label: "Format / Beautify", route: "/json-formatter" },
    { label: "SQL Playground", route: "/sql-playground" },
    { label: "Sample Data", route: "/data-sampler" },
    { label: "Deduplicate", route: "/deduplicator" },
    { label: "Edit Columns", route: "/column-editor" },
    { label: "Merge Data", route: "/data-merge" },
    { label: "Pivot Table", route: "/pivot-table" },
    { label: "Chart Builder", route: "/chart-builder" },
    { label: "Regex Filter", route: "/regex-filter" },
  ],
  parquet: [
    { label: "Convert to CSV", route: "/parquet-to-csv" },
    { label: "Convert to JSON", route: "/parquet-to-json" },
    { label: "View Data", route: "/parquet-viewer" },
    { label: "SQL Playground", route: "/sql-playground" },
    { label: "Profile Data", route: "/data-profiler" },
    { label: "Sample Data", route: "/data-sampler" },
    { label: "Deduplicate", route: "/deduplicator" },
    { label: "Edit Columns", route: "/column-editor" },
    { label: "Merge Data", route: "/data-merge" },
    { label: "Pivot Table", route: "/pivot-table" },
    { label: "Chart Builder", route: "/chart-builder" },
    { label: "Regex Filter", route: "/regex-filter" },
  ],
  excel: [
    { label: "Convert to CSV", route: "/excel-to-csv" },
    { label: "SQL Playground", route: "/sql-playground" },
  ],
  yaml: [
    { label: "YAML → JSON", route: "/yaml-to-json" },
    { label: "JSON → YAML", route: "/json-to-yaml" },
    { label: "JSON Formatter", route: "/json-formatter" },
    { label: "JSON Flattener", route: "/json-flattener" },
  ],
  xml: [
    { label: "XML → JSON", route: "/xml-to-json" },
    { label: "JSON → XML", route: "/json-to-xml" },
    { label: "JSON Formatter", route: "/json-formatter" },
    { label: "JSON Flattener", route: "/json-flattener" },
  ],
};

interface CrossToolLinksProps {
  format: string;
  fileId?: string;
  /** Filter out a link whose route matches (e.g. the current page) */
  excludeRoute?: string;
  /** Sub-heading label, e.g. "Source file" or "Converted output" */
  heading?: string;
  /** Render without the outer border container (for nesting inside a shared wrapper) */
  inline?: boolean;
}

export function CrossToolLinks({ format, fileId, excludeRoute, heading, inline }: CrossToolLinksProps) {
  const allLinks = linksByFormat[format] ?? [];
  const links = excludeRoute ? allLinks.filter((l) => l.route !== excludeRoute) : allLinks;
  if (links.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground text-center">
      Continue:{" "}
      {links.map((link, i) => (
        <span key={link.route}>
          {i > 0 && " · "}
          <Link
            to={fileId ? `${link.route}?fileId=${fileId}` : link.route}
            className="text-foreground hover:text-primary underline underline-offset-2 transition-colors"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
