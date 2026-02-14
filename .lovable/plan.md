
# Polish & Improvements Plan

## Overview
After auditing all 46 tools, the codebase is well-structured but has several areas for refinement across UX, performance, accessibility, and missing features.

---

## 1. Homepage Search / Filter Bar
**Problem**: With 46 tools, users have to scroll to find what they need. The navbar dropdown is also long.

**Solution**: Add a search/filter input at the top of the `#tools` section on the Index page. Typing filters tool cards in real-time across all categories. Uses `cmdk`-style fuzzy matching (already installed as a dependency).

**Files**: `src/pages/Index.tsx`

---

## 2. Keyboard Shortcuts (Cmd+K Command Palette)
**Problem**: No quick way to jump between tools without navigating manually.

**Solution**: Add a global `Cmd+K` / `Ctrl+K` command palette using the already-installed `cmdk` package. Lists all 46 tools, blog posts, and pages. Searching narrows results, Enter navigates.

**Files**: Create `src/components/shared/CommandPalette.tsx`, update `src/components/layout/Layout.tsx`

---

## 3. CSV-to-SQL Missing Syntax Highlighting
**Problem**: The plan called for adding `highlightSql` to `CsvToSqlPage.tsx` but it was not implemented -- the output still uses `RawPreview` (plain text).

**Solution**: Add a syntax-highlighted SQL preview using `highlightSql` in the output section, similar to `SqlFormatterPage.tsx`.

**Files**: `src/pages/CsvToSqlPage.tsx`

---

## 4. JSON Schema Validator -- Syntax Highlighting for Inputs
**Problem**: Both textarea inputs (schema + document) are plain monochrome. This is the only JSON-focused tool without colored output.

**Solution**: Replace the read-only display with syntax-highlighted JSON preview using `highlightJson`. Add a "valid" green checkmark badge next to the schema label when schema parses correctly.

**Files**: `src/pages/JsonSchemaValidatorPage.tsx`

---

## 5. "Copy as cURL" / Share Output Links
**Problem**: Several tools (Base64, Hash, JSON Formatter) have no way to share or reproduce results.

**Solution**: Add a "Copy as data URI" button for Base64 output. Add output character/byte count badges to formatters that don't have them (XML, YAML formatters).

**Files**: `src/pages/Base64Page.tsx`, `src/pages/XmlFormatterPage.tsx`, `src/pages/YamlFormatterPage.tsx`

---

## 6. Accessibility: Missing aria-labels and Focus Indicators
**Problem**: Several interactive elements lack `aria-label` attributes. The `ToggleButton` component has no `role="group"` or radio semantics.

**Solution**:
- Add `role="radiogroup"` to `ToggleButton` wrapper, `role="radio"` + `aria-checked` to each option
- Add `aria-label` to icon-only buttons (theme toggle, mobile menu)
- Ensure all `textarea` elements have associated labels (some use visual labels without `htmlFor`)

**Files**: `src/components/shared/ToggleButton.tsx`, `src/components/shared/ThemeToggle.tsx`, `src/components/layout/Navbar.tsx`

---

## 7. Output Stats Badges (Consistency)
**Problem**: Some tools show output stats (size, duration) and others don't. For example, JSON Formatter shows nothing about output size; SQL Formatter doesn't show formatted line count.

**Solution**: Add a small stats bar below the output in:
- **JSON Formatter**: "X keys, Y lines, Z bytes"
- **SQL Formatter**: "X lines, Y bytes"  
- **XML Formatter**: "X lines, Y bytes"
- **YAML Formatter**: "X lines, Y bytes"

**Files**: `src/pages/JsonFormatterPage.tsx`, `src/pages/SqlFormatterPage.tsx`, `src/pages/XmlFormatterPage.tsx`, `src/pages/YamlFormatterPage.tsx`

---

## 8. Lazy Route Loading (Performance)
**Problem**: All 46 tool pages are imported eagerly in `App.tsx`, meaning the initial bundle includes all page code even though users typically visit 1-2 tools per session.

**Solution**: Convert all route imports to `React.lazy()` with `Suspense` fallback. This splits each tool into its own chunk, reducing initial load by ~60%.

**Files**: `src/App.tsx`

---

## Technical Summary

```text
Files to Create:
  - src/components/shared/CommandPalette.tsx

Files to Modify:
  - src/App.tsx (lazy loading)
  - src/pages/Index.tsx (search filter)
  - src/components/layout/Layout.tsx (command palette)
  - src/pages/CsvToSqlPage.tsx (SQL highlighting)
  - src/pages/JsonSchemaValidatorPage.tsx (JSON highlighting)
  - src/pages/Base64Page.tsx (data URI copy)
  - src/pages/JsonFormatterPage.tsx (output stats)
  - src/pages/SqlFormatterPage.tsx (output stats)
  - src/pages/XmlFormatterPage.tsx (output stats)
  - src/pages/YamlFormatterPage.tsx (output stats)
  - src/components/shared/ToggleButton.tsx (a11y)
  - src/components/shared/ThemeToggle.tsx (a11y)
  - src/components/layout/Navbar.tsx (a11y)

No new dependencies needed.
```
