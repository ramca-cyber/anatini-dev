

# Code Review: Assessment & Action Plan

## Review Summary

The uploaded code review rates the project **8/10** and identifies bugs, missing features, and deviations. Many items from your earlier internal audit (`.lovable/plan.md`) have already been fixed. Here's what remains.

## Already Fixed (No Action Needed)

| Review Item | Status |
|---|---|
| Dead code (ExcelCsvPage, ConvertPage) | Deleted |
| DataTable pagination (BUG 2) | CsvViewerPage has PAGE_SIZE=200 + pagination |
| DuckDBGate on CsvViewerPage | Already wrapped |
| Query history in SQL Playground | Already implemented |
| Column sorting in CsvViewerPage | Already implemented |

## Action Items (Grouped by Priority)

### Phase 1: Security & Stability (Must Fix)

**1. Sanitize file names in SQL queries (BUG 3)**
- In `duckdb-helpers.ts` `registerFile()` (line 42-46): escape single quotes in `file.name` before interpolation
- In `CsvToJsonPage.tsx` (line 68): same pattern — uses `f.name` directly in SQL
- Search all pages for `f.name` in SQL strings and apply `file.name.replace(/'/g, "''")`
- Affects: `duckdb-helpers.ts`, `CsvToJsonPage.tsx`, and any other page with manual `registerFileHandle` + SQL

**2. Guard Parquet export in SQL Playground (BUG 4)**
- In `SqlPage.tsx` (lines 117-132): wrap the `CREATE TABLE __export_tmp` in a try/catch and show a user-friendly error if the SQL isn't a SELECT
- Simple fix: catch the error and show "Parquet export only works with SELECT queries"

**3. Large file memory warning (BUG 6)**
- Add a warning toast when loading files > 50MB that says "Large files may cause browser slowdowns"
- Add this check in pages that do `SELECT * FROM table` to materialize all rows (CsvToJsonPage, JsonToCsvPage, etc.)

### Phase 2: UX Improvements (Should Fix)

**4. Improve URL input CORS UX (BUG 1)**
- Keep the URL input (it's already built and useful for GitHub raw URLs, public datasets)
- Add example URLs to `UrlInput.tsx` that are known to work (GitHub raw, data.gov)
- Make the CORS warning more prominent — move it above the input field

**5. Code splitting with React.lazy (Build Size)**
- Convert all 20 page imports in `App.tsx` from static to `React.lazy()` with `Suspense`
- Lazy-load `xlsx` only on Excel pages
- This will reduce initial bundle from ~480KB gzipped to ~200KB

**6. Refactor duplicate DuckDB patterns (BUG 5)**
- Pages like `CsvToJsonPage` manually call `db.registerFileHandle` + `conn.query` instead of using the `registerFile` helper from `duckdb-helpers.ts`
- Refactor these pages to use the shared helper, which also centralizes the filename sanitization fix from Phase 1

### Phase 3: Nice to Have

**7. Alternating row colors in DataTable**
- Add `even:bg-muted/20` to table row classes for better readability

**8. Null display enhancement**
- Keep the `∅` symbol (cleaner than red italic NULL) but make it slightly more visible with `text-muted-foreground/60` instead of `/40`

**9. ErrorBoundary enhancement for DuckDB crashes**
- The existing `ErrorBoundary` redirects home. Add a "Retry" button that resets component state instead of navigating away

## Technical Details

### File name sanitization (Phase 1, Item 1)
```text
// Current (vulnerable):
conn.query(`...FROM read_csv_auto('${f.name}')`)

// Fixed:
const safeName = f.name.replace(/'/g, "''");
conn.query(`...FROM read_csv_auto('${safeName}')`)
```
Apply in: `duckdb-helpers.ts` (registerFile), `CsvToJsonPage.tsx`, and grep for all other `f.name` in SQL.

### Code splitting (Phase 2, Item 5)
```text
// Current:
import CsvToParquetPage from "./pages/CsvToParquetPage";

// After:
const CsvToParquetPage = lazy(() => import("./pages/CsvToParquetPage"));

// Wrap routes in:
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

### Files to modify
- `src/lib/duckdb-helpers.ts` — sanitize filenames
- `src/pages/CsvToJsonPage.tsx` — use shared helper, sanitize
- `src/pages/SqlPage.tsx` — guard Parquet export
- `src/components/shared/UrlInput.tsx` — improve CORS UX
- `src/components/shared/DataTable.tsx` — alternating rows, null visibility
- `src/App.tsx` — React.lazy() all page imports
- `src/components/shared/ErrorBoundary.tsx` — add retry button
- Various converter pages — add large file warning

## Items Intentionally Skipped

- **Remove URL input entirely**: Keeping it — it works for CORS-friendly URLs and is already built
- **Virtual scrolling**: CsvViewerPage already has pagination (PAGE_SIZE=200), which is sufficient
- **Profiler quality score / PDF export / correlation**: Feature additions for a future iteration
- **JSON tree view**: Feature addition for later
- **PWA manifest**: Nice to have, not critical

