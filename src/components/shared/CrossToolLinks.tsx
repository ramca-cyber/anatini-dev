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
};

export function CrossToolLinks({ format, fileId }: { format: string; fileId?: string }) {
  const links = linksByFormat[format] ?? [];
  if (links.length === 0) return null;

  return (
    <div className="border-2 border-border p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Work with this file
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.route}
            to={fileId ? `${link.route}?fileId=${fileId}` : link.route}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors"
          >
            {link.label} <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
