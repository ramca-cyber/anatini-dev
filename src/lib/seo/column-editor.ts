import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Column Editor?", content: "A column editor lets you visually manage the columns in your dataset — include or exclude columns, drag to reorder them, and rename with aliases. It's essential for data preparation before importing into databases, sharing, or analysis." },
  howToUse: "Upload a data file to see all columns listed. Toggle the eye icon to include/exclude columns. Drag rows to reorder. Type in the rename field to add aliases. Click 'Apply Changes' to preview, then download the result.",
  faqs: [
    { question: "What file formats are supported?", answer: "CSV, TSV, JSON/JSONL, and Parquet files are all supported." },
    { question: "Can I rename columns?", answer: "Yes — type a new name in the 'Rename' field next to any column. The original column name is preserved until you export." },
    { question: "Does reordering change the original file?", answer: "No — your original file is never modified. Changes only apply to the exported output." },
  ],
};

export default data;
