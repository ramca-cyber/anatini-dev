

# Anatini.dev — Revised Roadmap (Lovable-Compatible)

This is a curated version of the enhancements document, filtered to what we can actually build in our Vite + React SPA environment, with my recommendations and removals noted.

---

## Phase 1: Fixes (Do First)

### 1.1 Date/Timestamp Display
Dates show as epoch integers (e.g., `1535760000000` instead of `2021-09-01`). Update `DataTable` to accept and use the `types[]` array from DuckDB. Detect `DATE`, `TIMESTAMP`, `TIMESTAMP_S`, `TIMESTAMP_MS`, `TIMESTAMP_NS` types and format accordingly in `formatValue()`.

### 1.2 Failing Tests
Update stale count assertions in `routes.test.tsx`. Will be made dynamic once the tool registry (1.3) exists.

### 1.3 Tool Registry (Single Source of Truth)
Create `src/lib/tool-registry.ts` with the full tool list. Refactor Navbar, CommandPalette, Footer, and Index to import from it. This eliminates the 4-file duplication problem and makes adding new tools a one-line change.

### 1.4 Remove Space Mono Font
`Space Mono` is declared in `tailwind.config.ts` and `index.css` `--font-mono` but the actual CSS override on line 146-148 already forces JetBrains Mono. Fix: remove `Space Mono` from the Google Fonts import URL, update `--font-mono` CSS variable and `tailwind.config.ts` `fontFamily.mono` to use JetBrains Mono as primary.

### 1.5 Split seo-content.tsx
The 494-line file is loaded by every page. Split into `src/lib/seo/<tool-slug>.ts` files with a dynamic `import()` loader. Each page only downloads its own SEO data.

---

## Phase 2: UI/UX Improvements

### 2.1 Apply UI Philosophy to All Converters
CsvToParquetPage is the reference implementation. Apply the same layout to the remaining 13 converter pages:
- Options + convert button on one row
- Output section promoted above input preview
- Input preview collapsible after conversion
- Full-width download button
- Auto-convert on file load (useEffect triggers conversion when meta is set)

Pages: CsvToJson, JsonToCsv, JsonToParquet, ParquetToCsv, ParquetToJson, ExcelToCsv, CsvToExcel, CsvToSql, YamlToJson, JsonToYaml, XmlToJson, JsonToXml, TomlToJson, JsonToToml.

### 2.2 Auto-Convert on File Load
Already implemented on CsvToParquetPage (line 93-97: useEffect on `meta`). Replicate this pattern to all converters.

### 2.3 CrossToolLinks as Quiet Text
Already done -- the current `CrossToolLinks.tsx` renders as a single `<p>` with dot-separated links. The document says "NOT FIXED" but the code shows it IS the quiet text format. No change needed; will mark as done.

### 2.4 Loading Overlay
Replace the appended `<LoadingState>` with an absolute-positioned overlay that dims the content area. Simple CSS change using `absolute inset-0 bg-background/80` with centered spinner.

### 2.5 "New File" Confirmation
Add an `AlertDialog` confirmation when clicking "New file" if unconverted/undownloaded output exists. Uses the existing Radix AlertDialog component.

### 2.6 Navbar Redesign
Replace the single-column dropdown with a mega-menu using CSS grid (5 columns matching the 5 categories). Shows all tools at a glance without scrolling. Falls back to the existing mobile accordion on small screens.

### 2.7 Footer Condensed
Show only top 4-5 tools per category. Add a "View all tools" link pointing to `/#tools`.

---

## Phase 3: New Tools (Client-Side Feasible)

All of these are achievable with browser APIs and zero-dependency or lightweight libraries.

### Tier 1 -- High Priority
| Tool | Approach |
|------|----------|
| QR Code Generator | `qrcode` npm package, canvas-based rendering |
| Image Compressor | Native Canvas API, output JPEG/PNG/WebP with quality slider |
| Password Generator | `crypto.getRandomValues()`, passphrase via word list |
| Regex Tester | Custom parser with match highlighting, capture group display |
| Color Picker/Converter | Hex/RGB/HSL conversion math, WCAG contrast checker |
| Text Diff | `diff` npm package, side-by-side rendering |
| UUID Generator | `crypto.randomUUID()` for v4, manual implementation for v7 |
| Timestamp/Epoch Converter | Pure JS Date math, bidirectional |
| JWT Decoder | `atob()` on base64url segments, no verification needed client-side |

