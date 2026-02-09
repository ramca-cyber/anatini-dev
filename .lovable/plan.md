

# Add Raw File Preview to Converter Tools

## Overview

Add a "Raw View" toggle to all converter tool pages so users can inspect the raw text content of both their **input file** and **converted output**. For large files, content will be truncated with a clear indicator showing how much is hidden.

## What Changes

### 1. New Shared Component: `RawPreview`

A reusable component (`src/components/shared/RawPreview.tsx`) that:
- Accepts a label (e.g., "Input" / "Output"), raw text content, and an optional file name
- Truncates content beyond a configurable limit (default: ~50KB / ~1000 lines) and shows a "Showing first X of Y lines" notice
- Uses the existing `CodeBlock` component internally for consistent styling
- For **binary formats** (Parquet), displays a message like "Binary file -- raw view not available" instead

### 2. Tool Page Updates

Each converter page gets a **view toggle** (Table | Raw) where applicable, reading the input file as text and storing it alongside the converted output:

| Page | Input Raw | Output Raw | Notes |
|------|-----------|------------|-------|
| **CSV to JSON** | CSV text | JSON text (already shown) | Add input raw view |
| **CSV to Parquet** | CSV text | "Binary output" notice | Add input raw view |
| **CSV to SQL** | CSV text | SQL text (already shown) | Add input raw view |
| **JSON to CSV** | JSON text | CSV text (already has raw toggle) | Add input raw view |
| **JSON to Parquet** | JSON text | "Binary output" notice | Add input raw view |
| **Parquet to CSV** | "Binary input" notice | CSV text preview | Add output raw view |
| **Parquet to JSON** | "Binary input" notice | JSON text preview | Add output raw view |
| **Excel to CSV** | "Binary input" notice | CSV text preview | Add output raw view |

### 3. Implementation Details

**Reading input text**: For text-based inputs (CSV, JSON), read the file via `FileReader.readAsText()` and store in state (truncated to first 50KB to avoid memory issues).

**Generating output text**: For text outputs (CSV, JSON, SQL), store the conversion result string in state before downloading. For binary outputs (Parquet), skip raw preview.

**Truncation logic** in `RawPreview`:
- Split content by newlines
- If lines exceed the max (1000), show only the first 1000 with a footer: "Truncated -- showing 1,000 of 15,432 lines"
- If raw byte length exceeds 50KB, slice to 50KB boundary and show similar notice

**View toggle UI**: A simple two-button toggle bar (reusing the existing pill-button pattern already used in `JsonToCsvPage`) with options like "Table" and "Raw Input" and (where applicable) "Raw Output".

## Technical Steps

1. Create `src/components/shared/RawPreview.tsx` -- truncation + CodeBlock wrapper
2. Update `CsvToJsonPage` -- read input text on file load, add "Raw Input" tab alongside existing output
3. Update `CsvToParquetPage` -- read input text, add raw input view; binary output notice
4. Update `CsvToSqlPage` -- read input text, add raw input tab
5. Update `JsonToCsvPage` -- read input text, extend existing table/raw toggle to 3 options (Table, Raw Input, Raw Output)
6. Update `JsonToParquetPage` -- read input text, add raw input view
7. Update `ParquetToCsvPage` -- store CSV output string after conversion, add raw output view; binary input notice
8. Update `ParquetToJsonPage` -- store JSON output string after conversion, add raw output view; binary input notice
9. Update `ExcelCsvPage` -- store CSV output string, add raw output view; binary input notice

