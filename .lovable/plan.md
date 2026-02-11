

# Standardize All Converter Pages to Match UI Philosophy

## Overview
Apply the CsvToParquet layout pattern (already implemented) to all 8 remaining converter pages. The goal is consistent structure across every converter: file bar at top, options next to their action button, output promoted above input, download as the dominant element, and input preview demoted to a collapsible section.

## Reference Pattern (from CsvToParquetPage)

```text
1. FILE BAR:     [file info + Inspect]  ─────────────────  [New file]
2. OPTIONS ROW:  [config controls]  ─────────  [Convert to X]
3. OUTPUT:       border-2 container with:
                 - CheckCircle2 + consolidated stats line
                 - Full-width large Download button
                 - Collapsible "Preview output data"
4. INPUT:        Collapsible section (open by default)
                 - Toggle tabs inside collapsible header
5. CROSS LINKS:  At bottom
```

## Changes Per Page

### 1. CsvToJsonPage
- Move Convert button from file bar into the options row (next to Output Format / Pretty Print / Indent controls)
- Remove "Re-convert" label, always say "Convert to JSON"
- Move OUTPUT section above INPUT section
- Wrap output in `border-2` container with CheckCircle2 stats bar
- Make Download button full-width `size="lg"` (currently `size="sm"`)
- Wrap output preview (table/raw) in Collapsible "Preview output data"
- Wrap INPUT section in Collapsible (open by default), add `showInputPreview` state
- Add `showOutputPreview` state

### 2. JsonToCsvPage
- Move Convert button from file bar into options row (next to Delimiter / Include Header)
- Remove "Re-convert", always "Convert to CSV"
- Move OUTPUT above INPUT
- Wrap output in `border-2` with CheckCircle2 stats
- Download button: full-width `size="lg"`
- Wrap output preview in Collapsible
- Wrap INPUT in Collapsible (open by default)

### 3. ParquetToCsvPage
- Move Convert button from file bar into options row (next to Delimiter / Header / Null repr)
- Remove "Re-convert", always "Convert to CSV"
- Move OUTPUT above INPUT
- Wrap output in `border-2` with CheckCircle2 stats
- Download button: full-width `size="lg"`
- Wrap output preview in Collapsible
- Wrap INPUT in Collapsible (open by default) -- currently it's a bare DataTable with a note

### 4. JsonToParquetPage
- Move Convert button from file bar into options row (next to Compression / Row Group Size)
- Make options row single-line (currently stacked vertically), matching CsvToParquet layout
- Remove "Re-convert", always "Convert to Parquet"
- Move OUTPUT above INPUT
- Wrap output in `border-2` with CheckCircle2 stats (merge the two stats bars into one)
- Download button: full-width `size="lg"` (currently `size="sm"`)
- Wrap output preview in Collapsible
- Wrap INPUT in Collapsible (open by default)

### 5. ParquetToJsonPage
- Move Convert button from file bar into options row (next to Output Format / Pretty-print)
- Make options always visible inline row (currently a bordered box with stacked layout)
- Remove "Re-convert", always "Convert to JSON"
- Move OUTPUT above INPUT
- Wrap output in `border-2` with CheckCircle2 stats
- Download button: full-width `size="lg"` (currently `size="sm"`)
- Wrap output preview in Collapsible
- Wrap INPUT in Collapsible (open by default) -- currently bare DataTable with note

### 6. ExcelToCsvPage
- Move Download button below the sheet selector as a large full-width button (currently in file bar as normal size)
- File bar keeps only [FileInfo] and [New file]
- No separate output section needed (conversion is instant/implicit), but the table/raw toggle and data should be wrapped in a clear output-like container
- Keep sheet selector as the "options" area

### 7. CsvToExcelPage
- Move Download Excel button out of file bar, make it large full-width below the sheet naming section
- File bar keeps only [FileInfo] and [New file]
- Data preview should be in a collapsible section below

### 8. CsvToSqlPage
- Move Convert button from file bar into the options panel (at the end of the options row)
- Remove "Re-convert", always "Convert to SQL"
- Move OUTPUT above INPUT
- Wrap output in `border-2` with CheckCircle2 stats
- Download button: full-width `size="lg"` (currently `size="sm"`)
- Wrap INPUT in Collapsible (open by default)
- Schema Editor stays between options and output (it's a configuration tool, not input preview)

### 9. CrossToolLinks Component
- Change from bordered card to inline text links per philosophy: "Continue: Inspector . Flatten . SQL Playground"
- Remove the border container, heading "Work with this file", and arrow icons
- Render as a single line with centered dot separators

## Technical Details

### New imports needed on each page
```typescript
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
```

### New state variables per page
```typescript
const [showInputPreview, setShowInputPreview] = useState(true);
const [showOutputPreview, setShowOutputPreview] = useState(false);
```

### Consistent output section pattern
```tsx
{conversionResult && (
  <div className="space-y-3 border-2 border-border p-4">
    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
    <div className="flex items-center gap-4 flex-wrap bg-muted/30 px-4 py-2 text-xs">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      {/* stats */}
    </div>
    <Button onClick={handleDownload} className="w-full" size="lg">
      <Download className="h-5 w-5 mr-2" /> Download {format}
    </Button>
    {/* Copy button for text outputs */}
    <Collapsible open={showOutputPreview} onOpenChange={setShowOutputPreview}>
      {/* preview toggle */}
    </Collapsible>
  </div>
)}
```

### CrossToolLinks redesign
```tsx
// From bordered card with arrow icons to:
<p className="text-xs text-muted-foreground text-center">
  Continue: <Link>Inspector</Link> · <Link>Flatten</Link> · <Link>SQL Playground</Link>
</p>
```

### Files modified
- `src/pages/CsvToJsonPage.tsx`
- `src/pages/JsonToCsvPage.tsx`
- `src/pages/ParquetToCsvPage.tsx`
- `src/pages/JsonToParquetPage.tsx`
- `src/pages/ParquetToJsonPage.tsx`
- `src/pages/ExcelToCsvPage.tsx`
- `src/pages/CsvToExcelPage.tsx`
- `src/pages/CsvToSqlPage.tsx`
- `src/components/shared/CrossToolLinks.tsx`

### No new dependencies needed
All components (Collapsible, ToggleButton, Button, CheckCircle2) already exist in the project.

