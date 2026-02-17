import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Regex Row Filtering?", content: "Regex (regular expression) filtering lets you search for rows where a column's value matches a pattern. It's a power-user tool for finding specific data like email addresses, phone numbers, error codes, or any structured text pattern in large datasets." },
  howToUse: "Upload a data file, select the column to search, and enter a regex pattern. Optionally toggle case sensitivity or invert the match to exclude rows. Click 'Filter' to see matching rows, then download the filtered result as CSV.",
  faqs: [
    { question: "What regex syntax is supported?", answer: "DuckDB uses RE2-compatible regex syntax. Common patterns like character classes ([A-Z]), quantifiers (+, *, ?), anchors (^, $), and groups are fully supported." },
    { question: "Can I filter on multiple columns?", answer: "Currently one column at a time. For multi-column filtering, use the SQL Playground with regexp_matches() on multiple columns." },
    { question: "What does 'Invert match' do?", answer: "When enabled, rows that do NOT match the pattern are returned instead — useful for excluding specific patterns from your dataset." },
  ],
};

export default data;
