

# Enhance Parquet Output Inspection on Converter Pages

## Problem

1. **Auto-convert**: Testing confirms auto-convert IS working on all converters. The CSV-to-Parquet page was tested with sample data and auto-converts successfully. This may have been a transient browser issue.

2. **Parquet output inspection is minimal**: The CSV-to-Parquet and JSON-to-Parquet converters show only basic stats (row groups count, compressed/uncompressed size, codec) and a data table. The user wants the full Parquet Inspector experience embedded inline.

## What Changes

### 1. Create a reusable `ParquetOutputInspector` component

Extract the inspection logic from `ParquetInspectorPage.tsx` into a shared component `src/components/shared/ParquetOutputInspector.tsx` that can be embedded in any converter's output section.

This component will accept the DuckDB instance, the exported filename (in VFS), and the table name, then display:

- **Overview tab**: File size, uncompressed size, compression ratio, rows, columns, row groups, compression codec, created-by
- **Columns tab**: Per-column physical type, encoding, compression, null count, compressed/uncompressed sizes + raw schema from `parquet_schema()`
- **Row Groups tab**: Per-group rows, compressed/uncompressed sizes, ratio, with totals row
- **Data Preview tab**: First 100 rows in DataTable
- **Observations**: Warnings for high row group counts, null-heavy columns, dictionary encoding usage

### 2. Integrate into CSV-to-Parquet output section

Replace the current minimal output tabs ("Output Preview" / "Raw Output") with the new `ParquetOutputInspector` component. The output section will show:
- Download button (unchanged)
- Conversion stats bar (time, output size, compression -- unchanged)
- Full tabbed inspector (Overview, Columns, Row Groups, Data Preview)

### 3. Integrate into JSON-to-Parquet output section

Same change as CSV-to-Parquet -- replace the minimal output with the full inspector component.

### 4. Verify auto-convert still works

Ensure the auto-convert `useEffect` pattern remains intact on all 7 converters. No changes needed here -- just verification.

## Technical Details

### New file: `src/components/shared/ParquetOutputInspector.tsx`

Props:
```text
interface ParquetOutputInspectorProps {
  db: AsyncDuckDB;
  fileName: string;       // filename in DuckDB VFS (e.g., "employees_export.parquet")
  tableName: string;      // table name for querying data
  rowCount: number;       // from conversion result
  columnCount: number;    // from conversion result
  fileSize: number;       // output size in bytes
}
```

The component will:
1. On mount, run the same DuckDB metadata queries used in `ParquetInspectorPage`:
   - `parquet_file_metadata()` for file-level info
   - `parquet_metadata()` for per-column and per-row-group details
   - `parquet_schema()` for raw schema
2. Display results in tabs matching the inspector layout
3. Reuse `DataTable` and `formatBytes` from existing shared code

### Modified files

- `src/pages/CsvToParquetPage.tsx`: Replace output preview/raw toggle with `ParquetOutputInspector`
- `src/pages/JsonToParquetPage.tsx`: Same replacement

### Files unchanged

- All 7 converter pages' auto-convert `useEffect` -- already working
- `ParquetInspectorPage.tsx` -- standalone page stays as-is (some code duplication is acceptable to keep the shared component focused)

## Sequencing

1. Create `ParquetOutputInspector.tsx` component
2. Update `CsvToParquetPage.tsx` to use it (in parallel with step 3)
3. Update `JsonToParquetPage.tsx` to use it
4. Test end-to-end with sample data

