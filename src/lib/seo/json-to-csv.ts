import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON to CSV conversion?", content: "Converting JSON to CSV flattens structured, potentially nested data into a flat tabular format with rows and columns. This is useful for importing data into spreadsheets, databases, or any tool that works with tabular data." },
  howToUse: "Drop a JSON or JSONL file. The tool automatically parses and flattens the data into a table. Switch between Table and Raw CSV views. Download the result as a CSV file.",
  faqs: [
    { question: "How are nested objects handled?", answer: "DuckDB automatically flattens top-level nested objects into separate columns. Deeply nested structures may need the JSON Flattener tool first." },
    { question: "Does it support NDJSON/JSONL?", answer: "Yes, both standard JSON arrays and newline-delimited JSON (JSONL) files are supported." },
    { question: "What happens with arrays in JSON?", answer: "Arrays are converted to their string representation in CSV. For more control, use the JSON Flattener tool first." },
  ],
};

export default data;
