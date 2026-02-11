

# Simplify Converter Pages: Remove Parquet Inspector and Cross-Links

## What's changing

### 1. Remove ParquetOutputInspector from converter pages
Replace the heavy tabbed Parquet inspector (Overview, Columns, Row Groups, Data Preview) on **CsvToParquetPage** and **JsonToParquetPage** with a simple output section: just the conversion stats bar and the download button -- nothing more. Since Parquet is a binary format, there's no "raw view" equivalent like CSV/JSON have. The output will simply be:
- Conversion stats (time, output size, compression ratio) -- already there
- Download button -- already there
- That's it. Clean and simple.

### 2. Remove all CrossToolLinks from every page
Remove the `CrossToolLinks` component usage from all 19 pages that currently use it. These "Work with this file" link sections are confusing and files don't actually carry over reliably between tools.

**Pages affected:** CsvToParquetPage, JsonToParquetPage, CsvToJsonPage, CsvToSqlPage, CsvToExcelPage, CsvViewerPage, CsvInspectorPage, JsonToCsvPage, JsonFormatterPage, JsonInspectorPage, FlattenPage, ParquetToCsvPage, ParquetToJsonPage, ParquetViewerPage, ParquetInspectorPage, SchemaPage, ProfilerPage, DiffPage, ExcelToCsvPage.

### 3. Remove all InspectLink from every page
Remove the "Inspect" button that appears next to file info on converter pages. Same reason -- it links to other tools but files don't carry over properly.

**Pages affected:** CsvToParquetPage, JsonToParquetPage, CsvToJsonPage, CsvToSqlPage, CsvViewerPage, JsonToCsvPage, JsonFormatterPage, FlattenPage, ParquetToCsvPage, ParquetToJsonPage, ParquetViewerPage, SchemaPage, ProfilerPage, ExcelToCsvPage.

### 4. Clean up unused code
- Remove unused imports of `CrossToolLinks` and `InspectLink` from all modified pages
- Remove `storedFileId` state and `useFileStore`/`addFile` usage if they were only used for cross-links (will check per page -- some may still need FileStore for other purposes like `useAutoLoadFile`)

## Technical details

- **CsvToParquetPage.tsx**: Remove `ParquetOutputInspector` usage (lines 242-251), remove `CrossToolLinks` block (lines 255-260), remove `InspectLink` (line 154), clean imports
- **JsonToParquetPage.tsx**: Remove `ParquetOutputInspector` usage (lines 259-268), remove `CrossToolLinks` block (lines 272-277), remove `InspectLink` (line 177), clean imports
- **All other 17 pages**: Remove `CrossToolLinks` and `InspectLink` usage and imports
- The `ParquetOutputInspector.tsx`, `CrossToolLinks.tsx`, and `InspectLink.tsx` component files themselves can be kept (they're not hurting anything) or deleted -- will delete them to keep the codebase clean since nothing will reference them

