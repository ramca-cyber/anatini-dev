

# Redesign Converters: No Auto-Download + Separate Input/Output Areas

## Problem
1. Several converter tools automatically trigger a file download when the user clicks "Convert" -- this is unexpected and not user-friendly. Users should see the result first and choose to download.
2. Some tools (JSON to CSV, CSV to JSON) auto-convert on file load with no explicit "Convert" step.
3. Input and output content are mixed in a single flat tab bar, making it unclear what is input vs output.

## Solution

### A. Remove auto-downloads from all converters
Remove `downloadBlob()` calls from inside `handleConvert()`. The convert button should only generate the output and display it. A separate "Download" button lets users save when ready.

**Affected files:**
- `CsvToParquetPage.tsx` -- remove `downloadBlob` from `handleConvert`, keep existing "Download again" button (rename to "Download")
- `JsonToParquetPage.tsx` -- same pattern
- `ParquetToCsvPage.tsx` -- remove `downloadBlob` from `handleConvert`, add explicit Download button
- `ParquetToJsonPage.tsx` -- remove `downloadBlob` from `handleConvert`, add explicit Download button  
- `ConvertPage.tsx` -- remove `downloadBlob` from `handleConvert`, add Download button in results area

### B. Add explicit "Convert" step to auto-converting tools
- `JsonToCsvPage.tsx` -- on file load, only show input preview. Add a "Convert to CSV" button. Output options (delimiter, header) and output views appear only after conversion.
- `CsvToJsonPage.tsx` -- on file load, only show input preview. Add a "Convert to JSON" button. Output format options and output views appear only after conversion.

### C. Separate Input and Output areas visually
Replace the flat tab bar with two clearly labeled sections:

**Input Section** (always visible after file load):
- File info bar with "New file" button
- Input options (delimiter, header, etc.)
- Input tabs: "Table View" and "Raw Input"

**Output Section** (visible only after conversion):
- A labeled "Output" header with Download/Copy buttons
- Conversion stats (time, size, compression ratio)
- Output tabs: for text outputs (Raw CSV, Raw JSON), for binary outputs (Output Preview with metadata + DataTable)

The two sections will be separated by a visible border/divider and labeled headers ("Input" / "Output") so users can clearly distinguish them.

## Detailed Changes Per File

### `CsvToParquetPage.tsx`
- Remove `downloadBlob(buf, ...)` call from `handleConvert()` (line 90)
- Auto-switch to output view after conversion
- Rename "Download again" to "Download Parquet" and move to output section header
- Group input tabs (Table View, Schema Preview, Raw Input) under "Input" label
- Group output tab (Output Preview) under "Output" label with Download button

### `JsonToParquetPage.tsx`
- Remove `downloadBlob(buf, ...)` call from `handleConvert()` (line 97)
- Same input/output separation pattern as CsvToParquetPage

### `ParquetToCsvPage.tsx`
- Remove `downloadBlob(csv, ...)` call from `handleConvert()` (line 90)
- Add Download CSV button in output section
- Separate input (Table View) from output (Raw CSV Output) with labeled sections

### `ParquetToJsonPage.tsx`
- Remove `downloadBlob(output, ...)` from `handleConvert()` (line 74)
- Add Download JSON button in output section
- Separate input (Table View) from output (Raw JSON Output)

### `ConvertPage.tsx`
- Remove both `downloadBlob` calls from `handleConvert()` (lines 66, 70)
- Store converted output in state
- Add Download button in results card

### `JsonToCsvPage.tsx`
- Split `handleFile` -- on load, only register file + show input preview (table + raw input)
- Move CSV generation to a new `handleConvert()` triggered by a "Convert to CSV" button
- Show output options (delimiter, header) before convert
- Show output section (Raw CSV, Download, Copy) only after conversion

### `CsvToJsonPage.tsx`
- Split `handleFile` -- on load, only register file + show input preview
- Move JSON generation to explicit `handleConvert()` triggered by "Convert to JSON" button
- Show output section only after conversion

## Visual Layout (all converters)

```text
+------------------------------------------+
| [FileInfo]                    [New file]  |
+------------------------------------------+
| Options: [delimiter] [header] [compress]  |
|                        [Convert to ___]   |
+------------------------------------------+
| INPUT                                     |
| [Table View] [Schema] [Raw Input]         |
| ┌────────────────────────────────────┐    |
| │  DataTable / RawPreview            │    |
| └────────────────────────────────────┘    |
+------------------------------------------+
| OUTPUT                     [Download] [Copy]|
| Conversion stats: time, size, ratio       |
| [Output Preview] [Raw Output]             |
| ┌────────────────────────────────────┐    |
| │  DataTable / CodeBlock / Raw       │    |
| └────────────────────────────────────┘    |
+------------------------------------------+
```

## Technical Notes
- No new components needed -- uses existing `DataTable`, `RawPreview`, `CodeBlock`, and inline dividers
- The "Convert" button text changes to "Re-convert" after first conversion if options change
- For binary Parquet output, the output section shows the round-trip DataTable + metadata card (already implemented)
- For text outputs (CSV, JSON, SQL), the output section shows CodeBlock/RawPreview with download
- State management stays local to each page -- no shared context needed

