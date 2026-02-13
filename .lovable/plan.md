

## Chart Builder: Auto-Refresh and UX Improvements

### Problems
1. **No auto-refresh**: Changing chart type, X axis, Y columns, or row limit does NOT update the chart until "Build Chart" is clicked manually. This feels broken.
2. **Multi-select not obvious**: Multiple Y columns can be selected, but there's no visual hint telling users this is possible.

### Solution

**File: `src/pages/ChartBuilderPage.tsx`**

1. **Auto-rebuild chart on config changes** — Add a `useEffect` that triggers `handleBuildChart()` whenever `chartType`, `xColumn`, `yColumns`, `limit`, or `tableName` change (and data has been loaded). This makes the chart reactive to all control changes.

2. **Auto-build on first load** — After file is loaded and X/Y are auto-selected, immediately build the chart instead of showing an empty chart area.

3. **Improve Y-column label** — Change "Y Axis / Values" to "Y Axis / Values (multi)" to signal that multiple selections are supported.

4. **Keep "Build Chart" button** — Retain it as a manual refresh option, but it becomes less critical since changes auto-apply.

### Technical Details

Add a `useEffect` after the existing state declarations:

```typescript
// Auto-rebuild when config changes
useEffect(() => {
  if (db && meta && xColumn && yColumns.length > 0 && tableName) {
    handleBuildChart();
  }
}, [chartType, xColumn, yColumns, limit, tableName]);
```

Wrap `handleBuildChart` in `useCallback` to make it safe as a dependency:

```typescript
const handleBuildChart = useCallback(async () => {
  if (!db || !meta || !xColumn || yColumns.length === 0) return;
  // ... existing logic
}, [db, meta, xColumn, yColumns, tableName, limit]);
```

Update the Y-axis label text from `"Y Axis / Values"` to `"Y Axis / Values (select multiple)"`.

These are minimal, focused changes to the existing `ChartBuilderPage.tsx` file only.
