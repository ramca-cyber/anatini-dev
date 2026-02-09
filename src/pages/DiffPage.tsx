import { GitCompare } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function DiffPage() {
  return (
    <ToolPage
      icon={GitCompare}
      title="Dataset Diff"
      description="Compare two dataset versions to see added, removed and modified rows."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Before</p>
          <DropZone
            accept={[".csv", ".parquet"]}
            onFile={(file) => console.log("Before file:", file.name)}
            label="Drop the 'before' file"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">After</p>
          <DropZone
            accept={[".csv", ".parquet"]}
            onFile={(file) => console.log("After file:", file.name)}
            label="Drop the 'after' file"
          />
        </div>
      </div>
    </ToolPage>
  );
}
