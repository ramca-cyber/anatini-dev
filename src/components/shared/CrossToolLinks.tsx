import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const linksByFormat: Record<string, { label: string; route: string }[]> = {
  csv: [
    { label: "Convert to JSON", route: "/csv-to-json" },
    { label: "Convert to Parquet", route: "/csv-to-parquet" },
    { label: "Generate SQL", route: "/csv-to-sql" },
    { label: "View Data", route: "/csv-viewer" },
    { label: "SQL Playground", route: "/sql-playground" },
    { label: "Profile Data", route: "/data-profiler" },
  ],
  json: [
    { label: "Convert to CSV", route: "/json-to-csv" },
    { label: "Convert to Parquet", route: "/json-to-parquet" },
    { label: "Flatten JSON", route: "/json-flattener" },
    { label: "Format / Beautify", route: "/json-formatter" },
    { label: "SQL Playground", route: "/sql-playground" },
  ],
  parquet: [
    { label: "Convert to CSV", route: "/parquet-to-csv" },
    { label: "Convert to JSON", route: "/parquet-to-json" },
    { label: "View Data", route: "/parquet-viewer" },
    { label: "SQL Playground", route: "/sql-playground" },
    { label: "Profile Data", route: "/data-profiler" },
  ],
  excel: [
    { label: "Convert to CSV", route: "/excel-csv-converter" },
    { label: "SQL Playground", route: "/sql-playground" },
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

  const content = (
    <>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {heading ?? "Work with this file"}
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.route}
            to={fileId ? `${link.route}?fileId=${fileId}` : link.route}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {link.label} <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </>
  );

  if (inline) {
    return <div className="space-y-2">{content}</div>;
  }

  return (
    <div className="border border-border p-4 space-y-3">
      {content}
    </div>
  );
}
