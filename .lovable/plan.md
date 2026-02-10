

# Add Output Tabs to All Converters for Consistency

## Problem
The Input section has tab toggles (Table View / Raw Input), but the Output section for text-based converters only shows a raw code block with no tabs. This is inconsistent -- users should be able to view output as both a table and raw text, just like the input.

## What Changes

Add an `outputView` state and tab toggles to the Output section of all text-output converters. For each, the output will have two tabs:
- **Table View** -- parse the text output back into a DataTable (for CSV/JSON outputs, re-query the converted data; for SQL, not applicable so only Raw Output)
- **Raw Output** -- the existing RawPreview

### Files to Update

**1. `src/pages/JsonToCsvPage.tsx`**
- Add `outputView` state (`"table" | "raw"`, default `"table"`)
- Add `outputPreview` state for parsed output table data
- After conversion, also run `SELECT * FROM ... LIMIT 100` to populate the output table preview
- Add tab toggles in the Output section header: [Table View] [Raw Output]
- Show `DataTable` when "Table View" selected, `RawPreview` when "Raw Output" selected

**2. `src/pages/CsvToJsonPage.tsx`**
- Same pattern: add `outputView` and `outputPreview` states
- After conversion, store the query result for table view
- Add [Table View] [Raw Output] tabs in output section

**3. `src/pages/ParquetToCsvPage.tsx`**
- Add `outputView` state and `outputPreview` state
- After conversion, re-query the data for table preview
- Add [Table View] [Raw Output] tabs

**4. `src/pages/ParquetToJsonPage.tsx`**
- Same pattern as ParquetToCsv

**5. `src/pages/CsvToSqlPage.tsx`**
- SQL output cannot be meaningfully shown as a table, so only show "Raw Output" -- no change needed (already correct for this case)

**6. `src/pages/ConvertPage.tsx`**
- For CSV output: add [Table View] [Raw Output] tabs with DataTable and RawPreview
- For Parquet output: add [Output Preview] [Raw Output] tabs (matching CsvToParquet pattern) -- query the exported parquet back for preview

### Technical Approach
- For text-output converters, the table preview data already exists in `preview` from the input query. After conversion we can reuse the full query result (since the conversion reads all rows). We store a separate `outputPreview` from `runQuery(db, SELECT * FROM table LIMIT 100)` to show in the output DataTable.
- The output tabs use the same brutalist toggle button pattern as input tabs
- Default output view is "table" for text outputs, "preview" for binary outputs
- Tab toggles are placed in the Output section header row, between the "OUTPUT" label and the Download/Copy buttons

