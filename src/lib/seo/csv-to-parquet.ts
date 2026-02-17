import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Parquet?", content: "Apache Parquet is a columnar storage format optimized for analytical workloads. It offers efficient compression, encoding schemes, and supports complex nested data structures. Parquet files are significantly smaller than equivalent CSV files and much faster to query." },
  howToUse: "Drop or click to upload a CSV file. Optionally adjust the delimiter, header, and compression settings. Click 'Convert to Parquet' to download the converted file. The conversion runs entirely in your browser using DuckDB-WASM — no data is uploaded anywhere.",
  faqs: [
    { question: "Is my data uploaded to a server?", answer: "No. All processing happens locally in your browser using WebAssembly. Your files never leave your machine." },
    { question: "What is the maximum file size supported?", answer: "There's no hard limit, but files over 200MB may slow your browser. Performance depends on your device's available memory." },
    { question: "Which compression formats are supported?", answer: "Snappy (default, fast), Zstd (better compression ratio), and None (uncompressed)." },
    { question: "Can I convert Parquet back to CSV?", answer: "Yes! This tool works both ways — drop a Parquet file and it will convert to CSV." },
  ],
};

export default data;
