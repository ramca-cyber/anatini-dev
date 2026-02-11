import { useDuckDB } from "@/contexts/DuckDBContext";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";

export function DuckDBGate({ children }: { children: ReactNode }) {
  const { loading, error } = useDuckDB();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/20 p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Initializing data engine...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={`Failed to initialize DuckDB: ${error}`} />;
  }

  return <>{children}</>;
}
