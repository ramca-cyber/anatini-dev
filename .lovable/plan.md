

## Anatini.dev Spec Gap Analysis

### Rebranding: DuckTools to Anatini.dev
The spec renames the product from "DuckTools" to "Anatini.dev". This affects the Navbar logo text, page titles, footer, and all SEO references.

**Files:** `Navbar.tsx`, `ToolPage.tsx`, `Footer.tsx`, `Index.tsx`, `index.html`

---

### 8 New Tool Pages

The spec defines 14 tools total. Currently there are 6. The following 8 are entirely new:

| # | Tool | Route | Notes |
|---|------|-------|-------|
| 1 | CSV to JSON | `/csv-to-json` | Options: delimiter, output format (array/NDJSON), pretty print. CodeBlock output with copy/download |
| 2 | JSON to CSV | `/json-to-csv` | Options: delimiter, flatten nested, quote style, array handling. Table + raw output |
| 3 | Parquet Viewer | `/parquet-viewer` | 3 tabs: Data (search/filter/paginate), Schema (column types + encoding), Metadata (row groups, compression). Export as CSV/JSON/DDL |
| 4 | JSON Formatter | `/json-formatter` | Pure JS (no DuckDB). Textarea input, format/minify/validate buttons. Tree view + formatted view. Indent/sort options |
| 5 | CSV Viewer | `/csv-viewer` | Search/filter, sortable columns, column quick stats on header click, "Open in SQL Playground" link |
| 6 | CSV to SQL | `/csv-to-sql` | Generate INSERT + CREATE TABLE statements. Options: batch size, dialect, DROP TABLE, index. Schema preview with editable types |
| 7 | Excel to CSV / CSV to Excel | `/excel-csv-converter` | Requires SheetJS library. Multi-sheet support, sheet selector, bi-directional conversion |
| 8 | JSON to Parquet | `/json-to-parquet` | Options: flatten nested, compression, row group size. Compression report card |

Each new tool needs:
- A new page component in `src/pages/`
- Route registration in `App.tsx`
- Navigation entry in `Navbar.tsx`
- Card entry on `Index.tsx` homepage

---

### Existing Tool Refinements

**Convert Page** (`/convert` currently handles CSV-to-Parquet and Parquet-to-CSV)
- The spec splits this into two separate tools (`/csv-to-parquet` and `/parquet-to-csv`) with distinct options for each direction (e.g., row group size for Parquet, quote style / null representation for CSV export)
- Decision: either split into two pages or keep combined but add the missing options (row group size, quote style, null representation, timestamp format)

**JSON Flattener** (`/flatten`)
- Spec wants pure JS (no DuckDB) with a recursive `flatten()` function
- Side-by-side Before (tree view) / After (flat JSON) display
- Options: separator (dot/underscore/slash/bracket), max depth, array handling (index/bracket/stringify), preserve empty objects, preserve nulls
- Stats: "Depth reduced: 4 to 1 | Keys: 6 | Nested objects removed: 2"
- Currently uses DuckDB which is heavy for this task

**Data Profiler** (`/profiler`)
- Per-column cards (one card per column) instead of table rows -- current impl uses table rows with expandable details
- Histograms (Recharts bar charts) for numeric distributions
- Bar charts for top values in categorical columns
- Donut/pie for boolean columns
- Sparklines for date columns
- Correlation heatmap between numeric columns
- Pattern detection for strings (email-like, phone-like, URL-like)

**SQL Playground** (`/sql`)
- Sample queries dropdown based on loaded schema
- Error display with line/column highlighting
- Currently missing: "Download results as JSON" button (has CSV and Parquet already)

**Schema Generator** (`/schema`)
- Spec adds: NOT NULL constraint on complete columns, PRIMARY KEY selection, DEFAULT values, VARCHAR sizing strategy dropdown (Exact max / +20% / +50% / Fixed 255 / TEXT)
- Multi-dialect output as tabs (currently uses a dropdown)

---

### Route Changes

The spec uses different route slugs than current implementation:

