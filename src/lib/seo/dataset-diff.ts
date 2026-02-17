import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Dataset Diff?", content: "Dataset diff compares two versions of a dataset side-by-side to identify added, removed, and modified rows. It's essential for tracking data changes, validating ETL pipelines, and auditing data transformations." },
  howToUse: "Upload two files (before and after). Select a key column to match rows between versions. The tool highlights added (green), removed (red), and modified (yellow) rows. Filter by change type and download the diff report.",
  faqs: [
    { question: "What file formats are supported?", answer: "CSV and Parquet files. Both files should have the same schema (column names)." },
    { question: "How are modified rows detected?", answer: "Rows are matched by the selected key column. If a key exists in both files but values differ in other columns, the row is marked as modified." },
    { question: "Can I compare large datasets?", answer: "Yes — DuckDB handles the comparison efficiently. However, very large result sets may be slow to render in the browser." },
  ],
};

export default data;
