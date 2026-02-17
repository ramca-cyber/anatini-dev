import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is CSV to SQL?", content: "CSV to SQL generates executable SQL statements (CREATE TABLE + INSERT) from your CSV data. This is useful for importing data into databases, creating seed scripts, or migrating data between systems." },
  howToUse: "Upload a CSV file. Choose your target dialect, table name, batch size, and whether to include DROP TABLE. The tool generates a complete SQL script with CREATE TABLE and batched INSERT statements. Download or copy the output.",
  faqs: [
    { question: "How are types determined?", answer: "DuckDB infers types from the CSV data, then maps them to the selected database dialect's type system." },
    { question: "What batch sizes are available?", answer: "50, 100, 500, or 1000 rows per INSERT statement. Larger batches are more efficient but some databases have limits." },
    { question: "Can I customize column types?", answer: "The schema preview shows inferred types. Currently you can't edit them in the UI — copy the SQL and adjust manually if needed." },
    { question: "Which SQL dialects are supported?", answer: "PostgreSQL, MySQL, SQLite, and BigQuery." },
  ],
};

export default data;
