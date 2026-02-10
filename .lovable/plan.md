

# Add Raw Output + Consistency Pass Across All Converters

## Problem
1. **No raw output for text-based conversions**: ParquetToCsv and ParquetToJson show `RawPreview` in their output, but CsvToJson, JsonToCsv, and CsvToSql use `CodeBlock` without the copy/truncation controls of `RawPreview`. Meanwhile, CsvToParquet and JsonToParquet output binary Parquet -- raw text view is impossible for binary files.
2. **Inconsistent button placement and styling**: ConvertPage uses rounded pills and `rounded-lg` cards (old design system), while other pages use the brutalist `border-2 border-border` style. Button order (Download vs Copy vs Convert vs New file) varies page to page.
3. **Missing conversion stats**: CsvToJson, JsonToCsv, and CsvToSql lack timing/size stats that other converters show.
4. **Missing output tabs**: Some pages show output as a single view; others have tabs. No consistency.

## Solution

### A. Show Raw Output where applicable
- **Text output converters** (ParquetToCsv, ParquetToJson, CsvToJson, JsonToCsv, CsvToSql): Add output tabs with "Table View" (where it makes sense) and "Raw Output" using `RawPreview`
- **Binary output converters** (CsvToParquet, JsonToParquet): Already show output DataTable + metadata. Add a note "Binary file -- raw view not available" using `RawPreview`'s existing `binary` prop
- **ConvertPage**: Show `RawPreview` for CSV output; show binary note for Parquet output

### B. Standardize output section layout (all 7 converters)
Every converter output section will follow this consistent pattern:

```text
--- border-t-2 separator ---
OUTPUT                    [Download ___] [Copy]
+-- Stats card (border-2 border-foreground) ---+
| Time | Output size | Size change             |
+----------------------------------------------+
[Output Preview] [Raw Output]    <-- tab toggle
+-- content area --+
| DataTable or RawPreview or binary note |
+-------------------+
```

### C. Add conversion stats to pages missing them
- **CsvToJson**: Track `performance.now()` and output `Blob` size in `handleConvert`
- **JsonToCsv**: Same pattern
- **CsvToSql**: Same pattern

### D. Fix ConvertPage design inconsistencies
- Replace `rounded-lg border border-border` with `border-2 border-border` (brutalist style)
- Replace rounded pill buttons with square `border-2` toggle buttons
- Add `RawPreview` or binary note to output section
- Add Copy button

### E. Standardize button placement across all pages
- **Top bar**: `[FileInfo] ... [Convert to ___] [New file]` -- Convert is primary (default variant), New file is outline
- **Output header**: `OUTPUT ... [Download ___] [Copy]` -- Download is primary `size="sm"`, Copy is outline `size="sm"`
- All pages use consistent icon + label pattern: `ArrowRightLeft` for Convert, `Download` for Download, `Copy/Check` for Copy

## Files to Change

### `src/pages/CsvToJsonPage.tsx`
- Add conversion stats (duration, output size) to state and `handleConvert`
- Add stats card in output section
- Replace bare `CodeBlock` with output tabs: "Raw Output" using `RawPreview`
- Add Copy button alongside Download (already has Copy, but ensure consistent placement)

### `src/pages/JsonToCsvPage.tsx`
- Add conversion stats tracking
- Add stats card in output section
- Replace bare `CodeBlock` with `RawPreview` for raw output

### `src/pages/CsvToSqlPage.tsx`
- Add conversion stats tracking
- Restructure to use standard Input/Output sections with labeled headers
- Move "Raw Input" tab to Input section, "SQL Output" to Output section
- Add stats card and Download/Copy buttons in output header

### `src/pages/ParquetToCsvPage.tsx`
- Add output tabs: "Raw Output" (already has `RawPreview`) + "Table View" showing a DataTable of the CSV output
- Ensure button order: Download then Copy in output header

### `src/pages/ParquetToJsonPage.tsx`
- Same as ParquetToCsv: ensure consistent tab structure if needed

### `src/pages/CsvToParquetPage.tsx`
- Add `RawPreview binary` note below the output DataTable to indicate raw view is unavailable for binary files
- Ensure button consistency

### `src/pages/JsonToParquetPage.tsx`
- Same as CsvToParquet: add binary note

### `src/pages/ConvertPage.tsx`
- Replace `rounded-lg`, `rounded-full`, `border border-border` classes with `border-2 border-border` (brutalist)
- Replace pill toggle buttons with square `border-2` toggle buttons matching other pages
- Add output preview: `RawPreview` for CSV output, binary DataTable for Parquet output
- Add Copy button in output section
- Store text output in state for copy/raw viewing
- Replace `rounded-lg border border-destructive/50` error box with `border-2 border-destructive`

## Technical Notes
- `RawPreview` already has a `binary` prop that shows "Binary file -- raw view not available" -- reuse this for Parquet outputs
- No new components needed
- Conversion stats use `performance.now()` for timing and `new Blob([output]).size` for size measurement
- Output tabs reuse the same toggle button pattern already established in input sections

