

# End-to-End Website Audit

## A. Dead Code / Orphaned Pages

### 1. ExcelCsvPage.tsx is still in the codebase
The old bidirectional `ExcelCsvPage.tsx` (at `/excel-csv-converter`) was replaced by two separate pages (`ExcelToCsvPage.tsx` and `CsvToExcelPage.tsx`). The route now redirects, but the 321-line file is still in the repo as dead code.

**Fix:** Delete `src/pages/ExcelCsvPage.tsx` and remove its import from `App.tsx`.

### 2. ConvertPage.tsx is orphaned
`ConvertPage.tsx` is a legacy bidirectional CSV/Parquet converter (276 lines). The route `/convert` redirects to `/csv-to-parquet`, so this page is never rendered. It also uses the old oversized conversion stats (`border-2 border-foreground`, `text-lg font-bold`) that were already fixed everywhere else.

**Fix:** Delete `src/pages/ConvertPage.tsx` and remove its import from `App.tsx`.

---

## B. Inconsistent UI Patterns (Post-Optimization Gaps)

### 3. ConversionStats component is unused
`src/components/shared/ConversionStats.tsx` was created as a shared component but is imported by zero pages -- all converters use inline stats bars instead. Dead code.

**Fix:** Delete `src/components/shared/ConversionStats.tsx`.

### 4. Several pages still use old-style toggle buttons instead of ToggleButton component
The following pages use raw inline `<button>` elements with `border-2` styling instead of the shared `ToggleButton` component:
- `CsvInspectorPage.tsx` (line 300: file/paste toggle)
- `FlattenPage.tsx` (lines 217-222: file/paste; lines 279-284: naming toggle; all use `border-2`)
- `CsvToSqlPage.tsx` (lines 236-241: file/paste; lines 344-349: input view toggle; all `border-2`)
- `SchemaPage.tsx` (lines 199-205: dialect toggle uses `border-2`)
- `DiffPage.tsx` (lines 338-349: row filter uses rounded pills instead of ToggleButton)
- `ExcelCsvPage.tsx` (legacy, but its replacement `ExcelToCsvPage.tsx` line 162 also uses raw buttons)

These pages are inconsistent with the `ToggleButton` shared component (which uses `border` not `border-2`).

**Fix:** Replace all inline toggle button patterns with the `ToggleButton` component. This standardizes styling and guarantees focus-visible states.

### 5. Sample data button inconsistency across pages
After the DropZone optimization, some pages integrated the sample button into DropZone's `sampleAction` prop, but several still use a standalone `Button variant="ghost"` outside the DropZone:
- `CsvViewerPage.tsx` (lines 137-142)
- `ParquetViewerPage.tsx` (lines 139-143)
- `CsvInspectorPage.tsx` (lines 308-311)
- `SchemaPage.tsx` (lines 179-182)
- `SqlPage.tsx` (lines 177-181)
- `DiffPage.tsx` (lines 261-265)
- `FlattenPage.tsx` (lines 228-232)
- `CsvToSqlPage.tsx` (lines 246-249)

**Fix:** Move these to use DropZone's `sampleAction` prop for consistency.

### 6. CsvViewerPage.tsx has no DuckDBGate wrapper
All DuckDB-dependent pages use `<DuckDBGate>` to show a loading spinner while DuckDB initializes, except `CsvViewerPage.tsx`. If a user loads the page before DuckDB is ready, clicking "Try with sample data" silently fails because `db` is null.

**Fix:** Wrap CsvViewerPage content in `<DuckDBGate>`.

### 7. ParquetToJsonPage.tsx is missing DuckDBGate wrapper
Same issue. The page uses `useDuckDB()` but has no `<DuckDBGate>` wrapper. The DropZone is rendered even when DuckDB hasn't loaded yet.

**Fix:** Add `<DuckDBGate>` wrapper.

---

## C. Border Inconsistencies

### 8. Mixed border weights across tool pages
The UI optimization reduced secondary containers to `border` (1px), but several pages still use `border-2`:
- `CsvToSqlPage.tsx`: Options panel (line 274), schema editor (line 315), dialect buttons (line 281)
- `FlattenPage.tsx`: Toggle buttons (line 219, 281, 289), flatten stats (line 346)
- `SchemaPage.tsx`: Dialect buttons (line 202), varchar sizing select (line 303)
- `CsvViewerPage.tsx`: Column stats box (line 176 -- uses `border-2 border-foreground`, the old heavy style)
- `ConvertPage.tsx`: Entire options + stats (legacy, to be deleted)
- `ExcelCsvPage.tsx`: Direction info + sheet controls (legacy, to be deleted)

**Fix:** Normalize to `border` (1px) for secondary containers and `border-2` only for primary data sections (tables, output areas).

### 9. CsvViewerPage column stats uses old heavy styling
Line 176: `border-2 border-foreground bg-card p-3` -- this is the same heavy style that was reduced in converter stats. It should be `border border-border bg-muted/30` for consistency.

**Fix:** Update column stats container to match the compact stats pattern.

---

## D. Missing Inspector Section Accents

