

# V2 Code Review — Remaining Action Items

## Already Completed (No Action Needed)

- DataTable pagination (just implemented)
- SQL escaping, large file warning, code splitting, CsvToJson refactor

## Action Items to Implement

### Phase 1: Critical

**1. Column sorting in DataTable**
Add click-to-sort on column headers in the shared `DataTable` component. Clicking a header sorts ascending; clicking again sorts descending; clicking a third time clears sort. Show a triangle indicator next to the sorted column.

- File: `src/components/shared/DataTable.tsx`
- Add `sortCol` and `sortAsc` state
- Sort `displayRows` before rendering
- Add clickable header with arrow indicator

### Phase 2: UX Improvements

**2. Font optimization**
Remove the unused Space Mono Google Font import and combine the remaining two font imports (Space Grotesk + JetBrains Mono) into a single request. Saves one render-blocking network request.

- File: `src/index.css` (lines 1-3)

**3. Auto-convert on file load**
In all converter pages, automatically trigger conversion after file loads instead of requiring users to click "Convert." Keep the button visible as "Re-convert" for when options change. After auto-conversion, default to the raw output view.

- Files: `CsvToJsonPage.tsx`, `JsonToCsvPage.tsx`, `CsvToParquetPage.tsx`, `ParquetToCsvPage.tsx`, `JsonToParquetPage.tsx`, `ParquetToJsonPage.tsx`

**4. Hide options until after file upload**
In `CsvToJsonPage.tsx` (and similar pages), move the delimiter/header options panel so it only appears after a file is loaded, inside a collapsible section. This removes pre-upload visual clutter.

- File: `CsvToJsonPage.tsx` (move the options block at lines 155-169 to after file load)

**5. Move CrossToolLinks below output**
Reorder converter page layouts so `CrossToolLinks` appears after the output/download section rather than between file info and output. Make it render as a compact inline list.

- Files: All converter pages that use `CrossToolLinks`

**6. Consistent error styling**
Create a shared `ErrorAlert` component and replace the 3 different error box patterns across `DuckDBGate`, tool pages, and SQL Playground.

- New file: `src/components/shared/ErrorAlert.tsx`
- Update: `DuckDBGate.tsx`, `SqlPage.tsx`, and all converter pages

### Phase 3: Nice to Have (deferred)

These items from the review are noted but deferred:
- DuckDB loading progress bar (complex; requires hooking into WASM download progress)
- Homepage CTA context-awareness
- Blog SSR/pre-rendering (requires build tooling changes outside Lovable)
- Yellow bird logo color consistency (design decision, not a code fix)

## Technical Details

### Column sorting implementation

```text
// New state in DataTable
const [sortCol, setSortCol] = useState<number | null>(null);
const [sortAsc, setSortAsc] = useState(true);

// Sort before pagination slice
let sortedRows = [...rows];
if (sortCol !== null) {
  sortedRows.sort((a, b) => {
    const va = a[sortCol] ?? "";
    const vb = b[sortCol] ?? "";
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });
}
const displayRows = sortedRows.slice(page * maxRows, (page + 1) * maxRows);

// Header becomes clickable with indicator
<button onClick={() => handleSort(i)}>
  {col} {sortCol === i ? (sortAsc ? "▲" : "▼") : ""}
</button>
```

### Font optimization

```text
// Before (3 requests, Space Mono unused):
@import url("...Space+Grotesk...");
@import url("...Space+Mono...");     // DELETE
@import url("...JetBrains+Mono...");

// After (1 request):
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap");
```

### Files modified

- `src/components/shared/DataTable.tsx` -- sorting
- `src/index.css` -- font imports
- `src/pages/CsvToJsonPage.tsx` -- auto-convert, hide options, move cross-links
- `src/pages/JsonToCsvPage.tsx` -- auto-convert
- `src/pages/CsvToParquetPage.tsx` -- auto-convert
- `src/pages/ParquetToCsvPage.tsx` -- auto-convert
- `src/pages/JsonToParquetPage.tsx` -- auto-convert
- `src/pages/ParquetToJsonPage.tsx` -- auto-convert
- New: `src/components/shared/ErrorAlert.tsx`
- Various pages -- use ErrorAlert

