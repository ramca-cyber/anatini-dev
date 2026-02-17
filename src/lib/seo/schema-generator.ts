import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Schema Generator?", content: "A schema generator inspects your data and produces DDL (Data Definition Language) statements — CREATE TABLE SQL — for various database systems. It infers column types from your data and maps them to the target dialect's type system." },
  howToUse: "Upload a CSV, Parquet, or JSON file. The tool infers types for each column and generates CREATE TABLE statements. Choose your target dialect (PostgreSQL, MySQL, BigQuery, Snowflake, DuckDB). Copy or download the DDL.",
  faqs: [
    { question: "Which databases are supported?", answer: "PostgreSQL, MySQL, BigQuery, Snowflake, and DuckDB. Each has its own type mappings." },
    { question: "How accurate is type inference?", answer: "DuckDB's type inference is quite good — it detects integers, floats, dates, timestamps, booleans, and strings. Review the generated schema and adjust types if needed." },
    { question: "Can I customize the generated types?", answer: "The current version uses automatic type mapping. You can copy the DDL and edit it manually for fine-tuning." },
  ],
};

export default data;
