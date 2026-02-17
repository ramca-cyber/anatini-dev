import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Parquet Inspector?", content: "A Parquet Inspector provides deep visibility into Apache Parquet file internals — row group structure, column encodings, compression statistics, min/max values, and file-level metadata. It helps understand how data is physically stored and optimized." },
  howToUse: "Upload a Parquet file to see file overview, column schema with physical/logical types, row group details with compression ratios, key-value metadata, and a data preview. Navigate between tabs to explore different aspects.",
  faqs: [
    { question: "What is a row group?", answer: "A row group is a horizontal partition of data in a Parquet file. Each row group contains all column data for a subset of rows. Larger row groups = fewer I/O operations but more memory usage." },
    { question: "What does dictionary encoding mean?", answer: "Dictionary encoding replaces repeated values with short integer codes. It's very efficient for columns with many repeated values (like country names or status codes)." },
    { question: "What is the 'created by' field?", answer: "It shows which software wrote the Parquet file. Common values: Apache Spark, Apache Arrow, Pandas, DuckDB. This helps diagnose compatibility issues." },
  ],
};

export default data;
