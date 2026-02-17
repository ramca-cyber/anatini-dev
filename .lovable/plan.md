

## Feedback Implementation Plan

This is a set of 7 improvements spanning SEO code-splitting, auto-conversion UX, branding updates, loading overlays, confirmation dialogs, paste-converter styling, and bundle analysis.

---

### 1. Split SEO Content into Per-Tool Lazy Files

**What changes:** The monolithic `src/lib/seo-content.tsx` (784 lines, ~95KB) gets split into individual files under `src/lib/seo/`, one per tool ID.

**Files:**
- Create `src/lib/seo/<tool-id>.tsx` for each of the ~65 tool entries (e.g., `src/lib/seo/csv-to-parquet.tsx`)
- Each file exports `{ metaDescription, whatIs, howToUse, faqs }`
- Create `src/hooks/useToolSeo.ts` -- a hook that lazily imports the correct SEO file using `React.lazy` + dynamic `import()`
- Update `src/lib/seo-content.tsx` to become a thin facade: `getToolMetaDescription` and `getToolSeo` call the new per-file structure
- Actually, since meta descriptions are needed synchronously for SSR/PageMeta, keep a lightweight `src/lib/seo/meta-descriptions.ts` map (just the short strings, ~5KB) and lazy-load the full FAQ/howToUse content
- Update `src/lib/__tests__/seo-content.test.ts` to validate the new file structure

**Technical details:**
- `useToolSeo(toolId)` returns `{ seoContent: ReactNode | null, metaDescription: string | undefined, loading: boolean }`
- Uses `useEffect` + dynamic `import()` to load `src/lib/seo/${toolId}.tsx` on demand
- Tool pages switch from `getToolSeo("csv-to-parquet")` to `const { seoContent, metaDescription } = useToolSeo("csv-to-parquet")`

---

### 2. Auto-Convert on File Upload

**What changes:** Most file-based converters already auto-convert (CsvToParquet, CsvToJson, JsonToCsv, JsonToParquet, ParquetToCsv, ParquetToJson, CsvToSql all have the `useEffect(() => { if (meta && file && !result) handleConvert(); }, [meta])` pattern). The remaining ones that need it:

- **ExcelToCsv** -- already auto-converts (generates CSV output in `handleFile`)
- **CsvToExcel** -- does NOT auto-convert; needs the pattern added

**Also needed:** After auto-conversion completes, collapse the input preview (`setShowInputPreview(false)`) and expand the output preview (`setShowOutputPreview(true)`) across all converters.

**Files to update:**
- `src/pages/CsvToExcelPage.tsx` -- add auto-download-ready state after file load
- All 8 file-based converter pages: after successful conversion, set `showInputPreview(false)` and `showOutputPreview(true)`

---

### 3. Rebrand "Data Tools" to "Developer Tools"

**What changes:** Update copy across the site to reflect the broader scope (76 tools including QR codes, JWT decoder, etc.).

**Files to update:**
- `src/pages/Index.tsx`:
  - Hero heading: "Data tools that run in your browser" -> "Developer tools that run in your browser"
  - Hero description: mention broader scope beyond datasets
  - Swap CTAs: "Browse All Tools" becomes primary (filled), "SQL Playground" becomes secondary (outline)
  - Update `jsonLd.description` and `PageMeta` description to say "developer tools"
- `src/pages/About.tsx`:
  - Update description text from "data tools" to "developer tools"
  - Update `orgJsonLd.description`
  - Update "SheetJS" reference to "@e965/xlsx" in tech stack
- `index.html` -- update any fallback meta descriptions if present

---

### 4. Loading Overlay Instead of Bottom Spinner

**What changes:** The `LoadingState` component in `src/components/shared/FileInfo.tsx` already renders as an absolute-positioned overlay with backdrop blur. It is already correct -- it uses `absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px]`.

**Verification needed:** Ensure all tool pages that use `loading` state wrap their content in a `relative` container. Looking at the code, most pages use `<div className="relative space-y-4">` which is correct.

This item is already implemented. No changes needed.

---

### 5. Confirm Before Resetting with Unsaved Output

**What changes:** The existing `ConfirmNewDialog` component always shows a dialog. Update it so it conditionally shows the dialog only when there's output/results, and resets immediately otherwise.

**Files to update:**
- `src/components/shared/ConfirmNewDialog.tsx` -- add `hasOutput` prop; when false, call `onConfirm` directly without dialog
- Update all converter pages to use `ConfirmNewDialog` instead of plain `<Button>` for the "New file" action, passing `hasOutput={!!conversionResult}` or equivalent
- Pages: CsvToParquet, CsvToJson, JsonToCsv, JsonToParquet, ParquetToCsv, ParquetToJson, ExcelToCsv, CsvToExcel, CsvToSql

---

### 6. Align Paste-Based Converter Styling

**What changes:** The paste-based converters (YamlToJson, JsonToYaml, XmlToJson, JsonToXml, TomlToJson, JsonToToml, JsonToTypescript, SvgToPng, ImageToBase64) need:

1. Download/Save buttons upgraded from `variant="ghost"` to `variant="default"` (filled)
2. Add "OUTPUT" section label in uppercase tracking-widest style (already present as labels like "JSON Output" / "YAML Output" -- these are consistent)
3. Verify CrossToolLinks is at the bottom (already present in most)
4. Verify ErrorAlert is used (already present in all)

**Files to update (download button variant change):**
- `src/pages/YamlToJsonPage.tsx`
- `src/pages/JsonToYamlPage.tsx`
- `src/pages/XmlToJsonPage.tsx`
- `src/pages/JsonToXmlPage.tsx`
- `src/pages/TomlToJsonPage.tsx`
- `src/pages/JsonToTomlPage.tsx`
- `src/pages/JsonToTypescriptPage.tsx`

SvgToPng and ImageToBase64 are file-based, not paste-based -- verify their download buttons separately.

---

### 7. Check xlsx Bundle Size

**What changes:** The `@e965/xlsx` package is already dynamically imported (`await import("@e965/xlsx")`) in all 5 usage locations, meaning it is code-split and NOT included in the initial bundle. The library only loads when the user navigates to an Excel-related tool.

The SqlPage uses named imports (`const { read, utils } = await import("@e965/xlsx")`) which is optimal. The other 4 files import the full module but since it's dynamic, tree-shaking at the chunk level still applies.

**Recommendation:** No action needed. The dynamic import already isolates the xlsx chunk. Switching to named imports in the other 4 files won't reduce the chunk size since they use `XLSX.read`, `XLSX.utils.*` which are the same exports. The 20KB increase only affects users who actually use Excel tools.

---

### Summary of Work

| Item | Files Changed | Scope |
|------|--------------|-------|
| 1. SEO code-split | ~70 new files + hook + test update | Large |
| 2. Auto-convert on upload | ~9 converter pages | Medium |
| 3. Rebrand to "developer tools" | Index, About, index.html | Small |
| 4. Loading overlay | Already done | None |
| 5. Confirm before reset | ConfirmNewDialog + ~9 pages | Medium |
| 6. Paste converter styling | ~7 pages | Small |
| 7. xlsx bundle check | No changes needed | None |

