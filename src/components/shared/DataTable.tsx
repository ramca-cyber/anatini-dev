import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "bigint") return val.toString();
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, (_key, v) => typeof v === "bigint" ? v.toString() : v);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

interface DataTableProps {
  columns: string[];
  rows: any[][];
  types?: string[];
  maxRows?: number;
  className?: string;
}

export function DataTable({ columns, rows, types, maxRows = 100, className }: DataTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / maxRows);
  const displayRows = rows.slice(page * maxRows, (page + 1) * maxRows);

  useEffect(() => {
    setPage(0);
  }, [rows]);

  return (
    <div className={cn("overflow-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col, i) => (
              <th key={i} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                <div>{col}</div>
                {types?.[i] && (
                  <div className="font-mono text-[10px] font-normal text-muted-foreground">{types[i]}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/30 even:bg-muted/20">
              {row.map((val, j) => (
                <td key={j} className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">
                  {val === null || val === undefined ? (
                    <span className="text-muted-foreground/60">∅</span>
                  ) : typeof val === "object" ? (
                    <span className="max-w-[200px] truncate block text-muted-foreground">{formatValue(val)}</span>
                  ) : (
                    <span className="max-w-[300px] truncate block">{formatValue(val)}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
