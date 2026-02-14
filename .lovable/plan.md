
# Color Coding and Polish Refinement

## Overview
Add syntax highlighting and color coding across all tools that display structured output, matching the quality of the Log Viewer's level-based coloring. This covers 7 tools that currently render plain monochrome text.

---

## 1. Dataset Diff — Color-Coded Rows in DataTable

**Problem**: The diff tool filters by added/removed/modified but the DataTable rows are all the same color. The `_status` column exists in the data but isn't visually differentiated.

**Solution**: Add a `rowClassName` callback prop to the shared `DataTable` component so any consumer can provide per-row styling.

- **DataTable.tsx**: Add optional `rowClassName?: (row: any[], index: number) => string` prop. Apply it to `<tr>` alongside existing classes.
- **DiffPage.tsx**: Pass a `rowClassName` that checks the `_status` column (index 0):
  - `added` → `bg-green-50 dark:bg-green-950/20` (green tint)
  - `removed` → `bg-red-50 dark:bg-red-950/20` (red tint)
  - `modified` → `bg-yellow-50 dark:bg-yellow-950/20` (yellow tint)
- Also color-code the `_status` cell text itself (green/red/yellow) with a small badge-like span.

## 2. JSON Formatter — Syntax-Colored Output

**Problem**: The formatted JSON output is plain monochrome `<pre>` text.

**Solution**: Create a lightweight `SyntaxHighlightedJson` component that tokenizes JSON output and wraps tokens in colored spans:
- **Keys**: `text-foreground font-medium`
- **Strings**: `text-green-600 dark:text-green-400`
- **Numbers**: `text-blue-600 dark:text-blue-400`
- **Booleans**: `text-purple-600 dark:text-purple-400`
- **Null**: `text-red-500 dark:text-red-400`
- **Brackets/braces**: `text-muted-foreground`

Replace the `<pre>{output}</pre>` with the highlighted version when output exists.

## 3. XML Formatter — Syntax-Colored Output

**Problem**: Same as JSON — plain monochrome output textarea.

**Solution**: Replace the output `<textarea>` with a `<pre>` using XML-aware tokenization:
- **Tags** (`<tag>`, `</tag>`): `text-blue-600 dark:text-blue-400`
- **Attributes**: `text-orange-600 dark:text-orange-400`
- **Attribute values**: `text-green-600 dark:text-green-400`
- **Comments**: `text-muted-foreground italic`
- **Processing instructions** (`<?xml ...?>`): `text-purple-600 dark:text-purple-400`
- **Text content**: `text-foreground`

## 4. YAML Formatter — Syntax-Colored Output

**Problem**: Plain monochrome output textarea.

**Solution**: Replace output `<textarea>` with highlighted `<pre>`:
- **Keys** (before `:`): `text-blue-600 dark:text-blue-400 font-medium`
- **Strings**: `text-green-600 dark:text-green-400`
- **Numbers**: `text-purple-600 dark:text-purple-400`
- **Booleans** (`true`/`false`): `text-orange-600 dark:text-orange-400`
- **Comments** (`#`): `text-muted-foreground italic`
- **List markers** (`-`): `text-muted-foreground`

## 5. SQL Formatter / CSV-to-SQL — Syntax-Colored SQL Output

**Problem**: SQL output is monochrome `<pre>` or `<textarea>`.

**Solution**: Create a shared `highlightSql` function that tokenizes SQL and applies colors:
- **Keywords** (`SELECT`, `FROM`, `WHERE`, `CREATE TABLE`, `INSERT INTO`, etc.): `text-blue-600 dark:text-blue-400 font-bold`
- **Strings** (single-quoted): `text-green-600 dark:text-green-400`
- **Numbers**: `text-purple-600 dark:text-purple-400`
- **Comments**: `text-muted-foreground italic`
- **Operators**: `text-orange-600 dark:text-orange-400`
- **Identifiers**: `text-foreground`

Apply to: `SqlFormatterPage.tsx` output pane and `CsvToSqlPage.tsx` output pane.

## 6. Hex Viewer — Byte Category Coloring

**Problem**: All hex bytes are the same color. Professional hex editors color-code byte categories.

**Solution**: Color individual bytes by category in the hex dump:
- **Null bytes** (0x00): `text-muted-foreground/40`
- **Printable ASCII** (0x20-0x7E): `text-foreground` (default)
- **Control characters** (0x01-0x1F, 0x7F): `text-red-500 dark:text-red-400`
- **High bytes** (0x80-0xFF): `text-blue-600 dark:text-blue-400`
- **Whitespace** (0x09, 0x0A, 0x0D, 0x20): `text-green-600 dark:text-green-400`

Render each byte as an individual `<span>` instead of joining into a single string.

## 7. JSON Schema Validator — Color-Coded Error Paths

**Problem**: Validation errors show paths in red but could be more visually structured.

**Solution**: Minor polish — already has color coding. Add line numbers to error listing and a green checkmark icon per valid field when valid.

---

## Technical Implementation

### New Shared Component: `src/components/shared/SyntaxHighlight.tsx`
A single file containing highlight functions for JSON, XML, YAML, and SQL. Each function returns `ReactNode[]` with colored spans. This avoids duplicating tokenization logic across pages.

```text
SyntaxHighlight.tsx
  - highlightJson(text: string): ReactNode
  - highlightXml(text: string): ReactNode  
  - highlightYaml(text: string): ReactNode
  - highlightSql(text: string): ReactNode
```

### DataTable Enhancement
Add `rowClassName` prop — minimal, backward-compatible change.

### Files to Create
- `src/components/shared/SyntaxHighlight.tsx`

### Files to Modify
- `src/components/shared/DataTable.tsx` — add `rowClassName` prop
- `src/pages/DiffPage.tsx` — pass row coloring callback + badge the status cell
- `src/pages/JsonFormatterPage.tsx` — use `highlightJson` for output
- `src/pages/XmlFormatterPage.tsx` — replace output textarea with highlighted pre
- `src/pages/YamlFormatterPage.tsx` — replace output textarea with highlighted pre
- `src/pages/SqlFormatterPage.tsx` — use `highlightSql` for output
- `src/pages/CsvToSqlPage.tsx` — use `highlightSql` for SQL preview
- `src/pages/HexViewerPage.tsx` — per-byte category coloring

### No Dependencies Added
All highlighting is done with simple regex tokenizers and Tailwind classes — no external syntax highlighting libraries needed. Keeps the bundle lean.