### Tier 2 -- Medium Priority
| Tool | Approach |
|------|----------|
| Cron Generator (upgrade) | Visual toggles that build the expression, extend existing page |
| SVG to PNG | Canvas `drawImage()` from SVG blob URL |
| Favicon Generator | Canvas resize to 16/32/48/180/512, zip download |
| CSS Formatter | `prettier` standalone or lightweight CSS parser |
| JS Formatter | `prettier` standalone build |
| Image to Base64 | FileReader + `readAsDataURL()` |
| Markdown Editor | `marked` or `markdown-it` for preview rendering |

### Tier 3 -- Niche
| Tool | Approach |
|------|----------|
| Meta Tag Generator | Form inputs, template string output |
| robots.txt Generator | Form with AI crawler toggles |
| Chmod Calculator | Bitwise operations, checkbox UI |
| JSON to TypeScript | Recursive type inference from JSON structure |
| Lorem Ipsum Generator | Word list, paragraph/sentence/word modes |
| HTML Entity Encoder | Simple char code mapping |
| Slug Generator | Regex normalization |
| Word/Character Counter | String split operations |
| .gitignore Generator | Predefined templates per language/framework |
| Sitemap Generator | Form input, XML template output |

### Removed from Plan
| Tool | Reason |
|------|--------|
| HTML Formatter/Viewer | Requires a full HTML parser + safe sandboxed preview (iframe security concerns). Defer. |
| OG Image Generator | Requires server-side image generation or complex Canvas text rendering with font loading. Low ROI for complexity. |
| Screenshot Mockup Tool | Complex Canvas compositing with device frames. Out of scope. |
| Code to Image | Requires syntax highlighting + Canvas rendering with font metrics. High complexity. Defer. |
| AI Prompt Formatter | Vague scope, no clear client-side implementation. |
| Tailwind CSS Lookup | Would need to bundle the entire Tailwind class list. Large bundle for niche use. |
| Web Manifest Generator | Trivial but extremely low volume (5K/mo). Skip. |
| Env Variable Template | Too niche, low value. |

---

## Phase 4: Enhancements to Existing Tools

### 4.1 JSON Formatter -- Tree View
Add a collapsible tree view tab alongside the existing formatted output. Each node shows key, type badge, and value. Click to copy JSON path.

### 4.2 Cron Parser -- Upgrade to Generator
Add visual builder toggles above the input field. Selecting toggles populates the cron expression. Show next 5 run times.

### 4.3 Hash Generator -- Add MD5/SHA-1
Web Crypto doesn't support MD5. Add `spark-md5` (tiny library) for MD5. SHA-1 is supported by Web Crypto natively. Add both to the algorithm selector.

### 4.4 Data Profiler -- Quality Score + Export
Calculate a composite quality score (completeness, uniqueness, consistency). Add "Export Report" button that generates an HTML report and downloads it.

---

## Phase 5: Infrastructure

### Can Do Now
- **Analytics**: Add Cloudflare Web Analytics (free, no cookies, one script tag in `index.html`)
- **AdSense**: Add the AdSense script to `index.html` when ready (after traffic threshold). Place ad slots in SEO content sections below tools.
- **Sitemap auto-generation**: Build-time script that reads the tool registry and writes `public/sitemap.xml`. Add to Vite build pipeline.
- **robots.txt AI rules**: Add explicit `User-agent: GPTBot / ClaudeBot / CCBot` allow rules (already allowing by default, but explicit rules signal intent)

### Cannot Do (Lovable Limitation)
- **Astro migration**: Not possible -- Lovable only supports Vite + React SPA. Removed from plan.
- **Blog pre-rendering / SSR**: Same limitation. The `<noscript>` block we already added is the best available mitigation.

---

## Phase 6: SEO & Content

### Blog Posts (write as new tools launch)
- "Why Your Online JSON Formatter Might Be Leaking Your Data"
- "How to Decode JWT Tokens Without Sending Them to a Server"
- "Client-Side vs Server-Side: Why Your Developer Tools Should Run Locally"

### Comparison Pages
- `/privacy` -- Detailed client-side architecture explanation
- `/vs/jsonformatter` and `/vs/jwt-io` -- Privacy comparison landing pages

### FAQ Schema
Every new tool page gets `SeoFaq` with 3-5 questions. This is already the pattern; just enforce it.

---

## Implementation Order

1. **Phase 1** (Fixes) -- all 5 items, one prompt each
2. **Phase 2** (UI/UX) -- navbar + footer first, then batch converter updates
3. **Phase 4** (Enhancements) -- JSON tree view and Cron generator are highest value
4. **Phase 3** (New Tools) -- start with Tier 1, one tool per prompt
5. **Phase 5 + 6** (Infrastructure + SEO) -- analytics first, then content

This will be saved as `.lovable/roadmap.md` for ongoing reference.

