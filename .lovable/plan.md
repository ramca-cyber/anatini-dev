

# Fix CrossToolLinks Visual & Logic Issues

## Problem

After conversion, converter pages show **two stacked "Work with this file" boxes** with identical headings (visible in the screenshot). This is confusing because:

- Both say "Work with this file" but refer to different files (input vs output)
- The input links include a **self-link** to the current page (e.g., "Convert to CSV" on the Parquet-to-CSV page)
- The output links have **no file ID**, so they can't carry the converted data forward

## Solution

### 1. Filter out self-links from CrossToolLinks

Add a `currentRoute` prop to `CrossToolLinks` so it automatically hides the link pointing to the current page. Each page passes its own route (e.g., `/parquet-to-csv`) and that link gets filtered out.

### 2. Merge into a single unified box

Instead of two separate boxes, combine input and output links into **one "Work with this file" section** with labeled sub-groups when both are present. After conversion, the single box shows:

- **Source (Parquet):** Convert to JSON, View Data, SQL Playground, Profile Data
- **Output (CSV):** Convert to JSON, Convert to Parquet, Generate SQL, View Data, ...

This keeps the UI clean with one box instead of two identical-looking ones.

### 3. Pass fileId to output links where possible

The output CrossToolLinks currently never receives a `fileId`. While the converted output isn't stored in FileStore (it's generated in-memory), we can at minimum label the section clearly so users understand these links open fresh (without file carry-over).

## Files to Change

| File | Change |
|------|--------|
| `CrossToolLinks.tsx` | Add `excludeRoute` prop to filter self-links; add optional `heading` prop for sub-labels |
| `ParquetToCsvPage.tsx` | Pass `excludeRoute="/parquet-to-csv"`, use single combined section |
| `ParquetToJsonPage.tsx` | Same pattern |
| `CsvToJsonPage.tsx` | Same pattern |
| `CsvToParquetPage.tsx` | Same pattern |
| `JsonToCsvPage.tsx` | Same pattern |
| `JsonToParquetPage.tsx` | Same pattern |

## Technical Details

**CrossToolLinks component changes:**
- New optional `excludeRoute?: string` prop -- filters out links whose `route` matches
- New optional `heading?: string` prop -- overrides the default "Work with this file" heading
- When two CrossToolLinks are used on a converter page, wrap them in a single container div with sub-headings like "Source file" and "Converted output"

**Converter pages pattern** (applied to all 6 affected converters):
```
{/* Single combined cross-tool section */}
<div className="border-2 border-border p-4 space-y-4">
  <CrossToolLinks format="parquet" fileId={storedFileId} 
    excludeRoute="/parquet-to-csv" heading="Source file" inline />
  {conversionResult && (
    <CrossToolLinks format="csv" 
      excludeRoute="/parquet-to-csv" heading="Converted output" inline />
  )}
</div>
```

The `inline` prop renders just the heading + link chips without the outer border, so the parent div provides the single container.

