

# Add Pagination to DataTable Component

## Problem

The shared `DataTable` component currently truncates data at `maxRows` (default 100) and shows a static "Showing 100 of X rows" message with no way to navigate further. This affects all 15+ pages that use it -- converters, inspectors, profiler, flatten, etc.

Note: `CsvViewerPage` has its own server-side pagination (querying DuckDB with LIMIT/OFFSET), so it is unaffected.

## Solution

Add client-side pagination controls directly into `DataTable` so all consumers get pagination automatically without any changes to their code.

### Changes to `src/components/shared/DataTable.tsx`

1. Add `useState` for the current page number (starting at 0)
2. Calculate `totalPages` from `rows.length` and `maxRows` (which becomes `pageSize`)
3. Slice rows to show only the current page: `rows.slice(page * pageSize, (page + 1) * pageSize)`
4. Replace the static "Showing X of Y" footer with Previous/Next buttons and a page indicator (e.g., "Page 1 of 5")
5. Reset page to 0 whenever the `rows` array reference changes (via `useEffect`)

### UI Design

The pagination footer will match the existing style used in `CsvViewerPage`:
- Previous and Next buttons (using the existing `Button` component with `variant="outline" size="sm"`)
- "Page X of Y" text in the center
- Disabled state on Previous when on page 1, and Next when on the last page
- Only shown when total rows exceed `maxRows`

### No Changes Needed Elsewhere

Since all 15 pages pass `rows` and `maxRows` to `DataTable` already, they will all get pagination automatically. No page-level code changes required.

## Technical Details

### Files Modified

- `src/components/shared/DataTable.tsx` -- add `useState`, `useEffect`, pagination logic, and navigation controls

### Dependencies

- Uses existing `Button` from `@/components/ui/button`
- Uses existing `ChevronLeft` / `ChevronRight` icons from `lucide-react`

