import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "Why convert JSON to Parquet?", content: "Parquet is a columnar format that offers dramatically better compression and query performance compared to JSON. Converting JSON to Parquet can reduce file sizes by 50-90% while enabling fast analytical queries." },
  howToUse: "Upload a JSON or JSONL file, select your preferred compression method (Snappy, Zstd, or None), and click Convert. The tool shows the schema, conversion time, and compression ratio.",
  faqs: [
    { question: "How much smaller will my Parquet file be?", answer: "Typically 50-90% smaller than JSON, depending on data characteristics. Columnar storage and compression work especially well on repetitive data." },
    { question: "Which compression should I choose?", answer: "Snappy is fast with decent compression. Zstd offers better compression at slightly slower speed. Use None only if downstream tools don't support compression." },
    { question: "Are nested JSON objects preserved?", answer: "DuckDB maps nested objects to STRUCT types in Parquet, preserving the hierarchy. Arrays become LIST types." },
  ],
};

export default data;
