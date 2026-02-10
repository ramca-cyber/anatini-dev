

# Refinement Plan: Spec Alignment Pass

After comparing the v2 spec against the current implementation, this plan addresses the remaining functional gaps across all tools. The focus is on missing options, UX features, and spec-required behaviors -- not visual redesign.

---

## 1. JSON to CSV: Add Missing Options

**Current state:** Works but has no configuration options.

**Changes to `JsonToCsvPage.tsx`:**
- Add delimiter selector (Comma, Tab, Semicolon, Pipe) -- pass to DuckDB COPY statement
- Add "Flatten nested objects" checkbox with separator selector (dot, underscore, double underscore)
- Add "Include header row" toggle
- Add "Copy to Clipboard" button alongside download

---

## 2. Parquet to CSV: Add Options and Metadata

**Current state:** Converts but has no configuration.

**Changes to `ParquetToCsvPage.tsx`:**
- Add delimiter selector (Comma, Tab, Semicolon, Pipe)
- Add "Include header row" toggle
- Add null representation selector (empty string, NULL, null, NA, N/A)
- Add Parquet metadata display card (row groups, compression codec) via `parquet_metadata` queries
- Add "Copy to Clipboard" button for CSV output

---

## 3. CSV to Parquet: Add Schema Preview and Delimiter

**Current state:** Has compression and row group options but missing delimiter and schema preview.

**Changes to `CsvToParquetPage.tsx`:**
- Add delimiter selector for CSV input parsing
- Add "First row is header" checkbox
- Add schema preview table (Column Name, Detected Type, Nullable) after file load
- Show compression report card with input size vs output size and reduction percentage

---

## 4. Parquet Viewer: Add "Copy Schema as SQL DDL" Button

**Current state:** Has Data/Schema/Metadata tabs with pagination and column search (from Phase 3).

**Changes to `ParquetViewerPage.tsx`:**
- Add "Copy Schema as SQL DDL" button on the Schema tab that generates a CREATE TABLE statement from the schema and copies to clipboard

---

## 5. JSON Formatter: Fix Tab Indent

**Current state:** Tab indent option exists but uses `value={0}` which produces minified output instead of tab indentation.

**Changes to `JsonFormatterPage.tsx`:**
- Fix indent select so "Tab" option uses `"\t"` as the indent string (not `0`)
- Ensure the Format action uses `JSON.stringify(parsed, replacer, "\t")` when tab is selected

---

## 6. JSON Flattener: Add Missing Options and Stats

**Current state:** Has file/paste input, dot/underscore separator, and side-by-side view.

**Changes to `FlattenPage.tsx`:**
- Add max depth selector (1, 2, 3, 5, Unlimited)
- Add array handling option (Index notation, Bracket notation, Stringify)
- Add "Preserve null values" checkbox
- Add flattening stats line: "Depth: X to 1 | Keys: N | Nested objects removed: M"
- Add "Convert to CSV" cross-link button (links to `/json-to-csv`)
- Add "Copy Flat JSON" button

---

## 7. JSON to Parquet: Use Compression and Row Group Size in Query

**Current state:** Has UI selectors for compression and row group size but the `handleConvert` function calls `exportToParquet(db, tableName)` without passing these options.

**Changes to `JsonToParquetPage.tsx`:**
- Pass compression and rowGroupSize to the COPY query: `COPY ... TO 'output.parquet' (FORMAT PARQUET, COMPRESSION '{compression}')`
- Add schema preview table (Column Name, Type, Nullable) below conversion result
- Add data preview table (first 50 rows)

---

## 8. Schema Generator: Add Missing Options

**Current state:** Has multi-dialect with editable types, schema prefix, table name, and comments toggle.

**Changes to `SchemaPage.tsx`:**
- Add "NOT NULL on 100% complete columns" toggle
- Add VARCHAR sizing selector (Exact max, Max +20%, Max +50%, Fixed 255, TEXT)
- Add multi-dialect output tabs showing all DDLs simultaneously (instead of single dialect view)
- Query MAX(LENGTH(col)) for VARCHAR columns to size them

---

## 9. SQL Playground: Add JSON Export and Sample Queries

**Current state:** Has CSV and Parquet export but no JSON export. No sample queries.

**Changes to `SqlPage.tsx`:**
- Add "Download JSON" button alongside CSV/Parquet exports
- Add a sample queries dropdown with 3-4 starter queries (e.g., "SELECT * FROM {table} LIMIT 10", "SELECT COUNT(*) FROM {table}", "GROUP BY example")

---

## 10. CSV Viewer: Add "Download Filtered Results"

**Current state:** Has column search, pagination, alternating rows.

**Changes to `CsvViewerPage.tsx`:**
- Add "Download filtered results as CSV" button that exports the current search/filter query results

---

## 11. Excel Converter: Add Mode Toggle at Top

**Current state:** Auto-detects mode from file extension. Spec wants an explicit toggle.

**Changes to `ExcelCsvPage.tsx`:**
- Add a prominent mode toggle at the top: `[ Excel to CSV ]  [ CSV to Excel ]` as a segmented control
- When "CSV to Excel" is selected, show the CSV dropzone directly without requiring file upload to determine mode
- Ensure the DropZone `accept` changes based on selected mode

---

## Technical Details

- All changes are to existing page files only -- no new components needed
- Options are wired into DuckDB SQL queries using string interpolation for delimiter, header, null representation, and compression parameters
- Copy to Clipboard uses `navigator.clipboard.writeText()` with a brief "Copied" toast notification
- Cross-tool links use React Router `Link` components
- Schema DDL generation reuses existing `mapType` helpers already in `SchemaPage.tsx` and `CsvToSqlPage.tsx`

