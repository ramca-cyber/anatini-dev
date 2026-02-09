import { SeoFaq } from "@/components/shared/SeoFaq";

const seoData: Record<string, { whatIs: { title: string; content: string }; howToUse: string; faqs: { question: string; answer: string }[] }> = {
  "csv-to-parquet": {
    whatIs: { title: "What is Parquet?", content: "Apache Parquet is a columnar storage format optimized for analytical workloads. It offers efficient compression, encoding schemes, and supports complex nested data structures. Parquet files are significantly smaller than equivalent CSV files and much faster to query." },
    howToUse: "Drop or click to upload a CSV file. Optionally adjust the delimiter, header, and compression settings. Click 'Convert to Parquet' to download the converted file. The conversion runs entirely in your browser using DuckDB-WASM — no data is uploaded anywhere.",
    faqs: [
      { question: "Is my data uploaded to a server?", answer: "No. All processing happens locally in your browser using WebAssembly. Your files never leave your machine." },
      { question: "What is the maximum file size supported?", answer: "There's no hard limit, but files over 200MB may slow your browser. Performance depends on your device's available memory." },
      { question: "Which compression formats are supported?", answer: "Snappy (default, fast), Zstd (better compression ratio), and None (uncompressed)." },
      { question: "Can I convert Parquet back to CSV?", answer: "Yes! This tool works both ways — drop a Parquet file and it will convert to CSV." },
    ],
  },
  "parquet-to-csv": {
    whatIs: { title: "What is CSV?", content: "CSV (Comma-Separated Values) is a plain text format for tabular data. Each line represents a row, with values separated by commas (or other delimiters). CSV is universally supported but lacks schema information and compression." },
    howToUse: "Upload a Parquet file and the tool will automatically parse it and show a preview. Click 'Convert to CSV' to download. You can customize the delimiter and quote style in the options panel.",
    faqs: [
      { question: "Will I lose data types when converting to CSV?", answer: "CSV is plain text, so type information (integers, dates, etc.) is not preserved in the file itself. However, the values are accurately converted to their string representations." },
      { question: "Can I convert large Parquet files?", answer: "Yes, but very large files (500MB+) may be slow since everything runs in your browser's memory." },
      { question: "What delimiter options are available?", answer: "Comma, tab, semicolon, and pipe delimiters are supported." },
    ],
  },
  "csv-to-json": {
    whatIs: { title: "What is JSON?", content: "JSON (JavaScript Object Notation) is a lightweight data interchange format. It's human-readable, widely supported by APIs and programming languages, and supports nested structures like objects and arrays." },
    howToUse: "Upload a CSV file, choose your output format (JSON Array or NDJSON), toggle pretty printing, and the conversion happens automatically. Copy or download the result.",
    faqs: [
      { question: "What's the difference between JSON Array and NDJSON?", answer: "JSON Array wraps all records in a single array. NDJSON (Newline-Delimited JSON) puts one JSON object per line — better for streaming and large datasets." },
      { question: "Are nested values supported?", answer: "CSV is flat by nature. If your CSV has columns with JSON-like values, they'll be converted as strings. Use the JSON Flattener tool for nested transformations." },
      { question: "Can I convert back to CSV?", answer: "Yes — use the JSON to CSV tool for the reverse conversion." },
    ],
  },
  "json-to-csv": {
    whatIs: { title: "What is JSON to CSV conversion?", content: "Converting JSON to CSV flattens structured, potentially nested data into a flat tabular format with rows and columns. This is useful for importing data into spreadsheets, databases, or any tool that works with tabular data." },
    howToUse: "Drop a JSON or JSONL file. The tool automatically parses and flattens the data into a table. Switch between Table and Raw CSV views. Download the result as a CSV file.",
    faqs: [
      { question: "How are nested objects handled?", answer: "DuckDB automatically flattens top-level nested objects into separate columns. Deeply nested structures may need the JSON Flattener tool first." },
      { question: "Does it support NDJSON/JSONL?", answer: "Yes, both standard JSON arrays and newline-delimited JSON (JSONL) files are supported." },
      { question: "What happens with arrays in JSON?", answer: "Arrays are converted to their string representation in CSV. For more control, use the JSON Flattener tool first." },
    ],
  },
  "json-to-parquet": {
    whatIs: { title: "Why convert JSON to Parquet?", content: "Parquet is a columnar format that offers dramatically better compression and query performance compared to JSON. Converting JSON to Parquet can reduce file sizes by 50-90% while enabling fast analytical queries." },
    howToUse: "Upload a JSON or JSONL file, select your preferred compression method (Snappy, Zstd, or None), and click Convert. The tool shows the schema, conversion time, and compression ratio.",
    faqs: [
      { question: "How much smaller will my Parquet file be?", answer: "Typically 50-90% smaller than JSON, depending on data characteristics. Columnar storage and compression work especially well on repetitive data." },
      { question: "Which compression should I choose?", answer: "Snappy is fast with decent compression. Zstd offers better compression at slightly slower speed. Use None only if downstream tools don't support compression." },
      { question: "Are nested JSON objects preserved?", answer: "DuckDB maps nested objects to STRUCT types in Parquet, preserving the hierarchy. Arrays become LIST types." },
    ],
  },
  "excel-csv-converter": {
    whatIs: { title: "What is Excel to CSV conversion?", content: "Excel files (.xlsx, .xls) store data in a binary format with support for multiple sheets, formulas, and formatting. CSV is a simpler plain-text format. Converting between them lets you use data across different tools and workflows." },
    howToUse: "Drop an Excel or CSV file. For Excel files, select the sheet to convert and download as CSV. For CSV files, convert to Excel format. Multi-sheet workbooks are fully supported.",
    faqs: [
      { question: "Are formulas preserved?", answer: "No — formulas are evaluated and their resulting values are exported. Only the data values are converted." },
      { question: "Can I convert specific sheets?", answer: "Yes. When you upload a multi-sheet Excel file, you can select which sheet to view and export." },
      { question: "Is formatting preserved?", answer: "No — CSV is plain text and doesn't support formatting. Only the raw cell values are converted." },
      { question: "What Excel formats are supported?", answer: "Both .xlsx (modern) and .xls (legacy) formats are supported via the SheetJS library." },
    ],
  },
  "csv-viewer": {
    whatIs: { title: "What is a CSV Viewer?", content: "A CSV viewer displays comma-separated data in a structured table format, making it easy to browse, search, and understand your data without opening a spreadsheet application. This viewer runs entirely in your browser with no uploads required." },
    howToUse: "Upload a CSV file to instantly see it in a sortable, searchable table. Click any column header to sort and view quick statistics (count, distinct values, min, max). Use the search bar to filter rows. Click 'Open in SQL Playground' to query the data with SQL.",
    faqs: [
      { question: "How many rows can it handle?", answer: "The viewer loads up to 500 rows for preview. The underlying DuckDB engine can handle millions of rows for search and statistics." },
      { question: "Can I edit the data?", answer: "This is a read-only viewer. For transformations, use the SQL Playground or other conversion tools." },
      { question: "What delimiters are auto-detected?", answer: "DuckDB auto-detects commas, tabs, semicolons, and pipe delimiters." },
    ],
  },
  "parquet-viewer": {
    whatIs: { title: "What is a Parquet Viewer?", content: "A Parquet viewer lets you inspect the contents of Apache Parquet files — a columnar format commonly used in data engineering and analytics. This viewer shows data, schema (column types), and file metadata like row groups and compression." },
    howToUse: "Upload a Parquet file to explore three tabs: Data (searchable table preview), Schema (column names and types), and Metadata (file-level details like row groups and compression). Export to CSV or JSON directly from the viewer.",
    faqs: [
      { question: "Can I view large Parquet files?", answer: "Yes — the viewer loads a preview of up to 200 rows but can handle much larger files for metadata inspection. Very large files may be slow due to browser memory constraints." },
      { question: "What metadata is available?", answer: "Row group information, compression details, column encodings, and file-level statistics when available in the Parquet metadata." },
      { question: "Can I export to other formats?", answer: "Yes — export to CSV or JSON directly from the viewer using the export buttons." },
    ],
  },
  "json-formatter": {
    whatIs: { title: "What is a JSON Formatter?", content: "A JSON formatter takes raw or minified JSON and displays it in a human-readable format with proper indentation. It can also minify JSON (remove whitespace), validate syntax, sort keys alphabetically, and display data as an interactive tree." },
    howToUse: "Paste or type JSON in the input area. Click Format to pretty-print with your chosen indentation, Minify to compress, or Validate to check syntax. Switch between Formatted and Tree views. Copy or download the result.",
    faqs: [
      { question: "Does it support large JSON files?", answer: "The formatter works with JSON pasted into the text area. For very large files (10MB+), consider using the CSV/Parquet conversion tools instead." },
      { question: "Is the tree view interactive?", answer: "Yes — you can expand and collapse nodes in the tree view to navigate complex JSON structures." },
      { question: "Does sorting keys change the data?", answer: "Sorting only reorders object keys alphabetically — no values are modified. Arrays maintain their original order." },
      { question: "Can I format JSONL/NDJSON?", answer: "This tool is designed for standard JSON. For NDJSON files, use the JSON to CSV or JSON Flattener tools." },
    ],
  },
  "sql-playground": {
    whatIs: { title: "What is the SQL Playground?", content: "The SQL Playground lets you write and execute SQL queries against local files (CSV, Parquet, JSON) using DuckDB's full SQL dialect — entirely in your browser. DuckDB supports window functions, CTEs, joins, aggregations, and more." },
    howToUse: "Load one or more files (CSV, Parquet, JSON), then write SQL queries referencing them as tables. Click Run to execute. Results appear in a data table below. Export results as CSV, Parquet, or JSON.",
    faqs: [
      { question: "What SQL features are supported?", answer: "Full DuckDB SQL: JOINs, CTEs, window functions, aggregations, subqueries, UNNEST, PIVOT, and hundreds of built-in functions." },
      { question: "Can I query multiple files together?", answer: "Yes — load multiple files and they become separate tables you can JOIN or UNION in your queries." },
      { question: "Is there a row limit?", answer: "Display is limited to keep the browser responsive, but queries execute against the full dataset." },
      { question: "Can I save my queries?", answer: "Queries are stored in your browser session. They're lost when you close the tab — there's no server to persist them." },
    ],
  },
  "data-profiler": {
    whatIs: { title: "What is Data Profiling?", content: "Data profiling analyzes a dataset to discover its structure, content, and quality. It reveals null counts, duplicate rates, value distributions, outliers, and data type information — essential for understanding new datasets and catching quality issues early." },
    howToUse: "Upload a CSV, Parquet, or JSON file. The profiler automatically analyzes every column, showing null counts, distinct values, min/max, and common patterns. Use the overview tab for a summary or drill into individual columns.",
    faqs: [
      { question: "What quality issues does it detect?", answer: "Null/missing values, duplicate rows, high cardinality, potential outliers, and columns with uniform (constant) values." },
      { question: "Can I profile large datasets?", answer: "Yes — DuckDB handles large files efficiently. Profiling millions of rows is feasible, though it may take longer on very large datasets." },
      { question: "What file formats are supported?", answer: "CSV, Parquet, and JSON/JSONL files are all supported." },
    ],
  },
  "json-flattener": {
    whatIs: { title: "What is JSON Flattening?", content: "JSON flattening transforms deeply nested JSON objects into a flat, tabular structure. Nested keys are concatenated with a separator (e.g., address.city becomes a column name). This makes nested data compatible with spreadsheets, databases, and analytical tools." },
    howToUse: "Upload a JSON or JSONL file. Choose your separator (dot, underscore), naming convention, and array handling preferences. The tool recursively expands nested objects and arrays into flat columns, displayed in a data table. Download the result as CSV.",
    faqs: [
      { question: "How deep does flattening go?", answer: "The tool recursively flattens up to 10 levels deep, which covers virtually all real-world JSON structures." },
      { question: "How are arrays handled?", answer: "Arrays can be unnested (one row per element) or kept as-is depending on your settings." },
      { question: "What separator options are available?", answer: "Dot (address.city) and underscore (address_city) separators are supported." },
    ],
  },
  "schema-generator": {
    whatIs: { title: "What is a Schema Generator?", content: "A schema generator inspects your data and produces DDL (Data Definition Language) statements — CREATE TABLE SQL — for various database systems. It infers column types from your data and maps them to the target dialect's type system." },
    howToUse: "Upload a CSV, Parquet, or JSON file. The tool infers types for each column and generates CREATE TABLE statements. Choose your target dialect (PostgreSQL, MySQL, BigQuery, Snowflake, DuckDB). Copy or download the DDL.",
    faqs: [
      { question: "Which databases are supported?", answer: "PostgreSQL, MySQL, BigQuery, Snowflake, and DuckDB. Each has its own type mappings." },
      { question: "How accurate is type inference?", answer: "DuckDB's type inference is quite good — it detects integers, floats, dates, timestamps, booleans, and strings. Review the generated schema and adjust types if needed." },
      { question: "Can I customize the generated types?", answer: "The current version uses automatic type mapping. You can copy the DDL and edit it manually for fine-tuning." },
    ],
  },
  "csv-to-sql": {
    whatIs: { title: "What is CSV to SQL?", content: "CSV to SQL generates executable SQL statements (CREATE TABLE + INSERT) from your CSV data. This is useful for importing data into databases, creating seed scripts, or migrating data between systems." },
    howToUse: "Upload a CSV file. Choose your target dialect, table name, batch size, and whether to include DROP TABLE. The tool generates a complete SQL script with CREATE TABLE and batched INSERT statements. Download or copy the output.",
    faqs: [
      { question: "How are types determined?", answer: "DuckDB infers types from the CSV data, then maps them to the selected database dialect's type system." },
      { question: "What batch sizes are available?", answer: "50, 100, 500, or 1000 rows per INSERT statement. Larger batches are more efficient but some databases have limits." },
      { question: "Can I customize column types?", answer: "The schema preview shows inferred types. Currently you can't edit them in the UI — copy the SQL and adjust manually if needed." },
      { question: "Which SQL dialects are supported?", answer: "PostgreSQL, MySQL, SQLite, and BigQuery." },
    ],
  },
  "diff": {
    whatIs: { title: "What is Dataset Diff?", content: "Dataset diff compares two versions of a dataset side-by-side to identify added, removed, and modified rows. It's essential for tracking data changes, validating ETL pipelines, and auditing data transformations." },
    howToUse: "Upload two files (before and after). Select a key column to match rows between versions. The tool highlights added (green), removed (red), and modified (yellow) rows. Filter by change type and download the diff report.",
    faqs: [
      { question: "What file formats are supported?", answer: "CSV and Parquet files. Both files should have the same schema (column names)." },
      { question: "How are modified rows detected?", answer: "Rows are matched by the selected key column. If a key exists in both files but values differ in other columns, the row is marked as modified." },
      { question: "Can I compare large datasets?", answer: "Yes — DuckDB handles the comparison efficiently. However, very large result sets may be slow to render in the browser." },
    ],
  },
};

export function getToolSeo(toolId: string) {
  const data = seoData[toolId];
  if (!data) return null;
  return <SeoFaq whatIs={data.whatIs} howToUse={data.howToUse} faqs={data.faqs} />;
}
