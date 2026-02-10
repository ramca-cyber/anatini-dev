import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const inspectorRoutes: Record<string, string> = {
  csv: "/csv-inspector",
  json: "/json-inspector",
  parquet: "/parquet-inspector",
};

export function InspectLink({ fileId, format }: { fileId: string; format: string }) {
  const route = inspectorRoutes[format];
  if (!route) return null;
  return (
    <Link
      to={`${route}?fileId=${fileId}`}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border-2 border-border bg-background text-foreground hover:bg-secondary transition-colors"
    >
      <Search className="h-3.5 w-3.5" /> Inspect
    </Link>
  );
}
