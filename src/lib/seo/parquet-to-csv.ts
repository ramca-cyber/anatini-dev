import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is CSV?", content: "CSV (Comma-Separated Values) is a plain text format for tabular data. Each line represents a row, with values separated by commas (or other delimiters). CSV is universally supported but lacks schema information and compression." },
  howToUse: "Upload a Parquet file and the tool will automatically parse it and show a preview. Click 'Convert to CSV' to download. You can customize the delimiter and quote style in the options panel.",
  faqs: [
    { question: "Will I lose data types when converting to CSV?", answer: "CSV is plain text, so type information (integers, dates, etc.) is not preserved in the file itself. However, the values are accurately converted to their string representations." },
    { question: "Can I convert large Parquet files?", answer: "Yes, but very large files (500MB+) may be slow since everything runs in your browser's memory." },
    { question: "What delimiter options are available?", answer: "Comma, tab, semicolon, and pipe delimiters are supported." },
  ],
};

export default data;
