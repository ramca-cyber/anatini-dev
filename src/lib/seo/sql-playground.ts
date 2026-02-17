import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is the SQL Playground?", content: "The SQL Playground lets you write and execute SQL queries against local files (CSV, Parquet, JSON, Excel) using DuckDB's full SQL dialect — entirely in your browser. DuckDB supports window functions, CTEs, joins, aggregations, and more. Excel files with multiple sheets are imported as separate tables." },
  howToUse: "Load one or more files (CSV, Parquet, JSON, or Excel), then write SQL queries referencing them as tables. Excel workbooks with multiple sheets become separate tables automatically. Click Run to execute. Results appear in a data table below. Export results as CSV, Parquet, or JSON.",
  faqs: [
    { question: "What SQL features are supported?", answer: "Full DuckDB SQL: JOINs, CTEs, window functions, aggregations, subqueries, UNNEST, PIVOT, and hundreds of built-in functions." },
    { question: "Can I query multiple files together?", answer: "Yes — load multiple files and they become separate tables you can JOIN or UNION in your queries." },
    { question: "Does it support Excel files?", answer: "Yes — upload .xlsx or .xls files and each sheet becomes a separate table you can query with SQL." },
    { question: "Is there a row limit?", answer: "Display is limited to keep the browser responsive, but queries execute against the full dataset." },
    { question: "Can I save my queries?", answer: "Queries are stored in your browser session. They're lost when you close the tab — there's no server to persist them." },
  ],
};

export default data;
