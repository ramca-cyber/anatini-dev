

# End-to-End Website Audit

## Issues Found

### 1. CRITICAL: LoadingState overlay broken on 18 pages
`LoadingState` was changed to use `absolute inset-0` positioning, but only `CsvViewerPage` has `relative` on its container div. All other pages are missing `relative`, causing the overlay to escape its intended bounds and cover the entire viewport or nearest positioned ancestor unpredictably.

**Affected pages** (every page using `LoadingState` except CsvViewerPage):
- CsvToParquetPage, ParquetToCsvPage, CsvToJsonPage, JsonToCsvPage
- JsonToParquetPage, ParquetToJsonPage, ExcelToCsvPage, CsvToExcelPage
- ParquetViewerPage, DiffPage, SqlPage, ProfilerPage
- FlattenPage, SchemaPage, CsvToSqlPage
- CsvInspectorPage, JsonInspectorPage, ParquetInspectorPage

**Fix:** Add `relative` to the outermost content `<div>` on each page (the one that contains the `LoadingState` render).

### 2. MEDIUM: Missing DuckDBGate on 3 pages
Three pages use `useDuckDB()` but are not wrapped in `<DuckDBGate>`, meaning users see no loading indicator while DuckDB initializes and may interact with the UI before the engine is ready.

- `DiffPage.tsx` -- no DuckDBGate
- `SchemaPage.tsx` -- no DuckDBGate
- `ProfilerPage.tsx` -- no DuckDBGate

**Fix:** Wrap the content `<div>` in `<DuckDBGate>` on each page, matching the pattern used by all other DuckDB-dependent pages.

### 3. MEDIUM: Inconsistent error rendering on 3 pages
Three pages use inline error divs instead of the shared `<ErrorAlert>` component:

- `DiffPage.tsx` line 326: inline `<div className="rounded-lg border border-destructive/50...">`
- `FlattenPage.tsx` line 370: same inline pattern
- `SchemaPage.tsx` line 199: same inline pattern

**Fix:** Replace with `<ErrorAlert message={error} />` on each page, importing from `@/components/shared/ErrorAlert`.

### 4. LOW: SqlPage has no CrossToolLinks
The SQL Playground page does not render `<CrossToolLinks>` at the bottom. Since files can be loaded from multiple formats, this could link users to relevant next tools.

**Fix:** Not strictly needed since SQL Playground is a multi-format destination, but for consistency, a generic link row could be added. Skipping for now -- this is a design decision.

---

## Technical Changes

### Adding `relative` to 18 pages
Each page's outermost content div (the one containing `{loading && <LoadingState />}`) needs `relative` added to its className. Example pattern:

```tsx
// Before:
<div className="space-y-4">

// After:
<div className="relative space-y-4">
```

### Files to modify

| File | Changes |
|------|---------|
| `CsvToParquetPage.tsx` | Add `relative` to line 161 div |
| `ParquetToCsvPage.tsx` | Add `relative` to line 148 div |
| `CsvToJsonPage.tsx` | Add `relative` to line 155 div |
| `JsonToCsvPage.tsx` | Add `relative` to line 147 div |
| `JsonToParquetPage.tsx` | Add `relative` to line 177 div |
| `ParquetToJsonPage.tsx` | Add `relative` to line 132 div |
| `ExcelToCsvPage.tsx` | Add `relative` to line 130 div |
| `CsvToExcelPage.tsx` | Add `relative` to line 106 div |
| `ParquetViewerPage.tsx` | Add `relative` to line 139 div |
| `DiffPage.tsx` | Add `relative` to line 237 div, wrap in `DuckDBGate`, replace inline error with `ErrorAlert` |
| `SqlPage.tsx` | Add `relative` to the main grid's parent or the right-column div |
| `ProfilerPage.tsx` | Add `relative`, wrap in `DuckDBGate` |
| `FlattenPage.tsx` | Add `relative` to line 216 div, replace inline error with `ErrorAlert` |
| `SchemaPage.tsx` | Add `relative` to line 178 div, wrap in `DuckDBGate`, replace inline error with `ErrorAlert` |
| `CsvToSqlPage.tsx` | Add `relative` to line 244 div |
| `CsvInspectorPage.tsx` | Add `relative` to line 298 div |
| `JsonInspectorPage.tsx` | Add `relative` to outermost content div |
| `ParquetInspectorPage.tsx` | Add `relative` to outermost content div |

### DuckDBGate wrapping (3 pages)

```tsx
// DiffPage.tsx, SchemaPage.tsx, ProfilerPage.tsx
// Before:
<ToolPage ...>
  <div className="relative space-y-6">
    ...
  </div>
</ToolPage>

// After:
<ToolPage ...>
  <DuckDBGate>
    <div className="relative space-y-6">
      ...
    </div>
  </DuckDBGate>
</ToolPage>
```

### ErrorAlert replacement (3 pages)

```tsx
// Before (DiffPage, FlattenPage, SchemaPage):
{error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

// After:
{error && <ErrorAlert message={error} />}
```

## Summary
- 18 pages need `relative` added (1-line change each)
- 3 pages need `DuckDBGate` wrapping
- 3 pages need `ErrorAlert` instead of inline error divs
- Total: ~24 small, safe changes across 18 files

