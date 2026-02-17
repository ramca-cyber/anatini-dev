import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is CSV Splitting?", content: "CSV splitting divides a large data file into smaller, more manageable pieces. Split by a fixed row count (e.g., every 1000 rows) or by column value (e.g., one file per unique city). This is essential for batch processing, email attachment limits, and tools with row limits." },
  howToUse: "Upload a data file. Choose split mode: by row count or by column value. For row-based splitting, set the number of rows per part. For column-based, select which column to split by. Click 'Split' to see all parts, then download individually.",
  faqs: [
    { question: "What file formats are supported?", answer: "CSV, TSV, JSON/JSONL, and Parquet files are all supported as input. Output is always CSV." },
    { question: "Can I download all parts at once?", answer: "Currently each part is downloaded individually. A zip download may be added in the future." },
    { question: "Is there a limit on the number of parts?", answer: "No hard limit, but splitting into hundreds of parts may slow the browser. Column-based splitting with very high cardinality columns is not recommended." },
  ],
};

export default data;