| Current | Spec |
|---------|------|
| `/convert` | `/csv-to-parquet` and `/parquet-to-csv` |
| `/flatten` | `/json-flattener` |
| `/sql` | `/sql-playground` |
| `/profiler` | `/data-profiler` |
| `/diff` | (not in this spec -- Dataset Diff is not mentioned as one of the 14 tools) |
| `/schema` | `/schema-generator` |

---

### Shared Component Gaps

**CodeBlock component** (NEW) -- Syntax-highlighted output viewer with copy button, line numbers, scrollable max-height. Used by CSV-to-JSON, JSON Formatter, CSV-to-SQL, Schema Generator.

**DownloadButton component** (NEW) -- Shows file size estimate, animated checkmark on download. Replaces ad-hoc download buttons across tools.

**Privacy Badge** -- Spec wants a green lock "Your data never leaves your browser" badge on every tool page (currently only in Navbar as "100% Offline").

**SEO Content Section** -- Every tool page should have a collapsible section below the workspace with: "What is [format]?", "How to use this tool", FAQ (3-5 questions with accordion).

---

### Layout and Navigation

**Navbar**: Needs to accommodate 14 tools -- a dropdown/menu is necessary instead of individual links. The spec shows "Tool Nav Dropdown".

**Footer**: Spec wants "Powered by DuckDB | Privacy | All Tools" with copyright line. Current footer is minimal.

**Homepage**: Tool grid should be 4 columns on desktop (currently 3). Add "Why Anatini?" section with 4 feature cards and trust badges.

---

### New Dependency

**SheetJS (xlsx)**: Required for Tool #13 (Excel to CSV / CSV to Excel). Needs to be added to package.json.

---

### Implementation Order (recommended)

1. **Rebranding** -- Rename DuckTools to Anatini.dev everywhere
2. **Shared components** -- CodeBlock, DownloadButton, SEO FAQ section
3. **Route restructuring** -- Update slugs to match spec
4. **Navbar overhaul** -- Tool dropdown for 14 tools
5. **New tool pages** (in order of complexity):
   - JSON Formatter (pure JS, simplest)
   - CSV to JSON / JSON to CSV (straightforward DuckDB)
   - JSON to Parquet (similar to existing convert)
   - Parquet Viewer (new but well-defined)
   - CSV Viewer (similar to Parquet Viewer)
   - CSV to SQL (extension of Schema Generator)
   - Excel converter (requires SheetJS)
6. **Existing tool refinements** -- Profiler charts, Flattener tree view, etc.
7. **SEO content** -- FAQ sections per tool page
8. **Homepage refresh** -- 4-column grid, trust badges

---

### Technical Details

**New files to create:**
- `src/pages/CsvToJsonPage.tsx`
- `src/pages/JsonToCsvPage.tsx`
- `src/pages/ParquetViewerPage.tsx`
- `src/pages/JsonFormatterPage.tsx`
- `src/pages/CsvViewerPage.tsx`
- `src/pages/CsvToSqlPage.tsx`
- `src/pages/ExcelCsvPage.tsx`
- `src/pages/JsonToParquetPage.tsx`
- `src/components/shared/CodeBlock.tsx`
- `src/components/shared/DownloadButton.tsx`
- `src/components/shared/SeoFaq.tsx`

**Files to modify:**
- `src/App.tsx` -- add 8 new routes, update existing route paths
- `src/components/layout/Navbar.tsx` -- rebrand, tool dropdown
- `src/components/layout/Footer.tsx` -- rebrand, add links
- `src/pages/Index.tsx` -- rebrand, 14 tool cards, 4-col grid, trust badges
- `index.html` -- update title/meta to Anatini.dev
- `src/components/shared/ToolPage.tsx` -- add privacy badge, SEO slot
- Existing tool pages -- route path updates, incremental refinements

**Note on Dataset Diff:** The uploaded spec does not include a Diff tool among the 14. The existing `/diff` page should be kept but is not part of this spec's scope. It could be added as a 15th tool or folded into the profiler.

