

# Remaining UI Philosophy Gaps

## Overview
After the converter standardization, several cross-cutting issues remain that affect DataTable rendering and a few page-level layout problems.

## Changes

### 1. DataTable: Null Cell Styling (all pages affected)
The philosophy requires null cells to have a "faint red background" and show the null symbol. Currently DataTable shows the null symbol but has no background color on the cell.

**File:** `src/components/shared/DataTable.tsx`
- Add `bg-destructive/5` class to `<td>` when value is null/undefined
- Add italic "empty" text for empty strings (`val === ""`) to distinguish from null
- Format large numbers with locale separators (e.g., `1,234,567`)

### 2. DataTable: Number and Boolean Formatting
- Large numbers should render with thousand separators
- Booleans should render as `true`/`false` text, not `1`/`0`

**File:** `src/components/shared/DataTable.tsx`
- Update `formatValue` to handle numbers with `toLocaleString()` and booleans explicitly

### 3. CsvViewerPage: CrossToolLinks Position
CrossToolLinks renders at line 202 (inside the file info block), but the actual data table renders at line 211 (outside that block). This means the cross-links appear ABOVE the data table instead of at the bottom.

**File:** `src/pages/CsvViewerPage.tsx`
- Move `CrossToolLinks` from line 202 to after the pagination block (after line 253), so it appears below the data table

### 4. LoadingState as Overlay
The philosophy says loading should overlay/dim the content area, not append below. Currently `LoadingState` is a separate element rendered alongside content.

**File:** `src/components/shared/FileInfo.tsx` (where LoadingState is defined)
- Restyle `LoadingState` to render as a semi-transparent overlay with `fixed` or `absolute` positioning over the content area, with a centered spinner

## Technical Details

### DataTable cell rendering update
```tsx
// Current:
<td className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">
  {val === null || val === undefined ? (
    <span className="text-muted-foreground/60">null symbol</span>
  ) : ...}
</td>

// Updated:
<td className={cn(
  "px-3 py-1.5 whitespace-nowrap font-mono text-xs",
  (val === null || val === undefined) && "bg-destructive/5",
  val === "" && "bg-destructive/5"
)}>
  {val === null || val === undefined ? (
    <span className="text-destructive/40">null symbol</span>
  ) : val === "" ? (
    <span className="text-destructive/40 italic">empty</span>
  ) : ...}
</td>
```

### formatValue update for numbers
```tsx
function formatValue(val: any, type?: string): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "bigint") return val.toLocaleString();
  if (typeof val === "number") {
    if (Number.isInteger(val) && Math.abs(val) >= 1000) return val.toLocaleString();
    return String(val);
  }
  // ... existing object/string handling
}
```

### Files modified
- `src/components/shared/DataTable.tsx` -- null/empty/number formatting
- `src/components/shared/FileInfo.tsx` -- LoadingState overlay
- `src/pages/CsvViewerPage.tsx` -- move CrossToolLinks to bottom

