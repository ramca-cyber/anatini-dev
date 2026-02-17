import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a SQL Formatter?", content: "A SQL formatter takes messy or minified SQL queries and reformats them with proper indentation, keyword casing, and line breaks. It supports multiple SQL dialects and helps improve readability, code reviews, and documentation." },
  howToUse: "Paste your SQL in the input area. Choose your dialect (Standard SQL, PostgreSQL, MySQL, BigQuery, SQLite, SQL Server), keyword casing, and indentation. Click Format to beautify or Minify to compress. Copy or download the result.",
  faqs: [
    { question: "Which SQL dialects are supported?", answer: "Standard SQL, PostgreSQL, MySQL, BigQuery, SQLite, and SQL Server (T-SQL). Each dialect has specific keyword and syntax awareness." },
    { question: "Does formatting change my query's behavior?", answer: "No — formatting only changes whitespace and keyword casing. The query logic is preserved exactly." },
    { question: "Can I format stored procedures or DDL?", answer: "Yes — the formatter handles CREATE TABLE, ALTER, INSERT, and procedural SQL. Complex PL/pgSQL may have limited support." },
  ],
};

export default data;
