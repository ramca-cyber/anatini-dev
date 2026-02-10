

# UI/UX Audit & Optimization Plan

## 1. Information Hierarchy & Visual Clutter

### Problem: Too many small bordered boxes stacked vertically
Every tool page stacks multiple `border-2 border-border` boxes (file info, parquet info, options, input, output, conversion stats, cross-tool links). On a single converter page, there can be 6-8 bordered containers in a row, creating a "wall of boxes" effect that makes scanning difficult.

### Fix
- **Collapse file metadata into the options bar.** The FileInfo component (name, size, rows, cols) and the parquet metadata (row groups, compression) should merge into a single top bar with the action buttons. Currently they're 3 separate rows.
- **Remove the standalone "Parquet Info" box** (row groups + compression) and fold those 2 values into the existing FileInfo component as additional chips.
- **Reduce border weight from `border-2` to `border`** on secondary containers (options, cross-tool links) to create visual hierarchy -- only the primary data sections (input table, output table, conversion stats) should use `border-2`.

### Files
- `src/components/shared/FileInfo.tsx` -- add optional `extras` prop for additional metadata chips
- All converter pages -- consolidate the parquet/json info boxes into FileInfo

---

## 2. Conversion Stats Box: Oversized for the data shown

### Problem
The conversion stats panel (`border-2 border-foreground bg-card p-4`) uses `text-lg font-bold` for just 3 values (time, output size, size change). It's the most visually heavy element on the page, but the information it shows is secondary. The `border-foreground` (full white/black border) makes it scream louder than the actual data.

### Fix
- Reduce to a compact inline bar: a single row with the 3 stats as small chips, using `border-border` instead of `border-foreground`
- Change from `text-lg` to `text-sm` for values
- This saves ~60px of vertical space per converter page

### Files
- All 6 converter pages (CsvToJson, CsvToParquet, JsonToCsv, JsonToParquet, ParquetToCsv, ParquetToJson)

---

## 3. Redundant "Input" section label on converters

### Problem
On pages like Parquet-to-CSV, the "Input" section header sits between the file info and the data table, but the context is already obvious -- you just uploaded a file and you're looking at its data. The label adds noise without clarity.

### Fix
- Remove the standalone "INPUT" heading when there's only one input source (file upload pages)
- Keep it only on pages that have both a Table View and Raw Input toggle (like CSV-to-JSON), where it serves as a toggle label

### Files
- `ParquetToCsvPage.tsx`, `ParquetToJsonPage.tsx` -- remove redundant "Input" h3

---

## 4. Mobile layout issues

### Problem (observed on 390px viewport)
- The DropZone padding (`p-10`) is excessive on mobile -- the upload area takes nearly the full viewport
- The options bar (delimiter, header checkbox, null repr) wraps poorly -- each control breaks to a new line, creating a very tall stack
- The FileInfo + InspectLink + action buttons row wraps into 3 lines on mobile
- Tool cards on homepage are single-column which is fine, but the hero section has excessive padding (`py-20 md:py-28`)

### Fix
- Reduce DropZone to `p-6 md:p-10` for mobile comfort
- Make the options bar a 2-column grid on mobile: `grid grid-cols-2 gap-3 sm:flex sm:flex-wrap`
- Stack action buttons below file info on mobile using `flex-col sm:flex-row`
- Reduce hero padding to `py-12 md:py-20 lg:py-28`

### Files
- `src/components/shared/DropZone.tsx`
- `src/pages/Index.tsx` (hero padding)
- All converter pages (options bar layout)

---

## 5. Toggle buttons lack accessible focus states

### Problem
The custom toggle buttons (delimiter selector, output format, view switcher) use raw `<button>` elements with no visible focus ring. Keyboard users can't see which button is focused. The active state is purely background color.

