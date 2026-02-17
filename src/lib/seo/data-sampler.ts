import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Data Sampling?", content: "Data sampling extracts a representative subset from a larger dataset. Random sampling picks rows uniformly, while stratified sampling ensures proportional representation across groups (e.g., equal coverage of each category). Sampling is essential for testing, prototyping, and sharing manageable subsets of large files." },
  howToUse: "Upload a CSV, JSON, or Parquet file. Choose between sampling by row count or percentage. Optionally select a column for stratified sampling to ensure proportional representation. Click 'Sample' and download the result.",
  faqs: [
    { question: "What is stratified sampling?", answer: "Stratified sampling ensures each group (defined by a column value) is proportionally represented in the sample. For example, if 30% of your data is 'Engineering', about 30% of the sample will be too." },
    { question: "Can I get reproducible samples?", answer: "Yes — expand the 'Seed' option and enter a number. The same seed always produces the same sample from the same data." },
    { question: "What's the maximum file size?", answer: "There's no hard limit, but files over 200MB may slow your browser. All processing runs locally via DuckDB-WASM." },
  ],
};

export default data;
