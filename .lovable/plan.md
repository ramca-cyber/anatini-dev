

# Add Parquet Output Preview to Converter Tools

## Problem
When converting CSV (or JSON) to Parquet, the output file is downloaded immediately but there's no way to inspect it. We show raw input and input table preview, but nothing for the output side.

## Solution
After conversion, read the exported Parquet back from DuckDB's virtual filesystem and display:
1. **Output Data Preview** -- a DataTable showing the first 100 rows as read from the Parquet file (proving the round-trip works)
2. **Parquet Metadata** -- row group count, compression codec, column count, and per-column encoding details queried via `parquet_metadata()` and `parquet_schema()`

Add an "Output Preview" tab to the view toggle (alongside Table View, Schema Preview, Raw Input) that appears only after conversion is complete.

## Changes

### `src/pages/CsvToParquetPage.tsx`
- Add `outputPreview` state for the round-trip table data
- Add `parquetMeta` state for metadata (row groups, compression, encodings)
- After `exportToParquet` succeeds, register the output buffer back into DuckDB and query it:
  - `SELECT * FROM read_parquet('output.parquet') LIMIT 100` for data preview
  - `SELECT * FROM parquet_metadata('output.parquet')` for file metadata
  - `SELECT * FROM parquet_schema('output.parquet')` for column-level info
- Add "Output Preview" tab to the view toggle (only visible after conversion)
- When "Output Preview" is selected, show:
  - A metadata summary card (row groups, compression, total compressed/uncompressed sizes)
  - The DataTable with the round-tripped data and Parquet types
- Add a "Download" button in the output preview so the user can re-download without re-converting

### `src/pages/JsonToParquetPage.tsx`
- Apply the same pattern: after conversion, read back the Parquet output and show an "Output Preview" tab with metadata and data table

## Technical Notes
- DuckDB-WASM's `copyFileToBuffer` already leaves the file in the virtual FS, so we can query it directly via `read_parquet('filename')` without re-registering
- The `parquet_metadata()` function returns row_group_id, row_group_num_rows, row_group_bytes, etc.
- The `parquet_schema()` function returns column names, types, and encodings as stored in the Parquet file
- No new components or dependencies needed -- reuses `DataTable` and inline metadata cards

