

# CSV to Parquet Page Layout Restructure

## Summary
Reorganize the page layout based on user feedback to improve information hierarchy: file info at top, options + convert together, output section promoted with prominent download, input preview demoted to collapsible secondary section.

## New Layout Order

```text
1. File info bar:  [employees.csv - 1.2 KB - 20 rows - 7 cols] [Inspect] [New file]
2. Options + Convert row:  Compression: [Snappy|Zstd|GZIP|None]  Row Group: [Default v]  [Convert to Parquet]
3. OUTPUT section (primary):
   - Success stats bar (time, size, compression ratio, codec)
   - Large download button (full-width or near-full, prominent)
   - Collapsible data preview + raw toggle
4. INPUT PREVIEW section (secondary, collapsible, open by default)
   - [Table|Schema|Raw] toggle tabs
   - Data table / schema / raw content
5. CrossToolLinks
```

## Key Changes

1. **File info bar** -- Move "New file" button into the file info row (right side). Remove the convert button from here.

2. **Options + Convert row** -- Always visible (no collapsible chevron). Compression toggle and row group select shown inline on a single row. "Convert to Parquet" button sits at the far right of this row. Button label stays "Convert to Parquet" always (no "Re-convert" label change -- the action is the same regardless).

3. **Output section (promoted)** -- Appears after conversion. Stats bar consolidated into a single line with a checkmark icon. Download button is large and visually dominant (full default size, not `size="sm"`). Output preview (table + raw toggle) is below the download, shown as a collapsible "Preview output data" section.

4. **Input preview (demoted)** -- Wrapped in a Collapsible component, open by default. Header reads "INPUT PREVIEW" with the table/schema/raw toggles. Users can collapse it since they already know what they uploaded.

5. **Two redundant stats bars merged** -- Currently there are two stats bars in the output (conversion stats + parquet meta). These will be merged into one consolidated bar showing: time, output size, compression ratio, codec, and row groups.

## Technical Details

### File: `src/pages/CsvToParquetPage.tsx`

- Remove the `showOptions` state and the collapsible chevron toggle -- options are always visible
- Restructure the JSX into the four sections described above
- Change the convert button label from the ternary `conversionResult ? "Re-convert" : "Convert to Parquet"` to just `"Convert to Parquet"`
- Make the download button larger: remove `size="sm"`, use default size
- Wrap the input preview section with Radix `Collapsible` (already installed), defaulting to open
- Add a new `showInputPreview` state (default `true`) for the collapsible
- Merge the two output stats bars (conversion stats + parquet meta) into one
- Move `CrossToolLinks` outside the collapsible input section, keeping it at the bottom

### No new dependencies or components needed
All required UI primitives (`Collapsible`, `ToggleButton`, `Button`, `DataTable`, etc.) already exist.

