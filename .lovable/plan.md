

# Audit: Cross-Tool File Persistence & Inspector Tools vs. Spec

## Summary

The core infrastructure is implemented and working. All 21 pages have been audited against the spec. Below are the gaps found.

---

## What's Working Well

- **FileStoreContext** -- implemented correctly with `addFile`, `getFile`, `getLatestByFormat`, `removeFile`, `clearAll`
- **useAutoLoadFile hook** -- wired into 12 DuckDB-based pages
- **CrossToolLinks** -- present on all 18 tool pages (including excel format)
- **InspectLink** -- present on all converter/viewer pages that handle a single input file
- **Three inspector pages** -- CSV, JSON, Parquet all implemented with correct sections
- **Routes and navigation** -- all 3 inspectors in App.tsx routes, Navbar dropdown, and homepage grid

---

## Gaps Found

### 1. Missing features in specific pages

| Page | Issue |
|------|-------|
| **JsonFormatterPage** | No `useAutoLoadFile` -- files from other tools won't auto-load |
| **ExcelCsvPage** | No `useAutoLoadFile` -- files from other tools won't auto-load |
| **SqlPage** | No `useAutoLoadFile` -- files from other tools won't auto-load |
| **DiffPage** | No `useAutoLoadFile` (two-file tool, so less critical), no `CrossToolLinks`, no `InspectLink` |
| **FlattenPage** | No `useAutoLoadFile` -- files from other tools won't auto-load |
| **ExcelCsvPage** | `CrossToolLinks format` is always `"csv"` even for Excel input -- should be `"excel"` for Excel files |

### 2. Missing spec features in CSV Inspector

| Feature | Status |
|---------|--------|
| Section 4: Data Patterns (date formats, null representations, numeric formats, header whitespace, numeric strings) | Not implemented |
| Section 5: Expandable warnings (click to show affected rows) | Not implemented -- warnings are flat list |
| Null pattern detection (`NULL`, `null`, `NA`, `N/A`, `None`, empty string counts per column) | Not implemented |
| Max line length detection | Not implemented |
| Consistent column count check (rows with wrong field count) | Not implemented |

### 3. Missing spec features in JSON Inspector

| Feature | Status |
|---------|--------|
| Section 7: Tree Preview (collapsible JSON tree for first 50 records) | Not implemented |
| Empty arrays/objects count in Value Types section | Not implemented |
| Minified detection in Structure Analysis | Field exists but always set to `false` |

### 4. Missing spec features in Parquet Inspector

| Feature | Status |
|---------|--------|
| Parquet version display | Not shown |
| Column-level min/max/encoding/null counts in Column Details table | Using raw `parquet_schema()` output instead of enriched table from spec |
| Dictionary encoding percentage summary | Not implemented |
| Warnings section | Not implemented |
| Per-column compressed size | Not shown in column table |

### 5. CrossToolLinks format mismatches (minor)

Some converter pages show CrossToolLinks for the **input** format instead of showing links for **both** input and output formats. Per the spec, after conversion the output section should also show relevant links for the output format.

For example:
- `CsvToJsonPage` shows `CrossToolLinks format="csv"` but after conversion, should also show links for JSON output (e.g., "Inspect JSON", "Convert to Parquet")
- `ParquetToCsvPage` shows `CrossToolLinks format="parquet"` but after conversion, should also show CSV output links
- Same pattern across most converters

---

## Implementation Plan

### Step 1: Add `useAutoLoadFile` to missing pages
- **JsonFormatterPage**: Add auto-load support for JSON files
- **FlattenPage**: Add auto-load support for JSON files
- **ExcelCsvPage**: Add auto-load support for Excel files
- **SqlPage**: Add auto-load support (load file into first table slot)

### Step 2: Fix ExcelCsvPage CrossToolLinks format
- Use `"excel"` format when input is Excel, `"csv"` when input is CSV

### Step 3: Add DiffPage cross-tool links
- Add `CrossToolLinks` and `InspectLink` for both before/after files

### Step 4: Enhance CSV Inspector
- Add Data Patterns section with null representation detection, date format detection, and header whitespace checks
- Add consistent column count check
- Make warnings expandable

### Step 5: Enhance JSON Inspector  
- Add collapsible tree preview (reuse TreeNode from JsonFormatterPage)
- Fix minified detection
- Add empty arrays/objects/strings counts to Value Types section

### Step 6: Enhance Parquet Inspector
- Enrich column details table with per-column encoding, nulls, min/max, compressed size from `parquet_metadata()`
- Add dictionary encoding percentage summary
- Add warnings section (e.g., many row groups, high null columns)

### Step 7: Add output-format CrossToolLinks to converters
- After conversion completes, show a second `CrossToolLinks` for the output format below the output section (e.g., JSON links after CSV-to-JSON conversion)

---

## Technical Details

### useAutoLoadFile additions
For `JsonFormatterPage`, `FlattenPage`, and `ExcelCsvPage`, the hook needs to call the existing `handleFile` function. Since these pages don't use DuckDB directly, the `ready` parameter can be `true`.

For `SqlPage`, auto-loading should register the file as a table (matching existing `handleFileUpload` logic).

### CSV Inspector Data Patterns
Run additional DuckDB queries per string column:
```sql
SELECT
  COUNT(CASE WHEN CAST(col AS VARCHAR) = 'NULL' THEN 1 END) as null_string,
  COUNT(CASE WHEN CAST(col AS VARCHAR) = '' THEN 1 END) as empty_string,
  COUNT(CASE WHEN CAST(col AS VARCHAR) = 'NA' THEN 1 END) as na_string
FROM table_name;
```

### Parquet Inspector Column Enrichment
Use `parquet_metadata()` grouped by column name to extract per-column encoding, compression, null count, min/max values, and compressed size -- then merge with schema data for a single enriched table.

### Output CrossToolLinks
Add a conditional second `CrossToolLinks` component in each converter's output section, using the output format (e.g., `format="json"` in CsvToJsonPage output area).

