import { Database } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function SchemaPage() {
  return (
    <ToolPage
      icon={Database}
      title="Schema Generator"
      description="Infer schemas and generate DDL for Postgres, MySQL, BigQuery and more."
    >
      <DropZone
        accept={[".csv", ".parquet", ".json"]}
        onFile={(file) => console.log("Schema file:", file.name)}
        label="Drop a file to infer schema"
      />
    </ToolPage>
  );
}
