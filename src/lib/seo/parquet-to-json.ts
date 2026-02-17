import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "Why convert Parquet to JSON?", content: "JSON is the universal data interchange format, readable by virtually every language and tool. Converting Parquet to JSON makes columnar data accessible to web apps, APIs, and tools that don't support Parquet natively." },
  howToUse: "Upload a Parquet file, choose your output format (JSON Array or NDJSON), toggle pretty-printing, and click Convert. The tool shows a data preview and conversion stats including timing and size change.",
  faqs: [
    { question: "What's the difference between JSON and NDJSON output?", answer: "JSON Array wraps all records in a single array — ideal for APIs and small datasets. NDJSON puts one object per line — better for streaming, log processing, and large datasets." },
    { question: "Will the output be larger than the Parquet file?", answer: "Almost always yes. Parquet uses columnar compression, so JSON output is typically 2-10x larger depending on data characteristics." },
    { question: "Are Parquet nested types preserved?", answer: "STRUCT and LIST types in Parquet are converted to nested JSON objects and arrays, preserving the hierarchy." },
    { question: "Is my data uploaded anywhere?", answer: "No. Everything runs locally in your browser using DuckDB-WASM. Your files never leave your machine." },
  ],
};

export default data;
