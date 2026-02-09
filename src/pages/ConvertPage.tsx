import { FileSpreadsheet } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";

export default function ConvertPage() {
  return (
    <ToolPage
      icon={FileSpreadsheet}
      title="CSV ↔ Parquet Converter"
      description="Convert between CSV and Parquet with type preservation and compression."
    >
      <DropZone
        accept={[".csv", ".parquet"]}
        onFile={(file) => console.log("Convert file:", file.name)}
        label="Drop a CSV or Parquet file"
      />
    </ToolPage>
  );
}
