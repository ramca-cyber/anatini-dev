import { BarChart3 } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function ProfilerPage() {
  return (
    <ToolPage
      icon={BarChart3}
      title="Data Quality Profiler"
      description="Profile datasets for nulls, duplicates, outliers and quality issues."
    >
      <DropZone
        accept={[".csv", ".parquet", ".json"]}
        onFile={(file) => console.log("Profile file:", file.name)}
        label="Drop a dataset to profile"
      />
    </ToolPage>
  );
}
