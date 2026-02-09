import { Terminal } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function SqlPage() {
  return (
    <ToolPage
      icon={Terminal}
      title="SQL Playground"
      description="Run SQL queries against local files using DuckDB."
    >
      <DropZone
        accept={[".csv", ".parquet", ".json"]}
        onFile={(file) => console.log("SQL file:", file.name)}
        label="Drop files to query"
      />
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="font-mono text-sm text-muted-foreground">
          -- Load a file above, then write SQL here
        </p>
      </div>
    </ToolPage>
  );
}
