
## End-to-End Website Audit: Anatini.dev

### Overall Assessment
The site is well-built with strong fundamentals: clean architecture, consistent UI patterns, good SEO infrastructure, and solid privacy-first messaging. Below are the issues and improvement opportunities found across all areas.

---

### 1. Content Inconsistencies

**Stale tool count in `index.html`**
- `index.html` meta tags say "15+ tools" (lines 7, 14) while the homepage hero badge says "28 Tools" and the `Index.tsx` PageMeta says "28+"
- Fix: Update `index.html` meta description and OG tags to match "28+"

**Footer is missing 10+ tools**
- The footer "Analysis & SQL" section only lists 6 tools (SQL Playground through Dataset Diff), omitting: Data Sampler, Deduplicator, SQL Formatter, Markdown Table, Column Editor, Data Merge, Pivot Table, Chart Builder, YAML/JSON, Regex Filter
- Fix: Add the missing tools to the footer grid, or restructure into a more compact listing

**Hero "Free Forever" feature card says "All 15+ tools"**
- `Index.tsx` line 56: `"All 15+ tools, no paywalls."` should say "All 28+ tools"

---

### 2. SEO Issues

**Mismatched canonical on SPA navigation**
- `PageMeta` updates the canonical via DOM manipulation, but crawlers reading the initial HTML will always see `https://anatini.dev/` as the canonical for every page since the `<link rel="canonical">` in `index.html` is hardcoded to `/`
- Impact: Search engines may not properly canonicalize tool pages
- Fix: This is inherent to client-side rendering; consider prerendering or SSR for SEO-critical pages, or at minimum ensure the `index.html` canonical is generic

**`index.html` JSON-LD `featureList` is outdated**
- `Index.tsx` line 68 lists only 5 tools in `featureList`; should list more or be generalized

**NotFound page lacks PageMeta**
- `NotFound.tsx` doesn't set a page title or meta description via `PageMeta`

---

### 3. Accessibility Issues

**Navbar logo alt text mismatch**
- `Navbar.tsx` line 80: `alt="SwiftDataTools logo"` -- should be "Anatini.dev logo"

**DropZone missing keyboard accessibility**
- The drop zone div uses `onClick` but has no `role="button"`, `tabIndex`, or `onKeyDown` handler for keyboard users

**Mobile menu not trapped**
- When the mobile nav is open, focus is not trapped, meaning keyboard users can tab through background content

---

### 4. Functional Issues

**SQL Playground: `tabCounter` uses module-level `let`**
- `SqlPage.tsx` line 47: `let tabCounter = 1` is at module scope. If the component unmounts and remounts (e.g., navigating away and back), the counter continues incrementing but the tabs reset to "Query 1" via `createTab()`. This is minor but can cause confusing tab labels like "Query 5" on a fresh page visit.

**SQL Playground: `handleRun` uses stale `activeTab` reference**
- `handleRun` (line 159) captures `activeTab.id` and `activeTab.sql` via `useCallback` deps, but `activeTab` is derived from state on every render. The deps `[db, activeTab.id, activeTab.sql]` cause `handleRun` to be recreated on every keystroke (since `activeTab.sql` changes). This is fine functionally but causes unnecessary re-renders of the SqlEditor.

**Chart Builder: PNG export has white background hardcoded**
- `ChartBuilderPage.tsx` line 155: `ctx.fillStyle = "#ffffff"` -- in dark mode, the exported PNG will have a jarring white background instead of matching the theme

---

### 5. Performance Opportunities

**DuckDB initialized eagerly on every page**
- `DuckDBProvider` wraps the entire app, meaning DuckDB WASM (~4MB) is downloaded and initialized even for pages that don't need it (About, Blog, Home)
- Fix: Lazy-initialize DuckDB only when a tool page is visited (e.g., init on first `useDuckDB()` call that needs `db`)

**No ErrorBoundary used anywhere**
- `ErrorBoundary` component exists at `src/components/shared/ErrorBoundary.tsx` but is never imported or used in the app
- Fix: Wrap routes or tool pages in `ErrorBoundary` to gracefully catch runtime crashes

---

### 6. Mobile / Responsive Issues

**SQL Playground sidebar stacks awkwardly on mobile**
- The `lg:grid-cols-[280px_1fr]` layout means on mobile, the entire sidebar (drop zone, URL input, tables) appears above the editor, pushing the editor far down the page
- Consider: Collapsible sidebar on mobile, or tabs for sidebar vs editor

---

### 7. Recommended Fix Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| High | Update stale tool counts ("15+" to "28+") in index.html, hero, JSON-LD | 5 min |
| High | Add missing tools to footer | 10 min |
| High | Fix navbar logo alt text | 1 min |
| Medium | Wrap routes in ErrorBoundary | 5 min |
| Medium | Fix Chart Builder dark-mode PNG export | 5 min |
| Medium | Add PageMeta to NotFound page | 2 min |
| Medium | Lazy-load DuckDB only on tool pages | 30 min |
| Low | Add keyboard accessibility to DropZone | 10 min |
| Low | Collapsible sidebar on mobile for SQL Playground | 20 min |
| Low | Fix module-level tabCounter in SqlPage | 5 min |

---

### Recommended Next Step
Fix the high-priority items first: update all stale "15+" references to "28+", sync the footer tool list, fix the logo alt text, and wrap routes in ErrorBoundary.
