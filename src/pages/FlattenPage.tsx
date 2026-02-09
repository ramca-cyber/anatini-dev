import { Braces } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function FlattenPage() {
  return (
    <ToolPage
      icon={Braces}
      title="JSON Flattener"
      description="Flatten nested JSON/JSONL into tabular format for analysis."
    >
      <DropZone
        accept={[".json", ".jsonl"]}
        onFile={(file) => console.log("Flatten file:", file.name)}
        label="Drop a JSON or JSONL file"
      />
    </ToolPage>
  );
}
