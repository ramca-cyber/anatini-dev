

## Spec vs. Implementation — Gap Analysis and Fix Plan

After comparing the full UI/UX spec against the current codebase, here are the gaps organized by priority.

---

### HIGH PRIORITY — Missing Features

**1. Diff Tool: Join Key Selection and Modified Rows Detection**
The spec calls for:
- Auto-detect join key (highest cardinality column matching both files) with manual override dropdown
- 4 summary cards: Added, Removed, **Modified**, Unchanged (current impl only has Added, Removed, Unchanged — no Modified)
- Column-level change display (added/removed/changed columns between datasets)
- Row-level color coding with filter toggles (All / Added / Removed / Modified)

Current implementation uses simple `EXCEPT`/`INTERSECT` which cannot detect **modified** rows — only added/removed.

**Fix:** Add a join key auto-detect + dropdown, use key-based comparison to identify modified rows, add a 4th "Modified" summary card, and add column-level change reporting.

---

**2. Flatten Tool: Structure Detection Display + Naming Convention Toggle**
The spec shows a "Structure Detected" panel before flattening, displaying:
- Root type (Array of N objects)
- Nesting depth
- Detected paths with their flattened names and types

Also missing: naming convention toggle (dot notation vs underscore).

Current impl goes straight from file drop to flattened result — no intermediate structure view.

**Fix:** After loading the JSON, show a structure detection panel. Add a toggle for dot vs underscore naming. Add a "Flatten" button (currently auto-flattens).

---

**3. Profiler: Column Detail Expansion + Column Type Distribution Bars**
The spec shows:
- Overview tab: column type distribution bars (bar chart showing INT: 8, TEXT: 6, etc.) and "Top Issues" list
- Columns tab: clickable rows that expand to show detailed statistics (min, max, mean, median, stddev, percentiles, zeros, negatives, outliers, top values, sample values)
- Findings tab: "Suggested fix" text for each finding, plus a filter by severity

Current impl has basic overview cards, a flat columns table (no expansion), and findings without suggested fixes or filters.

**Fix:** Add type distribution bars to Overview. Add expandable column detail rows with richer stats. Add suggested fix text to findings. Add severity filter to Findings tab.

---

**4. SQL Playground: Column Click-to-Insert + Query History in localStorage**
The spec calls for:
- Clicking a column name in the schema browser inserts it into the editor
- Query history persisted in localStorage (last 20 queries), accessible via up-arrow
- Parquet export button in results

Current impl has in-memory history (lost on reload) and no click-to-insert on columns. No Parquet export.

**Fix:** Add `onClick` handler on column names to insert into editor. Persist history to localStorage. Add Parquet export button.

---

**5. Convert Tool: Options Panel + Size Comparison + Conversion Time**
The spec shows:
- Collapsible options panel (CSV delimiter, header row, Parquet compression: Snappy/Zstd/None)
- Post-convert info: "Converted in 2.3s", "Output: 12.1 MB (73% smaller)"
- Size comparison is the "wow moment"

Current impl has none of these — just a straight convert + download.

**Fix:** Add a collapsible options section. Show conversion duration and output size comparison after convert.

---

### MEDIUM PRIORITY — UI/UX Polish Gaps

**6. Schema Generator: Editable Mapped Types**
Spec says: "Each 'Mapped' cell is editable (click to change type)". Also missing: schema prefix option and "Add comments with sample values" checkbox.

**Fix:** Make the mapped type column editable (inline select or input). Add schema prefix input and comment toggle.

---

**7. Profiler Export: Clipboard Copy Option**
Spec shows 4 export options: HTML, JSON, CSV, and Clipboard copy. Current impl has 3 (missing clipboard).

**Fix:** Add a 4th "Copy to Clipboard" card in the Export tab that copies a text summary.

---

**8. Landing Page: "No accounts. No cookies. No analytics." text**
Spec privacy section includes: "No accounts. No cookies. No analytics." — this specific text is missing from the current privacy section.

**Fix:** Add this line to the landing page privacy section.

---

**9. SEO: Per-Page Titles and Meta Descriptions**
Spec requires unique `<title>` per tool page (e.g., "Convert CSV to Parquet Online — Free, Offline | DuckTools"). Currently all pages share the same `<title>` from `index.html`.

**Fix:** Use `document.title` or a `useEffect` in `ToolPage` to set page-specific titles.

---

**10. Navbar: Duck Icon Color**
Spec says duck icon should be `--accent-duck` (#FFD43B yellow), not cyan. Currently uses `text-primary` (cyan).

**Fix:** Change `Bird` icon color to the duck yellow (`text-[#FFD43B]`).

---

### LOW PRIORITY — Micro-interactions and Polish

**11. Drop Zone: File Size Warning for >200MB**
Spec: "warning if > 200MB". Not implemented.

**12. Loading State: Progress Bar Instead of Spinner**
Spec shows a progress bar with percentage. Current impl shows a spinner with text.

**13. Data Table: Sortable Columns**
Spec: "click header to sort, arrow indicator". Not implemented.

**14. Numbers Count-Up Animation**
Spec: "Numbers count up rapidly to final value" in profiler overview cards. Not implemented.

**15. Download Checkmark Animation**
Spec: "Download button shows brief checkmark animation on click". Not implemented.

---

### Summary of Changes

| File | Changes |
|------|---------|
| `src/pages/DiffPage.tsx` | Join key auto-detect + dropdown, modified row detection, column-level changes, 4th summary card, row filters |
| `src/pages/FlattenPage.tsx` | Structure detection panel, naming toggle, explicit Flatten button |
| `src/pages/ProfilerPage.tsx` | Type distribution bars, expandable column details, richer stats, finding filters + suggested fixes, clipboard export |
| `src/pages/SqlPage.tsx` | Column click-to-insert, localStorage history, Parquet export |
| `src/pages/ConvertPage.tsx` | Collapsible options panel, conversion timing, size comparison |
| `src/pages/SchemaPage.tsx` | Editable mapped types, schema prefix, comments toggle |
| `src/components/shared/ToolPage.tsx` | Dynamic `document.title` per page |
| `src/components/layout/Navbar.tsx` | Duck icon color to yellow |
| `src/pages/Index.tsx` | Add missing privacy text |
| `src/components/shared/DataTable.tsx` | Sortable columns (stretch) |

