import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a CSV Inspector?", content: "A CSV Inspector analyzes the structural properties of CSV files — encoding, delimiter, line endings, column types, null patterns, and data quality issues. Unlike a data profiler which focuses on statistical distributions, the inspector focuses on file format and parsing characteristics." },
  howToUse: "Upload a CSV file and the inspector automatically analyzes encoding (UTF-8, BOM detection), delimiter, line endings, column types, null counts, unique values, and potential issues. Results are displayed in organized sections with warnings for common problems.",
  faqs: [
    { question: "What's the difference between CSV Inspector and Data Profiler?", answer: "CSV Inspector focuses on the file's structural properties (encoding, delimiter, format issues). Data Profiler focuses on the data itself (distributions, statistics, correlations, quality scores)." },
    { question: "What is a BOM?", answer: "A Byte Order Mark (BOM) is a special character at the start of a file that indicates encoding. UTF-8 BOM is 3 bytes (EF BB BF). Some tools like Excel add it automatically." },
    { question: "Why does my CSV have inconsistent column counts?", answer: "Usually this means some values contain unescaped delimiters or newlines. Check if text fields containing commas are properly quoted." },
  ],
};

export default data;