### 10. CsvInspectorPage "Column Overview" header missing left accent
The audit plan added `border-l-4 border-l-foreground` accents to inspector sections, but the "Column Overview" header (line 352) was missed. It still uses the plain style without the accent border.

**Fix:** Add `border-l-4 border-l-foreground` to the Column Overview header.

---

## E. Navigation Issues

### 11. Dataset Diff is outside the main tool groups
In the navbar (line 107), footer tool grid, and homepage Index, "Dataset Diff" is listed separately or appended outside the Analysis group. On the Navbar, it appears as a standalone item after the dropdown separator. In the footer, it's correctly inside "Analysis & SQL". On the Index homepage, it's inside the `analysis` array. But the Navbar has it dangling.

**Fix:** Move "Dataset Diff" into the "Analysis & SQL" group in the Navbar's `toolGroups` array (it's already in the analysis array on other pages).

### 12. DiffPage route is `/diff` but could be `/dataset-diff`
All other tools use descriptive slugs (`/data-profiler`, `/json-flattener`, `/schema-generator`). `/diff` is terse and less SEO-friendly.

**Fix:** This is a minor SEO consideration. Add a redirect from `/diff` to `/dataset-diff` and update all internal links. Low priority.

---

## F. Functional Issues

### 13. CsvToExcelPage has no sample data button
Unlike all other tool pages, `CsvToExcelPage.tsx` has no sample data option (neither inline nor standalone). First-time users can't try the tool without having a CSV file ready.

**Fix:** Add `sampleAction` to the DropZone using `getSampleCSV()`.

### 14. ExcelToCsvPage sample data uses `generateSampleExcel()` but no DuckDBGate
`ExcelToCsvPage.tsx` doesn't require DuckDB (it uses the `xlsx` library), so no gate is needed. However, the sample data works correctly. No issue here.

### 15. CrossToolLinks missing `excludeRoute` on non-converter pages
Viewer, inspector, and analysis pages show CrossToolLinks but don't pass `excludeRoute`. For example, `CsvViewerPage` shows a "View Data" link pointing to `/csv-viewer` -- linking to itself.

**Fix:** Add `excludeRoute` to all non-converter pages that display CrossToolLinks.

---

## G. SEO / Meta Issues

### 16. About page has no PageMeta
`About.tsx` doesn't use `<PageMeta>` component, so it falls back to whatever the previous page set. If a user navigates directly to `/about`, the document title and meta description will be stale defaults from `index.html`.

**Fix:** Add `<PageMeta>` to About page.

### 17. DiffPage not using descriptive route
Already noted in item 12.

---

## H. Mobile-Specific Issues (Observed at 390px)

### 18. Homepage renders well on mobile
The hero padding reduction to `py-12` is effective. Tool cards stack properly in single-column. Footer tool grid uses 2-column layout. No issues observed.

### 19. Converter pages options bars are properly responsive
The `grid grid-cols-2 gap-3 sm:flex` pattern is applied on updated converter pages. No issues on pages that were updated.

### 20. Pages that weren't updated still have layout issues on mobile
`CsvToSqlPage.tsx` and `FlattenPage.tsx` still have `flex-wrap` on options without the responsive grid pattern, causing tall stacks of controls on mobile.

**Fix:** Apply the `grid grid-cols-2 gap-3 sm:flex sm:flex-wrap` pattern to these pages.

---

## Summary & Priority

| Priority | Item | Description |
|----------|------|-------------|
| High | #6, #7 | Missing DuckDBGate on CsvViewer + ParquetToJson |
| High | #1, #2, #3 | Delete dead code (ExcelCsvPage, ConvertPage, ConversionStats) |
| High | #15 | Self-links in CrossToolLinks on viewer/inspector/analysis pages |
| Medium | #4 | Standardize all toggle buttons to ToggleButton component |
| Medium | #5 | Move sample data buttons into DropZone sampleAction |
| Medium | #8, #9 | Normalize border weights |
| Medium | #11 | Move Dataset Diff into Navbar tool group |
| Medium | #13 | Add sample data to CsvToExcelPage |
| Low | #10 | Add accent to Column Overview inspector header |
| Low | #16 | Add PageMeta to About page |
| Low | #12 | Rename /diff to /dataset-diff |
| Low | #20 | Mobile grid layout on CsvToSql + Flatten pages |

## Implementation Order

1. Delete dead files (ExcelCsvPage.tsx, ConvertPage.tsx, ConversionStats.tsx) and clean App.tsx imports
2. Add DuckDBGate to CsvViewerPage and ParquetToJsonPage
3. Add excludeRoute to CrossToolLinks on all non-converter pages
4. Replace all inline toggle buttons with ToggleButton component
5. Move standalone sample buttons into DropZone sampleAction
6. Normalize border weights across remaining pages
7. Move Dataset Diff into Navbar toolGroups
8. Add sample data to CsvToExcelPage
9. Add PageMeta to About page
10. Add accent border to Column Overview inspector header
11. Apply responsive grid to CsvToSqlPage and FlattenPage options

