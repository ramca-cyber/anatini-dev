import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Markdown Table?", content: "Markdown tables are a lightweight syntax for displaying tabular data in plain text. They're widely used in GitHub READMEs, documentation, issue trackers, and static site generators. Each column is separated by pipes (|) with a header separator row." },
  howToUse: "Upload a CSV, JSON, or Parquet file, or paste CSV data directly. Choose alignment (left, center, right) and max rows. The tool generates a properly formatted Markdown table you can copy to clipboard or download as a .md file.",
  faqs: [
    { question: "What file formats are supported?", answer: "CSV, JSON/JSONL, and Parquet files. You can also paste CSV data directly." },
    { question: "Is there a row limit?", answer: "You can generate tables up to 1,000 rows. For larger datasets, consider using a subset — very large Markdown tables are hard to read anyway." },
    { question: "Can I use this for GitHub READMEs?", answer: "Yes — the output is standard GitHub Flavored Markdown (GFM) table syntax, compatible with GitHub, GitLab, Notion, and most Markdown renderers." },
  ],
};

export default data;
