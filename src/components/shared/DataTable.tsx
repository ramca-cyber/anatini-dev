import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";

function formatValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "bigint") return val.toLocaleString();
  if (typeof val === "number") {
    if (Number.isInteger(val) && Math.abs(val) >= 1000) return val.toLocaleString();
    return String(val);
  }
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
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setPage(0);
    setSortCol(null);
  }, [rows]);

  function handleSort(colIndex: number) {
    if (sortCol === colIndex) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortCol(null);
        setSortAsc(true);
      }
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
    setPage(0);
  }

  const sortedRows = useMemo(() => {
    if (sortCol === null) return rows;
    return [...rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      if (typeof va === "bigint" && typeof vb === "bigint") {
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortAsc ? cmp : -cmp;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortCol, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / maxRows);
  const displayRows = sortedRows.slice(page * maxRows, (page + 1) * maxRows);

  return (
    <div className={cn("overflow-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col, i) => (
              <th key={i} className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                <button
                  onClick={() => handleSort(i)}
                  className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{col}</span>
                  {sortCol === i && (
                    sortAsc
                      ? <ArrowUp className="h-3 w-3 text-primary" />
                      : <ArrowDown className="h-3 w-3 text-primary" />
                  )}
                </button>
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
                <td key={j} className={cn(
                  "px-3 py-1.5 whitespace-nowrap font-mono text-xs",
                  (val === null || val === undefined || val === "") && "bg-destructive/5"
                )}>
                  {val === null || val === undefined ? (
                    <span className="text-destructive/40">∅</span>
                  ) : val === "" ? (
                    <span className="text-destructive/40 italic">empty</span>
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
