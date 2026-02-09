import { cn } from "@/lib/utils";

interface DataTableProps {
  columns: string[];
  rows: any[][];
  types?: string[];
  maxRows?: number;
  className?: string;
}

export function DataTable({ columns, rows, types, maxRows = 100, className }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows);

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
            <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/30">
              {row.map((val, j) => (
                <td key={j} className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">
                  {val === null || val === undefined ? (
                    <span className="text-muted-foreground/40">∅</span>
                  ) : typeof val === "object" ? (
                    <span className="max-w-[200px] truncate block text-muted-foreground">{JSON.stringify(val)}</span>
                  ) : (
                    <span className="max-w-[300px] truncate block">{String(val)}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground text-center">
          Showing {maxRows} of {rows.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
}
