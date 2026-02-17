import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a JSON Formatter?", content: "A JSON formatter takes raw or minified JSON and displays it in a human-readable format with proper indentation. It can also minify JSON (remove whitespace), validate syntax, sort keys alphabetically, and display data as an interactive tree." },
  howToUse: "Paste or type JSON in the input area. Click Format to pretty-print with your chosen indentation, Minify to compress, or Validate to check syntax. Switch between Formatted and Tree views. Copy or download the result.",
  faqs: [
    { question: "Does it support large JSON files?", answer: "The formatter works with JSON pasted into the text area. For very large files (10MB+), consider using the CSV/Parquet conversion tools instead." },
    { question: "Is the tree view interactive?", answer: "Yes — you can expand and collapse nodes in the tree view to navigate complex JSON structures." },
    { question: "Does sorting keys change the data?", answer: "Sorting only reorders object keys alphabetically — no values are modified. Arrays maintain their original order." },
    { question: "Can I format JSONL/NDJSON?", answer: "This tool is designed for standard JSON. For NDJSON files, use the JSON to CSV or JSON Flattener tools." },
  ],
};

export default data;
