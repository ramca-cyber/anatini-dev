

## DuckTools — Implementation Plan

### Phase 1: Foundation & Global Shell

**Design System**
- Dark theme with the specified color palette (deep navy backgrounds, cyan accents)
- JetBrains Mono + IBM Plex Sans fonts loaded via Google Fonts
- Lucide icons throughout

**Global Layout**
- Top navigation bar: DuckTools logo (duck icon + wordmark), horizontal tool tabs (pill-shaped), privacy badge with green dot
- Footer: "100% offline · No data leaves your browser"
- Responsive: hamburger menu on mobile, full nav on desktop

**Routing**
- `/` → Landing page
- `/convert`, `/flatten`, `/sql`, `/profiler`, `/diff`, `/schema` → Tool pages
- `/about` → About page

---

### Phase 2: Landing Page

- Hero section with tagline: "Browser-powered data tools. Nothing leaves your machine."
- 6 tool cards in a 3×2 grid with dark card backgrounds, hover effects (cyan border, lift shadow, arrow slide)
- Privacy statement section at the bottom
- SEO-ready with proper headings and meta descriptions

---

### Phase 3: Shared Components & DuckDB Integration

**DuckDB-WASM Setup**
- Lazy-loaded DuckDB-WASM instance shared across tools
- React context/provider for DuckDB access

**Shared Drop Zone Component**
- Drag-and-drop file upload with dashed border, cyan glow on drag-over
- File type validation (CSV, Parquet, JSON)
- Loading state with progress bar and file metadata (rows, columns, size)
- Privacy reassurance text

**Shared Data Table Component**
- Virtualized scrolling for large results
- Sortable columns, sticky headers
- Null values rendered as `∅`, long text truncation
- Row hover highlighting

---

### Phase 4: Tool Pages (all 6 as functional stubs with DuckDB)

**CSV ↔ Parquet Converter** (`/convert`)
- Two-panel input/output layout with drop zone
- Auto-detect conversion direction, show file info (size, rows, columns)
- Options panel (delimiter, header row, compression) collapsed by default
- Convert button, download output, preview first 100 rows

**JSON Flattener** (`/flatten`)
- Drop zone for JSON/JSONL files
- Structure detection display showing nesting paths
- Naming convention toggle (dot notation vs underscore)
- Result table preview + download as CSV/Parquet

**SQL Playground** (`/sql`)
- Two-panel layout: file list + schema browser (left), code editor + results (right)
- CodeMirror editor with SQL syntax highlighting
- Multi-file support (each file becomes a table)
- Run query with Ctrl+Enter, auto-generate starter query
- Export results as CSV/Parquet/clipboard

**Data Quality Profiler** (`/profiler`)
- Four tabs: Overview, Columns, Findings, Export
- Overview: summary cards (rows, columns, null rate, findings count), column type distribution bars, top issues list
- Columns: sortable table with detail expansion (statistics, top values, distribution)
- Findings: severity-coded cards (critical/warning/info) with descriptions and suggested fixes
- Export: HTML report, JSON report, CSV summary, clipboard copy

**Dataset Diff** (`/diff`)
- Two side-by-side drop zones (Before / After)
- Auto-detect join key with manual override dropdown
- Diff summary cards (added, removed, modified, unchanged)
- Column-level and row-level change display with color coding
- Download diff as CSV/JSON

**Schema Generator** (`/schema`)
- Drop zone + target database toggle buttons (Postgres, MySQL, BigQuery, Snowflake, DuckDB)
- Editable inferred schema table (column, detected type, mapped type, nullable)
- Options: table name, schema, NOT NULL constraints, comments
- Live-generated DDL with copy and download

---

### Phase 5: About Page & Polish

- About page with privacy statement, tech stack info, and open-source messaging
- Micro-interactions: file drop animations, progress bar shimmer, number count-up effects, download checkmark animations
- Toast notifications for clipboard copy
- Mobile responsive behavior (stacked layouts, hamburger menu, horizontal scroll tables)

