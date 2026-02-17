import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Data Profiling?", content: "Data profiling analyzes a dataset to discover its structure, content, and quality. It reveals null counts, duplicate rates, value distributions, outliers, and data type information — essential for understanding new datasets and catching quality issues early." },
  howToUse: "Upload a CSV, Parquet, or JSON file. The profiler automatically analyzes every column, showing null counts, distinct values, min/max, and common patterns. Use the overview tab for a summary or drill into individual columns.",
  faqs: [
    { question: "What quality issues does it detect?", answer: "Null/missing values, duplicate rows, high cardinality, potential outliers, and columns with uniform (constant) values." },
    { question: "Can I profile large datasets?", answer: "Yes — DuckDB handles large files efficiently. Profiling millions of rows is feasible, though it may take longer on very large datasets." },
    { question: "What file formats are supported?", answer: "CSV, Parquet, and JSON/JSONL files are all supported." },
  ],
};

export default data;
