import { SeoFaq } from "@/components/shared/SeoFaq";

const seoData: Record<string, { whatIs: { title: string; content: string }; howToUse: string; metaDescription: string; faqs: { question: string; answer: string }[] }> = {
  "csv-to-parquet": {
    metaDescription: "Convert CSV files to Apache Parquet format with Snappy or Zstd compression. Free, offline, runs in your browser with DuckDB-WASM.",
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
    metaDescription: "Export Apache Parquet files to CSV format. Free, offline browser tool powered by DuckDB-WASM. No uploads required.",
    whatIs: { title: "What is CSV?", content: "CSV (Comma-Separated Values) is a plain text format for tabular data. Each line represents a row, with values separated by commas (or other delimiters). CSV is universally supported but lacks schema information and compression." },
    howToUse: "Upload a Parquet file and the tool will automatically parse it and show a preview. Click 'Convert to CSV' to download. You can customize the delimiter and quote style in the options panel.",
    faqs: [
      { question: "Will I lose data types when converting to CSV?", answer: "CSV is plain text, so type information (integers, dates, etc.) is not preserved in the file itself. However, the values are accurately converted to their string representations." },
      { question: "Can I convert large Parquet files?", answer: "Yes, but very large files (500MB+) may be slow since everything runs in your browser's memory." },
      { question: "What delimiter options are available?", answer: "Comma, tab, semicolon, and pipe delimiters are supported." },
    ],
  },
  "csv-to-json": {
    metaDescription: "Convert CSV files to JSON Array or NDJSON format. Free, offline tool with pretty-print and download. No data leaves your browser.",
    whatIs: { title: "What is JSON?", content: "JSON (JavaScript Object Notation) is a lightweight data interchange format. It's human-readable, widely supported by APIs and programming languages, and supports nested structures like objects and arrays." },
    howToUse: "Upload a CSV file, choose your output format (JSON Array or NDJSON), toggle pretty printing, and the conversion happens automatically. Copy or download the result.",
    faqs: [
      { question: "What's the difference between JSON Array and NDJSON?", answer: "JSON Array wraps all records in a single array. NDJSON (Newline-Delimited JSON) puts one JSON object per line — better for streaming and large datasets." },
      { question: "Are nested values supported?", answer: "CSV is flat by nature. If your CSV has columns with JSON-like values, they'll be converted as strings. Use the JSON Flattener tool for nested transformations." },
      { question: "Can I convert back to CSV?", answer: "Yes — use the JSON to CSV tool for the reverse conversion." },
    ],
  },
  "json-to-csv": {
    metaDescription: "Convert JSON and NDJSON files to CSV format. Flatten nested objects into tabular data. Free, offline browser tool.",
    whatIs: { title: "What is JSON to CSV conversion?", content: "Converting JSON to CSV flattens structured, potentially nested data into a flat tabular format with rows and columns. This is useful for importing data into spreadsheets, databases, or any tool that works with tabular data." },
    howToUse: "Drop a JSON or JSONL file. The tool automatically parses and flattens the data into a table. Switch between Table and Raw CSV views. Download the result as a CSV file.",
    faqs: [
      { question: "How are nested objects handled?", answer: "DuckDB automatically flattens top-level nested objects into separate columns. Deeply nested structures may need the JSON Flattener tool first." },
      { question: "Does it support NDJSON/JSONL?", answer: "Yes, both standard JSON arrays and newline-delimited JSON (JSONL) files are supported." },
      { question: "What happens with arrays in JSON?", answer: "Arrays are converted to their string representation in CSV. For more control, use the JSON Flattener tool first." },
    ],
  },
  "json-to-parquet": {
    metaDescription: "Convert JSON files to Parquet with Snappy or Zstd compression. Reduce file size by 50-90%. Free, offline browser tool.",
    whatIs: { title: "Why convert JSON to Parquet?", content: "Parquet is a columnar format that offers dramatically better compression and query performance compared to JSON. Converting JSON to Parquet can reduce file sizes by 50-90% while enabling fast analytical queries." },
    howToUse: "Upload a JSON or JSONL file, select your preferred compression method (Snappy, Zstd, or None), and click Convert. The tool shows the schema, conversion time, and compression ratio.",
    faqs: [
      { question: "How much smaller will my Parquet file be?", answer: "Typically 50-90% smaller than JSON, depending on data characteristics. Columnar storage and compression work especially well on repetitive data." },
      { question: "Which compression should I choose?", answer: "Snappy is fast with decent compression. Zstd offers better compression at slightly slower speed. Use None only if downstream tools don't support compression." },
      { question: "Are nested JSON objects preserved?", answer: "DuckDB maps nested objects to STRUCT types in Parquet, preserving the hierarchy. Arrays become LIST types." },
    ],
  },
  "parquet-to-json": {
    metaDescription: "Convert Parquet files to JSON Array or NDJSON. Preserves nested types. Free, offline browser tool powered by DuckDB-WASM.",
    whatIs: { title: "Why convert Parquet to JSON?", content: "JSON is the universal data interchange format, readable by virtually every language and tool. Converting Parquet to JSON makes columnar data accessible to web apps, APIs, and tools that don't support Parquet natively." },
    howToUse: "Upload a Parquet file, choose your output format (JSON Array or NDJSON), toggle pretty-printing, and click Convert. The tool shows a data preview and conversion stats including timing and size change.",
    faqs: [
      { question: "What's the difference between JSON and NDJSON output?", answer: "JSON Array wraps all records in a single array — ideal for APIs and small datasets. NDJSON puts one object per line — better for streaming, log processing, and large datasets." },
      { question: "Will the output be larger than the Parquet file?", answer: "Almost always yes. Parquet uses columnar compression, so JSON output is typically 2-10x larger depending on data characteristics." },
      { question: "Are Parquet nested types preserved?", answer: "STRUCT and LIST types in Parquet are converted to nested JSON objects and arrays, preserving the hierarchy." },
      { question: "Is my data uploaded anywhere?", answer: "No. Everything runs locally in your browser using DuckDB-WASM. Your files never leave your machine." },
    ],
  },
  "excel-to-csv": {
    metaDescription: "Convert Excel (XLSX, XLS) files to CSV with multi-sheet export. Free, offline browser tool. No uploads.",
    whatIs: { title: "What is Excel to CSV conversion?", content: "Excel files (.xlsx, .xls) store data in a binary format with support for multiple sheets, formulas, and formatting. CSV is a simpler plain-text format. Converting Excel to CSV makes your data accessible to any tool that reads text files." },
    howToUse: "Drop an Excel file. Select which sheets to export, preview the data, and download as CSV. Multi-sheet workbooks are fully supported — export one sheet or all at once.",
    faqs: [
      { question: "Are formulas preserved?", answer: "No — formulas are evaluated and their resulting values are exported. Only the data values are converted." },
      { question: "Can I convert specific sheets?", answer: "Yes. When you upload a multi-sheet Excel file, you can select which sheets to view and export individually." },
      { question: "Is formatting preserved?", answer: "No — CSV is plain text and doesn't support formatting. Only the raw cell values are converted." },
      { question: "What Excel formats are supported?", answer: "Both .xlsx (modern) and .xls (legacy) formats are supported via the SheetJS library." },
    ],
  },
  "csv-to-excel": {
    metaDescription: "Convert CSV files to Excel (XLSX) with multi-sheet support. Combine multiple CSVs into one workbook. Free, offline browser tool.",
    whatIs: { title: "What is CSV to Excel conversion?", content: "CSV to Excel conversion takes plain-text tabular data and packages it into an Excel workbook (.xlsx). You can combine multiple CSV files into separate sheets within a single workbook, making it easy to organize related datasets." },
    howToUse: "Drop a CSV file to start. Add more CSV files to create a multi-sheet Excel workbook. Name each sheet, then download the combined .xlsx file.",
    faqs: [
      { question: "Can I combine multiple CSVs into one Excel file?", answer: "Yes! Add multiple CSV files and each one becomes a named sheet in the output Excel workbook." },
      { question: "Is my data uploaded anywhere?", answer: "No. All processing happens locally in your browser using the SheetJS library. Your files never leave your machine." },
      { question: "What output format is used?", answer: "The output is a modern .xlsx file compatible with Excel, Google Sheets, LibreOffice, and other spreadsheet applications." },
      { question: "Are data types preserved?", answer: "SheetJS infers numeric and date types from your CSV data. Review the output to ensure types are mapped correctly." },
    ],
  },
  "excel-csv-converter": {
    metaDescription: "Convert Excel (XLSX, XLS) to CSV and CSV to Excel. Multi-sheet support. Free, offline browser tool. No uploads.",
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
    metaDescription: "View CSV, TSV, and delimited files in a sortable, searchable table with column statistics. Auto-detect or set custom delimiters. Free, offline.",
    whatIs: { title: "What is a Delimited File Viewer?", content: "A delimited file viewer displays comma-separated (CSV), tab-separated (TSV), or custom-delimited data in a structured table format. It auto-detects the delimiter and lets you override it manually. Search, sort, and explore data without opening a spreadsheet." },
    howToUse: "Upload a CSV, TSV, DSV, or TXT file. The viewer auto-detects the delimiter (comma, tab, semicolon, pipe) and displays data in a sortable, searchable table. Override the delimiter if needed. Click column headers for statistics.",
    faqs: [
      { question: "What delimiters are supported?", answer: "Auto-detection supports comma, tab, semicolon, and pipe. You can also set a custom single-character delimiter manually." },
      { question: "Can I view TSV and DSV files?", answer: "Yes — upload .tsv, .dsv, or .txt files. The viewer auto-detects tabs and other delimiters." },
      { question: "How many rows can it handle?", answer: "The viewer loads up to 200 rows per page. The underlying DuckDB engine can handle millions of rows for search and statistics." },
      { question: "Can I edit the data?", answer: "This is a read-only viewer. For transformations, use the SQL Playground or other conversion tools." },
    ],
  },
  "parquet-viewer": {
    metaDescription: "View Parquet file data, schema, and metadata in your browser. Export to CSV or JSON. Free, offline tool.",
    whatIs: { title: "What is a Parquet Viewer?", content: "A Parquet viewer lets you inspect the contents of Apache Parquet files — a columnar format commonly used in data engineering and analytics. This viewer shows data, schema (column types), and file metadata like row groups and compression." },
    howToUse: "Upload a Parquet file to explore three tabs: Data (searchable table preview), Schema (column names and types), and Metadata (file-level details like row groups and compression). Export to CSV or JSON directly from the viewer.",
    faqs: [
      { question: "Can I view large Parquet files?", answer: "Yes — the viewer loads a preview of up to 200 rows but can handle much larger files for metadata inspection. Very large files may be slow due to browser memory constraints." },
      { question: "What metadata is available?", answer: "Row group information, compression details, column encodings, and file-level statistics when available in the Parquet metadata." },
      { question: "Can I export to other formats?", answer: "Yes — export to CSV or JSON directly from the viewer using the export buttons." },
    ],
  },
  "json-formatter": {
    metaDescription: "Format, minify, validate, and sort JSON with tree view. Free, offline JSON formatter in your browser.",
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
    metaDescription: "Run SQL queries on local CSV, Parquet, JSON, and Excel files with full DuckDB syntax. JOINs, CTEs, window functions. Free, offline.",
    whatIs: { title: "What is the SQL Playground?", content: "The SQL Playground lets you write and execute SQL queries against local files (CSV, Parquet, JSON, Excel) using DuckDB's full SQL dialect — entirely in your browser. DuckDB supports window functions, CTEs, joins, aggregations, and more. Excel files with multiple sheets are imported as separate tables." },
    howToUse: "Load one or more files (CSV, Parquet, JSON, or Excel), then write SQL queries referencing them as tables. Excel workbooks with multiple sheets become separate tables automatically. Click Run to execute. Results appear in a data table below. Export results as CSV, Parquet, or JSON.",
    faqs: [
      { question: "What SQL features are supported?", answer: "Full DuckDB SQL: JOINs, CTEs, window functions, aggregations, subqueries, UNNEST, PIVOT, and hundreds of built-in functions." },
      { question: "Can I query multiple files together?", answer: "Yes — load multiple files and they become separate tables you can JOIN or UNION in your queries." },
      { question: "Does it support Excel files?", answer: "Yes — upload .xlsx or .xls files and each sheet becomes a separate table you can query with SQL." },
      { question: "Is there a row limit?", answer: "Display is limited to keep the browser responsive, but queries execute against the full dataset." },
      { question: "Can I save my queries?", answer: "Queries are stored in your browser session. They're lost when you close the tab — there's no server to persist them." },
    ],
  },
  "data-profiler": {
    metaDescription: "Profile datasets to discover nulls, duplicates, outliers, and data quality issues. Free, offline browser tool.",
    whatIs: { title: "What is Data Profiling?", content: "Data profiling analyzes a dataset to discover its structure, content, and quality. It reveals null counts, duplicate rates, value distributions, outliers, and data type information — essential for understanding new datasets and catching quality issues early." },
    howToUse: "Upload a CSV, Parquet, or JSON file. The profiler automatically analyzes every column, showing null counts, distinct values, min/max, and common patterns. Use the overview tab for a summary or drill into individual columns.",
    faqs: [
      { question: "What quality issues does it detect?", answer: "Null/missing values, duplicate rows, high cardinality, potential outliers, and columns with uniform (constant) values." },
      { question: "Can I profile large datasets?", answer: "Yes — DuckDB handles large files efficiently. Profiling millions of rows is feasible, though it may take longer on very large datasets." },
      { question: "What file formats are supported?", answer: "CSV, Parquet, and JSON/JSONL files are all supported." },
    ],
  },
  "json-flattener": {
    metaDescription: "Flatten deeply nested JSON into tabular format. Configurable separators and array handling. Free, offline tool.",
    whatIs: { title: "What is JSON Flattening?", content: "JSON flattening transforms deeply nested JSON objects into a flat, tabular structure. Nested keys are concatenated with a separator (e.g., address.city becomes a column name). This makes nested data compatible with spreadsheets, databases, and analytical tools." },
    howToUse: "Upload a JSON or JSONL file. Choose your separator (dot, underscore), naming convention, and array handling preferences. The tool recursively expands nested objects and arrays into flat columns, displayed in a data table. Download the result as CSV.",
    faqs: [
      { question: "How deep does flattening go?", answer: "The tool recursively flattens up to 10 levels deep, which covers virtually all real-world JSON structures." },
      { question: "How are arrays handled?", answer: "Arrays can be unnested (one row per element) or kept as-is depending on your settings." },
      { question: "What separator options are available?", answer: "Dot (address.city) and underscore (address_city) separators are supported." },
    ],
  },
  "schema-generator": {
    metaDescription: "Generate CREATE TABLE DDL for PostgreSQL, MySQL, BigQuery, Snowflake from your data. Free, offline schema generator.",
    whatIs: { title: "What is a Schema Generator?", content: "A schema generator inspects your data and produces DDL (Data Definition Language) statements — CREATE TABLE SQL — for various database systems. It infers column types from your data and maps them to the target dialect's type system." },
    howToUse: "Upload a CSV, Parquet, or JSON file. The tool infers types for each column and generates CREATE TABLE statements. Choose your target dialect (PostgreSQL, MySQL, BigQuery, Snowflake, DuckDB). Copy or download the DDL.",
    faqs: [
      { question: "Which databases are supported?", answer: "PostgreSQL, MySQL, BigQuery, Snowflake, and DuckDB. Each has its own type mappings." },
      { question: "How accurate is type inference?", answer: "DuckDB's type inference is quite good — it detects integers, floats, dates, timestamps, booleans, and strings. Review the generated schema and adjust types if needed." },
      { question: "Can I customize the generated types?", answer: "The current version uses automatic type mapping. You can copy the DDL and edit it manually for fine-tuning." },
    ],
  },
  "csv-to-sql": {
    metaDescription: "Generate CREATE TABLE and INSERT statements from CSV files. PostgreSQL, MySQL, SQLite, BigQuery dialects. Free, offline.",
    whatIs: { title: "What is CSV to SQL?", content: "CSV to SQL generates executable SQL statements (CREATE TABLE + INSERT) from your CSV data. This is useful for importing data into databases, creating seed scripts, or migrating data between systems." },
    howToUse: "Upload a CSV file. Choose your target dialect, table name, batch size, and whether to include DROP TABLE. The tool generates a complete SQL script with CREATE TABLE and batched INSERT statements. Download or copy the output.",
    faqs: [
      { question: "How are types determined?", answer: "DuckDB infers types from the CSV data, then maps them to the selected database dialect's type system." },
      { question: "What batch sizes are available?", answer: "50, 100, 500, or 1000 rows per INSERT statement. Larger batches are more efficient but some databases have limits." },
      { question: "Can I customize column types?", answer: "The schema preview shows inferred types. Currently you can't edit them in the UI — copy the SQL and adjust manually if needed." },
      { question: "Which SQL dialects are supported?", answer: "PostgreSQL, MySQL, SQLite, and BigQuery." },
    ],
  },
  "dataset-diff": {
    metaDescription: "Compare two dataset versions side-by-side. Identify added, removed, and modified rows. Free, offline diff tool.",
    whatIs: { title: "What is Dataset Diff?", content: "Dataset diff compares two versions of a dataset side-by-side to identify added, removed, and modified rows. It's essential for tracking data changes, validating ETL pipelines, and auditing data transformations." },
    howToUse: "Upload two files (before and after). Select a key column to match rows between versions. The tool highlights added (green), removed (red), and modified (yellow) rows. Filter by change type and download the diff report.",
    faqs: [
      { question: "What file formats are supported?", answer: "CSV and Parquet files. Both files should have the same schema (column names)." },
      { question: "How are modified rows detected?", answer: "Rows are matched by the selected key column. If a key exists in both files but values differ in other columns, the row is marked as modified." },
      { question: "Can I compare large datasets?", answer: "Yes — DuckDB handles the comparison efficiently. However, very large result sets may be slow to render in the browser." },
    ],
  },
  "csv-inspector": {
    metaDescription: "Inspect CSV file encoding, delimiter, line endings, column types, null patterns, and data quality. Free, offline, in your browser.",
    whatIs: { title: "What is a CSV Inspector?", content: "A CSV Inspector analyzes the structural properties of CSV files — encoding, delimiter, line endings, column types, null patterns, and data quality issues. Unlike a data profiler which focuses on statistical distributions, the inspector focuses on file format and parsing characteristics." },
    howToUse: "Upload a CSV file and the inspector automatically analyzes encoding (UTF-8, BOM detection), delimiter, line endings, column types, null counts, unique values, and potential issues. Results are displayed in organized sections with warnings for common problems.",
    faqs: [
      { question: "What's the difference between CSV Inspector and Data Profiler?", answer: "CSV Inspector focuses on the file's structural properties (encoding, delimiter, format issues). Data Profiler focuses on the data itself (distributions, statistics, correlations, quality scores)." },
      { question: "What is a BOM?", answer: "A Byte Order Mark (BOM) is a special character at the start of a file that indicates encoding. UTF-8 BOM is 3 bytes (EF BB BF). Some tools like Excel add it automatically." },
      { question: "Why does my CSV have inconsistent column counts?", answer: "Usually this means some values contain unescaped delimiters or newlines. Check if text fields containing commas are properly quoted." },
    ],
  },
  "json-inspector": {
    metaDescription: "Inspect JSON file structure, schema consistency, value types, and nesting depth. Free, offline browser tool.",
    whatIs: { title: "What is a JSON Inspector?", content: "A JSON Inspector analyzes the structure and schema of JSON files. It checks schema consistency across records, counts value types, maps all keys with their nesting paths, and detects inconsistencies — essential for understanding API responses and complex JSON datasets." },
    howToUse: "Upload a JSON file and the inspector automatically analyzes structure, schema consistency, value type distribution, and all key paths. For arrays of objects, it compares key sets across records to find missing fields.",
    faqs: [
      { question: "What does 'schema consistency' mean?", answer: "For arrays of objects, it checks if every object has the same set of keys. Inconsistent schemas mean some records are missing fields — common in API responses." },
      { question: "What is nesting depth?", answer: "How many levels of objects-within-objects exist. Depth 1 = flat. Depth 4 = like user.address.city.zipCode. Deep nesting may need flattening before CSV conversion." },
    ],
  },
  "parquet-inspector": {
    metaDescription: "Inspect Parquet file metadata, row groups, column encodings, compression stats. Free, offline browser tool powered by DuckDB-WASM.",
    whatIs: { title: "What is a Parquet Inspector?", content: "A Parquet Inspector provides deep visibility into Apache Parquet file internals — row group structure, column encodings, compression statistics, min/max values, and file-level metadata. It helps understand how data is physically stored and optimized." },
    howToUse: "Upload a Parquet file to see file overview, column schema with physical/logical types, row group details with compression ratios, key-value metadata, and a data preview. Navigate between tabs to explore different aspects.",
    faqs: [
      { question: "What is a row group?", answer: "A row group is a horizontal partition of data in a Parquet file. Each row group contains all column data for a subset of rows. Larger row groups = fewer I/O operations but more memory usage." },
      { question: "What does dictionary encoding mean?", answer: "Dictionary encoding replaces repeated values with short integer codes. It's very efficient for columns with many repeated values (like country names or status codes)." },
      { question: "What is the 'created by' field?", answer: "It shows which software wrote the Parquet file. Common values: Apache Spark, Apache Arrow, Pandas, DuckDB. This helps diagnose compatibility issues." },
    ],
  },
  "data-sampler": {
    metaDescription: "Extract random or stratified samples from large CSV, Parquet, or JSON files. Free, offline browser tool powered by DuckDB-WASM.",
    whatIs: { title: "What is Data Sampling?", content: "Data sampling extracts a representative subset from a larger dataset. Random sampling picks rows uniformly, while stratified sampling ensures proportional representation across groups (e.g., equal coverage of each category). Sampling is essential for testing, prototyping, and sharing manageable subsets of large files." },
    howToUse: "Upload a CSV, JSON, or Parquet file. Choose between sampling by row count or percentage. Optionally select a column for stratified sampling to ensure proportional representation. Click 'Sample' and download the result.",
    faqs: [
      { question: "What is stratified sampling?", answer: "Stratified sampling ensures each group (defined by a column value) is proportionally represented in the sample. For example, if 30% of your data is 'Engineering', about 30% of the sample will be too." },
      { question: "Can I get reproducible samples?", answer: "Yes — expand the 'Seed' option and enter a number. The same seed always produces the same sample from the same data." },
      { question: "What's the maximum file size?", answer: "There's no hard limit, but files over 200MB may slow your browser. All processing runs locally via DuckDB-WASM." },
    ],
  },
  "deduplicator": {
    metaDescription: "Find and remove duplicate rows from CSV, Parquet, or JSON files. Choose uniqueness columns and keep strategy. Free, offline browser tool.",
    whatIs: { title: "What is Deduplication?", content: "Deduplication identifies and removes duplicate rows from a dataset. You define which columns determine uniqueness — rows with identical values in those columns are considered duplicates. You can keep the first or last occurrence of each duplicate group." },
    howToUse: "Upload a data file and select which columns define uniqueness (or use all columns). Choose whether to keep the first or last occurrence of duplicates. Click 'Find Duplicates' to see the count, preview removed rows, and download the cleaned file.",
    faqs: [
      { question: "What if I don't select any columns?", answer: "All columns are used to determine uniqueness — only rows that are completely identical across every column are considered duplicates." },
      { question: "What does 'Keep First' vs 'Keep Last' mean?", answer: "'Keep First' retains the earliest occurrence of each duplicate group (by row order). 'Keep Last' retains the latest occurrence." },
      { question: "Can I preview which rows are duplicates?", answer: "Yes — after running deduplication, expand the 'Preview duplicates' section to see which rows would be removed." },
    ],
  },
  "sql-formatter": {
    metaDescription: "Format, beautify, and minify SQL with dialect-aware formatting for PostgreSQL, MySQL, BigQuery, SQLite. Free, offline browser tool.",
    whatIs: { title: "What is a SQL Formatter?", content: "A SQL formatter takes messy or minified SQL queries and reformats them with proper indentation, keyword casing, and line breaks. It supports multiple SQL dialects and helps improve readability, code reviews, and documentation." },
    howToUse: "Paste your SQL in the input area. Choose your dialect (Standard SQL, PostgreSQL, MySQL, BigQuery, SQLite, SQL Server), keyword casing, and indentation. Click Format to beautify or Minify to compress. Copy or download the result.",
    faqs: [
      { question: "Which SQL dialects are supported?", answer: "Standard SQL, PostgreSQL, MySQL, BigQuery, SQLite, and SQL Server (T-SQL). Each dialect has specific keyword and syntax awareness." },
      { question: "Does formatting change my query's behavior?", answer: "No — formatting only changes whitespace and keyword casing. The query logic is preserved exactly." },
      { question: "Can I format stored procedures or DDL?", answer: "Yes — the formatter handles CREATE TABLE, ALTER, INSERT, and procedural SQL. Complex PL/pgSQL may have limited support." },
    ],
  },
  "markdown-table": {
    metaDescription: "Convert CSV, JSON, or Parquet files into formatted Markdown tables. Copy for GitHub, docs, and READMEs. Free, offline browser tool.",
    whatIs: { title: "What is a Markdown Table?", content: "Markdown tables are a lightweight syntax for displaying tabular data in plain text. They're widely used in GitHub READMEs, documentation, issue trackers, and static site generators. Each column is separated by pipes (|) with a header separator row." },
    howToUse: "Upload a CSV, JSON, or Parquet file, or paste CSV data directly. Choose alignment (left, center, right) and max rows. The tool generates a properly formatted Markdown table you can copy to clipboard or download as a .md file.",
    faqs: [
      { question: "What file formats are supported?", answer: "CSV, JSON/JSONL, and Parquet files. You can also paste CSV data directly." },
      { question: "Is there a row limit?", answer: "You can generate tables up to 1,000 rows. For larger datasets, consider using a subset — very large Markdown tables are hard to read anyway." },
      { question: "Can I use this for GitHub READMEs?", answer: "Yes — the output is standard GitHub Flavored Markdown (GFM) table syntax, compatible with GitHub, GitLab, Notion, and most Markdown renderers." },
    ],
  },
  "column-editor": {
    metaDescription: "Select, reorder, and rename columns in CSV, JSON, or Parquet files. Export cleaned data. Free, offline browser tool.",
    whatIs: { title: "What is a Column Editor?", content: "A column editor lets you visually manage the columns in your dataset — include or exclude columns, drag to reorder them, and rename with aliases. It's essential for data preparation before importing into databases, sharing, or analysis." },
    howToUse: "Upload a data file to see all columns listed. Toggle the eye icon to include/exclude columns. Drag rows to reorder. Type in the rename field to add aliases. Click 'Apply Changes' to preview, then download the result.",
    faqs: [
      { question: "What file formats are supported?", answer: "CSV, TSV, JSON/JSONL, and Parquet files are all supported." },
      { question: "Can I rename columns?", answer: "Yes — type a new name in the 'Rename' field next to any column. The original column name is preserved until you export." },
      { question: "Does reordering change the original file?", answer: "No — your original file is never modified. Changes only apply to the exported output." },
    ],
  },
  "data-merge": {
    metaDescription: "Join two datasets with inner, left, right, full outer, or cross joins. Visual merge tool. Free, offline browser tool powered by DuckDB-WASM.",
    whatIs: { title: "What is Data Merging?", content: "Data merging (joining) combines rows from two datasets based on matching key columns. It's a fundamental operation in data analysis — equivalent to SQL JOINs but with a visual interface. Supports inner, left, right, full outer, and cross joins." },
    howToUse: "Upload two data files (left and right datasets). Select the join type and key columns to match on. The tool auto-detects common columns. Click 'Merge' to see the result. Download the merged data as CSV.",
    faqs: [
      { question: "What join types are supported?", answer: "Inner (only matching rows), Left (all left + matching right), Right (all right + matching left), Full Outer (all rows from both), and Cross (every combination)." },
      { question: "What happens with duplicate column names?", answer: "Columns from the right dataset that have the same name as left columns are automatically suffixed with '_right' to avoid ambiguity." },
      { question: "Can I merge files of different formats?", answer: "Yes — you can join a CSV with a Parquet file, or JSON with CSV. Any supported format combination works." },
    ],
  },
  "pivot-table": {
    metaDescription: "Build pivot tables from CSV, JSON, or Parquet files. Visual field mapping with sum, count, avg, min, max aggregation. Free, offline browser tool.",
    whatIs: { title: "What is a Pivot Table?", content: "A pivot table reorganizes and summarizes data by grouping rows, spreading a column's distinct values across new columns, and aggregating values. It's the most powerful way to summarize large datasets without writing code." },
    howToUse: "Upload a data file. Select row fields (GROUP BY), a pivot column (whose values become new columns), a value column, and an aggregation function. Click 'Build Pivot' to generate the table. Download the result as CSV.",
    faqs: [
      { question: "How many distinct pivot values are supported?", answer: "Up to 50 distinct values in the pivot column. Columns with higher cardinality should be filtered or grouped first." },
      { question: "What aggregation functions are available?", answer: "Count, Sum, Average, Min, and Max. Choose based on whether your value column is numeric or categorical." },
      { question: "Can I use multiple row fields?", answer: "Yes — add multiple row fields to create a multi-level grouping, similar to nested GROUP BY in SQL." },
    ],
  },
  "chart-builder": {
    metaDescription: "Create bar, line, area, pie, and scatter charts from CSV, JSON, or Parquet files. Export as PNG. Free, offline browser tool.",
    whatIs: { title: "What is the Chart Builder?", content: "The Chart Builder creates interactive visualizations from your data files. Choose chart type, X/Y axes, and instantly see results. Built with Recharts, it supports bar, line, area, pie, and scatter charts with PNG export." },
    howToUse: "Upload a data file, select the chart type, X axis column, and one or more Y axis columns. Click 'Build Chart' to render. Export as PNG for sharing or documentation.",
    faqs: [
      { question: "What chart types are available?", answer: "Bar, Line, Area, Pie, and Scatter charts. Multiple Y columns are supported for bar, line, and area charts." },
      { question: "Can I export the chart?", answer: "Yes — click 'Export PNG' to download a high-resolution PNG image of your chart." },
      { question: "How many data points can it handle?", answer: "Charts render up to 10,000 rows. For larger datasets, the tool automatically limits to the first N rows." },
    ],
  },
  "yaml-to-json": {
    metaDescription: "Convert YAML to JSON with validation and formatting options. Free, offline browser tool.",
    whatIs: { title: "What is YAML to JSON Conversion?", content: "YAML is a human-readable data serialization format popular for configuration files, CI/CD pipelines, and Kubernetes manifests. Converting YAML to JSON lets you use that data in APIs, web applications, and tooling that expects JSON." },
    howToUse: "Paste your YAML input, choose an indentation level, and click Convert. Copy or download the resulting JSON.",
    faqs: [
      { question: "Does it support all YAML features?", answer: "Yes — anchors, aliases, multi-line strings, and all standard YAML 1.2 features are supported via the js-yaml library." },
      { question: "Is my data uploaded anywhere?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
      { question: "Can I convert YAML with comments?", answer: "Comments are parsed but not preserved in the JSON output, since JSON doesn't support comments." },
    ],
  },
  "json-to-yaml": {
    metaDescription: "Convert JSON to YAML with formatting options. Free, offline browser tool.",
    whatIs: { title: "What is JSON to YAML Conversion?", content: "JSON is the standard data interchange format for APIs and web applications. Converting JSON to YAML produces a more human-readable representation, ideal for configuration files, documentation, and DevOps workflows." },
    howToUse: "Paste your JSON input, choose an indentation level, and click Convert. Copy or download the resulting YAML.",
    faqs: [
      { question: "Will comments be added to the YAML output?", answer: "No — since JSON doesn't contain comments, the YAML output won't have them either. You can add comments manually afterward." },
      { question: "Is my data uploaded anywhere?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
      { question: "Does it handle nested JSON?", answer: "Yes — deeply nested objects and arrays are fully supported and converted to proper YAML indentation." },
    ],
  },
  "regex-filter": {
    metaDescription: "Filter dataset rows using regex patterns on any column. Preview matches and download filtered data. Free, offline browser tool.",
    whatIs: { title: "What is Regex Row Filtering?", content: "Regex (regular expression) filtering lets you search for rows where a column's value matches a pattern. It's a power-user tool for finding specific data like email addresses, phone numbers, error codes, or any structured text pattern in large datasets." },
    howToUse: "Upload a data file, select the column to search, and enter a regex pattern. Optionally toggle case sensitivity or invert the match to exclude rows. Click 'Filter' to see matching rows, then download the filtered result as CSV.",
    faqs: [
      { question: "What regex syntax is supported?", answer: "DuckDB uses RE2-compatible regex syntax. Common patterns like character classes ([A-Z]), quantifiers (+, *, ?), anchors (^, $), and groups are fully supported." },
      { question: "Can I filter on multiple columns?", answer: "Currently one column at a time. For multi-column filtering, use the SQL Playground with regexp_matches() on multiple columns." },
      { question: "What does 'Invert match' do?", answer: "When enabled, rows that do NOT match the pattern are returned instead — useful for excluding specific patterns from your dataset." },
    ],
  },
  "xml-to-json": {
    metaDescription: "Convert XML files to JSON with attribute handling options. Free, offline browser tool using DOMParser.",
    whatIs: { title: "What is XML to JSON Conversion?", content: "XML (Extensible Markup Language) is a widely-used format for data interchange, configuration files, and document markup. Converting XML to JSON makes the data accessible to JavaScript applications, REST APIs, and modern tooling that prefers JSON." },
    howToUse: "Paste XML or load a sample. Choose how attributes are handled (@prefix or flatten). The tool auto-converts on input. Copy or download the JSON output.",
    faqs: [
      { question: "How are XML attributes handled?", answer: "By default, attributes are prefixed with @ (e.g., @id). You can also flatten them to remove the prefix." },
      { question: "Does it handle namespaces?", answer: "Namespaces are preserved as-is in tag names. The browser's DOMParser handles all standard XML features." },
      { question: "Is my data uploaded?", answer: "No — conversion runs entirely in your browser using the built-in DOMParser. No data leaves your machine." },
    ],
  },
  "json-to-xml": {
    metaDescription: "Convert JSON files to XML with customizable root element and indentation. Free, offline browser tool.",
    whatIs: { title: "What is JSON to XML Conversion?", content: "Converting JSON to XML transforms JavaScript-native data structures into the widely-supported XML format. This is useful for integrating with SOAP APIs, legacy systems, and tools that require XML input." },
    howToUse: "Paste JSON or load a sample. Set the root element name and array item element name. The tool auto-converts on input. Copy or download the XML output.",
    faqs: [
      { question: "What is the root element name?", answer: "When the JSON doesn't have a single top-level key, a root element wraps the output. Default is 'root' — customize it in the options." },
      { question: "How are arrays converted?", answer: "Each array element becomes a child element. The tag name defaults to 'item' but can be customized." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    ],
  },
  "csv-splitter": {
    metaDescription: "Split large CSV files by row count or column value into smaller files. Free, offline browser tool powered by DuckDB-WASM.",
    whatIs: { title: "What is CSV Splitting?", content: "CSV splitting divides a large data file into smaller, more manageable pieces. Split by a fixed row count (e.g., every 1000 rows) or by column value (e.g., one file per unique city). This is essential for batch processing, email attachment limits, and tools with row limits." },
    howToUse: "Upload a data file. Choose split mode: by row count or by column value. For row-based splitting, set the number of rows per part. For column-based, select which column to split by. Click 'Split' to see all parts, then download individually.",
    faqs: [
      { question: "What file formats are supported?", answer: "CSV, TSV, JSON/JSONL, and Parquet files are all supported as input. Output is always CSV." },
      { question: "Can I download all parts at once?", answer: "Currently each part is downloaded individually. A zip download may be added in the future." },
      { question: "Is there a limit on the number of parts?", answer: "No hard limit, but splitting into hundreds of parts may slow the browser. Column-based splitting with very high cardinality columns is not recommended." },
    ],
  },
  "base64": {
    metaDescription: "Encode text or files to Base64 and decode Base64 back to text. Free, offline browser tool. No uploads.",
    whatIs: { title: "What is Base64?", content: "Base64 is a binary-to-text encoding scheme that represents binary data as ASCII characters. It's commonly used to embed images in HTML/CSS, encode API credentials, transmit binary data in JSON, and handle email attachments." },
    howToUse: "Select Encode or Decode mode. Type or paste text to convert in real-time. Upload a file to encode its binary content as Base64. Copy or download the result.",
    faqs: [
      { question: "Can I encode binary files?", answer: "Yes — upload any file (images, PDFs, etc.) and the tool will encode its raw bytes to Base64." },
      { question: "What's the maximum file size?", answer: "There's no hard limit, but very large files (50MB+) may slow your browser since everything runs in memory." },
      { question: "Is my data uploaded?", answer: "No — all encoding and decoding happens locally in your browser. No data is sent anywhere." },
    ],
  },
  "data-anonymizer": {
    metaDescription: "Mask, redact, hash, or fake sensitive columns in CSV, JSON, or Parquet files. Free, offline data anonymizer.",
    whatIs: { title: "What is Data Anonymization?", content: "Data anonymization replaces sensitive or personally identifiable information (PII) with fake, hashed, or redacted values. This lets you share datasets safely for testing, demos, or analytics without exposing real names, emails, or other private data." },
    howToUse: "Upload a data file. Select which columns to anonymize and choose a masking strategy for each: redact, hash, fake name, fake email, random number, or shuffle. Click 'Anonymize' to preview the result, then download the anonymized CSV.",
    faqs: [
      { question: "Is the anonymization deterministic?", answer: "Hash, fake name, and fake email strategies are deterministic — the same input always produces the same output. Shuffle and random number are not." },
      { question: "What masking strategies are available?", answer: "Redact (replace with ***), Hash (SHA-based hex), Fake Name, Fake Email, Random Number, and Shuffle (randomly reorder values within the column)." },
      { question: "Is my data uploaded?", answer: "No — all processing runs locally in your browser. No data is sent to any server." },
    ],
  },
  "hash-generator": {
    metaDescription: "Generate SHA-256, SHA-384, SHA-512 hashes from text or files. Free, offline browser tool using Web Crypto API.",
    whatIs: { title: "What is a Hash Generator?", content: "A hash generator computes a fixed-length cryptographic digest from input data. Hashes are one-way functions — you can't reverse them to get the original data. They're used for data integrity verification, password storage, digital signatures, and deduplication." },
    howToUse: "Type or paste text for instant hashing, or upload a file to hash its binary content. Select your algorithm (SHA-256, SHA-384, SHA-512). Copy the hex output.",
    faqs: [
      { question: "Which algorithm should I use?", answer: "SHA-256 is the most common and sufficient for most use cases. SHA-384 and SHA-512 provide longer hashes for higher security requirements." },
      { question: "Can I hash large files?", answer: "Yes — files are read as ArrayBuffers and hashed using the Web Crypto API. Very large files (100MB+) may take a moment." },
      { question: "Is MD5 supported?", answer: "MD5 is not included because it's cryptographically broken. Use SHA-256 or higher for security-sensitive hashing." },
    ],
  },
  "data-generator": {
    metaDescription: "Generate realistic sample datasets with configurable columns, types, and row counts. Names, emails, dates, UUIDs. Free, offline.",
    whatIs: { title: "What is a Data Generator?", content: "A data generator creates synthetic datasets with realistic-looking values. Configure column names and types (name, email, integer, date, UUID, etc.), set the row count, and generate instantly. Useful for testing, prototyping, demos, and populating development databases." },
    howToUse: "Define your columns with names and types. Set the row count (up to 10,000) and an optional seed for reproducibility. Click 'Generate' to create the data. Download as CSV or JSON.",
    faqs: [
      { question: "Is the data truly random?", answer: "It uses a seeded pseudo-random number generator. The same seed always produces the same data, which is useful for reproducible testing." },
      { question: "What column types are available?", answer: "Name, Email, Integer, Float, Date, UUID, Boolean, City, Company, and Phone number." },
      { question: "Can I generate more than 10,000 rows?", answer: "The limit is 10,000 rows to keep the browser responsive. For larger datasets, generate multiple batches or use a CLI tool." },
    ],
  },
  "json-schema-validator": {
    metaDescription: "Validate JSON documents against JSON Schema definitions. See errors with paths. Free, offline browser tool using Ajv.",
    whatIs: { title: "What is JSON Schema Validation?", content: "JSON Schema is a vocabulary for annotating and validating JSON documents. It defines the structure, types, and constraints that a JSON document must conform to. Validation checks a document against a schema and reports any violations with specific paths." },
    howToUse: "Paste a JSON Schema on the left and a JSON document on the right. Click 'Validate' to check conformance. Errors show the exact path and violation message. Load a sample to get started.",
    faqs: [
      { question: "Which JSON Schema drafts are supported?", answer: "The validator uses Ajv which supports JSON Schema drafts 4, 6, 7, and 2019-09 by default." },
      { question: "Does it show all errors at once?", answer: "Yes — all validation errors are displayed with their instance paths, not just the first one." },
      { question: "Is my data uploaded?", answer: "No — validation runs entirely in your browser using the Ajv library. No data leaves your machine." },
    ],
  },
  "toml-to-json": {
    metaDescription: "Convert TOML configuration files to JSON format. Free, offline browser tool with auto-conversion.",
    whatIs: { title: "What is TOML to JSON Conversion?", content: "TOML (Tom's Obvious, Minimal Language) is a configuration file format designed to be easy to read. Converting TOML to JSON lets you use config data in APIs, web applications, and tooling that expects JSON." },
    howToUse: "Paste your TOML input, choose an indentation level, and the conversion happens automatically. Copy or download the resulting JSON.",
    faqs: [
      { question: "Does it support all TOML features?", answer: "Yes — tables, arrays of tables, inline tables, multi-line strings, datetime values, and all TOML 1.0 features are supported via the smol-toml library." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
      { question: "Can I convert TOML with comments?", answer: "Comments are parsed but not preserved in JSON output, since JSON doesn't support comments." },
    ],
  },
  "json-to-toml": {
    metaDescription: "Convert JSON documents to TOML configuration format. Free, offline browser tool.",
    whatIs: { title: "What is JSON to TOML Conversion?", content: "Converting JSON to TOML produces a human-readable configuration format from JSON data. TOML is popular for config files in Rust, Python, and DevOps tooling. Not all JSON structures can be represented in TOML — the root must be an object." },
    howToUse: "Paste your JSON input and the conversion happens automatically. Copy or download the resulting TOML file.",
    faqs: [
      { question: "Can any JSON be converted to TOML?", answer: "TOML requires a top-level object (table). Primitive values or arrays at the root level cannot be represented. Nested objects and arrays of tables are fully supported." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
      { question: "Are datetime values preserved?", answer: "If your JSON contains ISO 8601 date strings, they'll be output as TOML strings. TOML has native datetime support but the converter treats them as strings." },
    ],
  },
  "excel-viewer": {
    metaDescription: "View Excel (XLSX, XLS) files in your browser with multi-sheet navigation. Sortable tables, no uploads, no installs.",
    whatIs: { title: "What is an Excel Viewer?", content: "An Excel viewer lets you open and browse spreadsheet files (.xlsx, .xls) directly in your browser without installing Excel or any other software. Navigate between sheets, sort columns, and explore your data — all offline." },
    howToUse: "Drop an Excel file or load from URL. Switch between sheets using the tab bar. Data is displayed in a sortable, paginated table. Use the 'Try with sample data' button to explore the viewer.",
    faqs: [
      { question: "What Excel formats are supported?", answer: "Both .xlsx (modern) and .xls (legacy) formats are supported via the SheetJS library." },
      { question: "Is my data uploaded?", answer: "No — all processing happens locally in your browser. Your files never leave your machine." },
      { question: "Can I edit the data?", answer: "This is a read-only viewer. For conversions, use the Excel to CSV tool or SQL Playground." },
      { question: "How many rows can it handle?", answer: "The viewer displays all rows with client-side pagination. Very large files (50MB+) may be slow due to browser memory." },
    ],
  },
  "yaml-formatter": {
    metaDescription: "Format, minify, and validate YAML documents in your browser. Pretty-print with configurable indentation. Free, offline.",
    whatIs: { title: "What is a YAML Formatter?", content: "A YAML formatter takes raw or messy YAML and displays it with consistent indentation and structure. It can also minify YAML (compact representation), validate syntax, and help you spot structural issues in configuration files." },
    howToUse: "Paste YAML in the input area. The formatter auto-formats with your chosen indentation. Use Minify to compact, Validate to check syntax. Copy or download the result.",
    faqs: [
      { question: "Does it validate YAML?", answer: "Yes — the formatter uses the js-yaml library for parsing and validation. Click Validate for explicit checking with detailed error messages." },
      { question: "Does it support multi-document YAML?", answer: "Currently the formatter processes single YAML documents. Multi-document streams (separated by ---) may not be fully preserved." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    ],
  },
  "log-viewer": {
    metaDescription: "View and filter log files with level detection, regex search, and line numbers. Free, offline browser tool.",
    whatIs: { title: "What is a Log Viewer?", content: "A log viewer helps you read, filter, and search through log files. It auto-detects log levels (ERROR, WARN, INFO, DEBUG, TRACE), provides regex-based filtering, and displays line numbers for easy reference." },
    howToUse: "Drop a log file, paste log text, or click Upload. Toggle log levels to show/hide entries. Use the regex filter to search for specific patterns. Export filtered results.",
    faqs: [
      { question: "What log formats are supported?", answer: "The viewer auto-detects common patterns like [ERROR], ERROR:, and level=error in any text-based log format." },
      { question: "Can I filter by multiple criteria?", answer: "Yes — combine level toggles with regex patterns to narrow down exactly the log entries you need." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    ],
  },
  "xml-formatter": {
    metaDescription: "Format, minify, and validate XML documents in your browser. Pretty-print with configurable indentation. Free, offline.",
    whatIs: { title: "What is an XML Formatter?", content: "An XML formatter takes raw or minified XML and displays it with proper indentation and line breaks for human readability. It can also minify XML (remove whitespace), validate syntax, and help you spot structural issues in your documents." },
    howToUse: "Paste XML in the input area. The formatter auto-formats with your chosen indentation. Use Minify to compress, Validate to check syntax. Copy or download the result.",
    faqs: [
      { question: "Does it validate XML?", answer: "Yes — the formatter uses the browser's built-in DOMParser which performs well-formedness validation. Click Validate for explicit checking." },
      { question: "Does it support namespaces?", answer: "Yes — XML namespaces are preserved during formatting. The browser's DOMParser handles namespace-aware parsing." },
      { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    ],
  },
};

export function getToolSeo(toolId: string) {
  const data = seoData[toolId];
  if (!data) return null;
  return <SeoFaq whatIs={data.whatIs} howToUse={data.howToUse} faqs={data.faqs} />;
}

export function getToolMetaDescription(toolId: string): string | undefined {
  return seoData[toolId]?.metaDescription;
}
