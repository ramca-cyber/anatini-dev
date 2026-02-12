

# New Tool Recommendations

Based on DuckDB-WASM capabilities, the existing tool suite, and what works well as a fully static/offline browser app, here are the top tools to add -- ranked by user value and implementation feasibility.

---

## Tier 1: High Impact, Easy to Build (reuse existing patterns heavily)

### 1. Data Sampler
**Route:** `/data-sampler`  
**What it does:** Extract a random or stratified sample from large CSV/Parquet/JSON files. Users pick sample size (N rows or percentage) and optional stratification column.  
**Why:** Users working with large files (100K+ rows) frequently need a smaller representative subset for testing, sharing, or prototyping. No existing tool does this.  
**DuckDB:** `SELECT * FROM data USING SAMPLE 10%` or `ORDER BY random() LIMIT 1000`  
**Effort:** Low -- follows the standard converter page pattern (upload, configure, download).

### 2. Column Selector and Reorder
**Route:** `/column-editor`  
**What it does:** Upload a file, see all columns listed. Drag to reorder, toggle to include/exclude, optionally rename. Export as CSV/Parquet/JSON.  
**Why:** Extremely common data prep task. No tool currently lets you drop or reorder columns without writing SQL.  
**DuckDB:** `SELECT col_a AS "New Name", col_c FROM data`  
**Effort:** Low-medium -- needs a small drag-and-drop list UI (could use native HTML drag or a lightweight lib).

### 3. Deduplicator
**Route:** `/deduplicator`  
**What it does:** Upload a file, choose which columns define uniqueness (or all columns). Shows duplicate count, lets user preview duplicates, then download deduplicated output.  
**Why:** Duplicate detection is one of the most common data cleaning tasks. The profiler shows duplicate counts but cannot remove them.  
**DuckDB:** `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` to identify and filter duplicates.  
**Effort:** Low -- standard upload/configure/download pattern.

### 4. Data Merge / Join Tool
**Route:** `/data-merge`  
**What it does:** Upload two files, pick join type (inner, left, right, full outer, cross), select join key columns from each file. Preview result and download.  
**Why:** Joining two datasets is a fundamental operation. The SQL Playground can do it but requires writing SQL manually. A visual tool lowers the barrier significantly.  
**DuckDB:** Standard SQL JOINs across two registered tables.  
**Effort:** Medium -- needs two-file upload (similar to Dataset Diff) plus a join configuration UI.

---

## Tier 2: Medium Impact, Moderate Effort

### 5. Pivot Table Builder
**Route:** `/pivot-table`  
**What it does:** Upload a file, visually configure row fields, column fields, value fields, and aggregation function (sum, count, avg, min, max). Renders a pivot table. Export result.  
**Why:** Pivot tables are the most-requested analytical feature for non-SQL users. DuckDB has native PIVOT support.  
**DuckDB:** `PIVOT data ON category USING sum(amount) GROUP BY region`  
**Effort:** Medium -- the configuration UI (drag fields into row/column/value zones) is the main work.

### 6. Chart Builder
**Route:** `/chart-builder`  
**What it does:** Upload any data file, pick X and Y axes, chart type (bar, line, area, pie, scatter). Renders an interactive chart using Recharts (already installed). Export as PNG.  
**Why:** Quick visualization without leaving the browser. Recharts is already a dependency so no new bundle cost.  
**Effort:** Medium -- chart config UI plus canvas-to-PNG export.

### 7. SQL Formatter / Beautifier
**Route:** `/sql-formatter`  
**What it does:** Paste messy SQL, get it formatted with proper indentation, keyword casing, and line breaks. Options for dialect (Standard, PostgreSQL, MySQL, BigQuery) and indent style.  
**Why:** Complements the SQL Playground and CSV-to-SQL tools. Pure client-side with the `sql-formatter` npm package (~15KB gzipped).  
**No DuckDB needed** -- pure text transformation.  
**Effort:** Low -- text-in, text-out with a config panel.

### 8. Markdown Table Generator
**Route:** `/markdown-table`  
**What it does:** Upload CSV/JSON/Parquet or paste data. Outputs a properly formatted Markdown table with alignment options. Copy to clipboard.  
**Why:** Developers frequently need to paste data tables into GitHub issues, READMEs, and docs. Currently requires manual formatting.  
**Effort:** Low -- simple string formatting from the existing data pipeline.

---

## Tier 3: Nice-to-Have, Niche but Valuable

### 9. YAML to JSON / JSON to YAML
**Route:** `/yaml-json`  
**What it does:** Bidirectional converter. Paste YAML, get JSON (and vice versa). Validate and format.  
**Library:** `js-yaml` (~25KB gzipped), works entirely client-side.  
**Why:** Extremely common developer task (Kubernetes configs, CI/CD pipelines, etc.). Fills a format gap in the converter matrix.  
**Effort:** Low -- paste-based input/output, no DuckDB needed.

### 10. Regex Row Filter
**Route:** `/regex-filter`  
**What it does:** Upload a data file, select a column, enter a regex pattern. Shows matching rows with match highlighting. Download filtered subset.  
**DuckDB:** `SELECT * FROM data WHERE regexp_matches(column, pattern)`  
**Why:** Power-user tool for finding specific patterns in data (emails, phone numbers, error codes).  
**Effort:** Low-medium.

---

## Recommended Build Order

| Priority | Tool | New Dependencies | DuckDB? |
|----------|------|-----------------|---------|
| 1 | Data Sampler | None | Yes |
| 2 | Deduplicator | None | Yes |
| 3 | SQL Formatter | sql-formatter | No |
| 4 | Markdown Table Generator | None | No |
| 5 | Column Selector/Reorder | None | Yes |
| 6 | Data Merge/Join | None | Yes |
| 7 | YAML/JSON Converter | js-yaml | No |
| 8 | Pivot Table Builder | None | Yes |
| 9 | Chart Builder | None (Recharts exists) | Yes |
| 10 | Regex Row Filter | None | Yes |

The first four tools can each be built in a single session following the existing page patterns. Tools 5-10 need slightly more custom UI work.

