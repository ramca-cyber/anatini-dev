import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Delimited File Viewer?", content: "A delimited file viewer displays comma-separated (CSV), tab-separated (TSV), or custom-delimited data in a structured table format. It auto-detects the delimiter and lets you override it manually. Search, sort, and explore data without opening a spreadsheet." },
  howToUse: "Upload a CSV, TSV, DSV, or TXT file. The viewer auto-detects the delimiter (comma, tab, semicolon, pipe) and displays data in a sortable, searchable table. Override the delimiter if needed. Click column headers for statistics.",
  faqs: [
    { question: "What delimiters are supported?", answer: "Auto-detection supports comma, tab, semicolon, and pipe. You can also set a custom single-character delimiter manually." },
    { question: "Can I view TSV and DSV files?", answer: "Yes — upload .tsv, .dsv, or .txt files. The viewer auto-detects tabs and other delimiters." },
    { question: "How many rows can it handle?", answer: "The viewer loads up to 200 rows per page. The underlying DuckDB engine can handle millions of rows for search and statistics." },
    { question: "Can I edit the data?", answer: "This is a read-only viewer. For transformations, use the SQL Playground or other conversion tools." },
  ],
};

export default data;
