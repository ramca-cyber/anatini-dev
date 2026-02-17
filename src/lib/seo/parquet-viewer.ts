import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Parquet Viewer?", content: "A Parquet viewer lets you inspect the contents of Apache Parquet files — a columnar format commonly used in data engineering and analytics. This viewer shows data, schema (column types), and file metadata like row groups and compression." },
  howToUse: "Upload a Parquet file to explore three tabs: Data (searchable table preview), Schema (column names and types), and Metadata (file-level details like row groups and compression). Export to CSV or JSON directly from the viewer.",
  faqs: [
    { question: "Can I view large Parquet files?", answer: "Yes — the viewer loads a preview of up to 200 rows but can handle much larger files for metadata inspection. Very large files may be slow due to browser memory constraints." },
    { question: "What metadata is available?", answer: "Row group information, compression details, column encodings, and file-level statistics when available in the Parquet metadata." },
    { question: "Can I export to other formats?", answer: "Yes — export to CSV or JSON directly from the viewer using the export buttons." },
  ],
};

export default data;