### Fix
- Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` to all toggle button classes
- Extract a shared `ToggleButton` component to eliminate the 15+ duplicate class strings across pages

### Files
- New: `src/components/shared/ToggleButton.tsx`
- All pages using inline toggle button patterns (converters, inspectors, viewers)

---

## 6. Empty states after "New file" click

### Problem
Clicking "New file" resets all state but the transition is jarring -- the entire page content disappears instantly and you're back to the upload zone. There's no visual continuity.

### Fix
- This is minor and cosmetic. No change needed for now -- the instant reset is fast and functional. Flagging for awareness only.

---

## 7. CrossToolLinks visual weight

### Problem
The cross-tool links section at the bottom of every page is visually heavy with its `border-2 border-border p-4` container. Each link chip also has `border-2 border-border`, creating a border-within-border effect. The section competes visually with the actual tool output.

### Fix
- Reduce the outer container to `border border-border` (1px)
- Reduce link chips to `border border-border` (1px)
- Add subtle `text-muted-foreground` to the link text instead of `text-foreground` so they read as secondary navigation, not primary actions

### Files
- `src/components/shared/CrossToolLinks.tsx`

---

## 8. Inspector pages: section headers all look identical

### Problem
All inspector sections (File Identity, CSV Structure, Column Overview, Data Patterns, Warnings) use the same visual treatment: `border-b-2 border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase`. When there are 5-6 sections stacked, they blur together and the user can't quickly locate a specific section.

### Fix
- Add a subtle left-border accent to the section header: `border-l-4 border-l-foreground` on the header bar to create a visual anchor
- For warning sections specifically, use `border-l-4 border-l-amber-500` to draw attention

### Files
- `src/pages/CsvInspectorPage.tsx`
- `src/pages/JsonInspectorPage.tsx`
- `src/pages/ParquetInspectorPage.tsx`

---

## 9. "Try with sample data" button is too subtle

### Problem
The sample data button (`variant="ghost"`) with muted text is almost invisible. For first-time users, this is the most important call-to-action after the upload zone -- it lets them explore the tool without having data ready. It's buried and easy to miss.

### Fix
- Change from `variant="ghost"` to `variant="outline"` with slightly bolder text
- Add a subtle dashed border to make it feel like an "alternative action"
- Position it inside the DropZone component itself, below the "Click or drag" text, rather than as a separate element below

### Files
- `src/components/shared/DropZone.tsx` -- add optional `sampleAction` prop
- All pages that use the sample data pattern

---

## 10. Footer is minimal and lacks utility

### Problem
The footer has 3 links (DuckDB, Privacy, All Tools) and a copyright line. It doesn't help users navigate between tools or discover related features. Given this is a 21-tool suite, the footer is a missed navigation opportunity.

### Fix
- Add a compact tool grid to the footer: 4 columns with the tool categories (Converters, Viewers, Inspectors, Analysis) and their links
- Keep the existing privacy/DuckDB line at the bottom

### Files
- `src/components/layout/Footer.tsx`

---

## Summary of Priority

| Priority | Item | Impact |
|----------|------|--------|
| High | #4 Mobile layout | Usability on 40%+ of traffic |
| High | #5 Focus states | Accessibility compliance |
| Medium | #1 Visual clutter reduction | Scannability |
| Medium | #2 Conversion stats sizing | Visual hierarchy |
| Medium | #7 CrossToolLinks weight | Visual noise |
| Medium | #9 Sample data visibility | First-time user experience |
| Low | #3 Input label removal | Minor noise |
| Low | #8 Inspector section accents | Differentiation |
| Low | #10 Footer navigation | Discoverability |
| Skip | #6 Empty state transition | Cosmetic only |

## Technical Approach

1. Create `ToggleButton` shared component first (used everywhere)
2. Update `DropZone` with responsive padding and optional sample action
3. Update `CrossToolLinks` border weights
4. Update `FileInfo` to accept extra metadata
5. Update converter pages to use new components and consolidated layout
6. Update inspector section headers with accent borders
7. Update `Footer` with tool grid
8. Mobile-test all pages at 390px

