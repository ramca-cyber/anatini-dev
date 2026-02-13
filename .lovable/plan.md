

## Enhancements: Sitemap, SEO & Cross-Tool Links Cleanup

After reviewing the full codebase, the tools and pages are well-built. Here are the concrete gaps worth fixing:

---

### 1. Sitemap is stale after YAML split

The sitemap (`public/sitemap.xml`) still lists `/yaml-json` instead of the two new routes `/yaml-to-json` and `/json-to-yaml`. Search engines will crawl a redirect instead of the real pages.

**Fix:** Replace the single `/yaml-json` entry with two entries for `/yaml-to-json` and `/json-to-yaml`.

---

### 2. Homepage JSON-LD featureList is outdated

The `jsonLd` object in `src/pages/Index.tsx` still says `"YAML/JSON Converter"` (singular). It should list the two separate tools.

**Fix:** Update the `featureList` string to include `"YAML to JSON, JSON to YAML"` instead of `"YAML/JSON Converter"`.

---

### 3. YAML converters missing CrossToolLinks

Every other converter has a `<CrossToolLinks>` component that lets users continue to related tools. The new YAML pages have no cross-linking at all.

**Fix:** Add a `yaml` format entry to `CrossToolLinks.tsx` with links like "Convert to JSON" and "Convert to YAML". Then render `<CrossToolLinks>` in both YAML pages.

---

### 4. YAML converters: auto-convert on input change

Other text-based tools (JSON Formatter, SQL Formatter) convert automatically as the user types or pastes. The YAML tools require clicking a "Convert" button, which is an extra step.

**Fix:** Add a `useEffect` that calls `convert()` whenever `input` or `indent` changes (debounced or immediate since `js-yaml` is fast). Remove the explicit "Convert" button or keep it as a fallback.

---

### Summary of files changed

| File | Change |
|------|--------|
| `public/sitemap.xml` | Replace `/yaml-json` with `/yaml-to-json` and `/json-to-yaml` |
| `src/pages/Index.tsx` | Update `featureList` in JSON-LD |
| `src/components/shared/CrossToolLinks.tsx` | Add `yaml` format with relevant links |
| `src/pages/YamlToJsonPage.tsx` | Add CrossToolLinks, auto-convert on input change |
| `src/pages/JsonToYamlPage.tsx` | Add CrossToolLinks, auto-convert on input change |

