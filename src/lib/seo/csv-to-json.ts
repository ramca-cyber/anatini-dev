import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON?", content: "JSON (JavaScript Object Notation) is a lightweight data interchange format. It's human-readable, widely supported by APIs and programming languages, and supports nested structures like objects and arrays." },
  howToUse: "Upload a CSV file, choose your output format (JSON Array or NDJSON), toggle pretty printing, and the conversion happens automatically. Copy or download the result.",
  faqs: [
    { question: "What's the difference between JSON Array and NDJSON?", answer: "JSON Array wraps all records in a single array. NDJSON (Newline-Delimited JSON) puts one JSON object per line — better for streaming and large datasets." },
    { question: "Are nested values supported?", answer: "CSV is flat by nature. If your CSV has columns with JSON-like values, they'll be converted as strings. Use the JSON Flattener tool for nested transformations." },
    { question: "Can I convert back to CSV?", answer: "Yes — use the JSON to CSV tool for the reverse conversion." },
  ],
};

export default data;
