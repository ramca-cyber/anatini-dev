

## Phase 1: XML Converters, CSV Splitter, Base64 Encoder/Decoder (4 tools)

### New Tools

**1. XML to JSON Converter** (`/xml-to-json`)
- Text-based converter (like YAML pages): paste or upload XML, auto-convert to JSON
- Uses a lightweight XML parser (browser's built-in DOMParser)
- Options: indent level, attribute handling (prefix with `@` or flatten)
- Side-by-side input/output layout

**2. JSON to XML Converter** (`/json-to-xml`)
- Reverse of above: paste or upload JSON, convert to XML
- Options: indent, root element name, array item element name
- Side-by-side layout

**3. CSV Splitter** (`/csv-splitter`)
- DuckDB-powered tool (uses DuckDBGate)
- Upload a CSV/Parquet/JSON file, split by:
  - Row count (e.g., every 1000 rows)
  - Column value (e.g., one file per unique `city`)
- Preview splits, download as individual files or as a ZIP (not feasible without a zip library, so individual downloads)
- Shows split summary: number of parts, rows per part

**4. Base64 Encoder/Decoder** (`/base64`)
- Text-based tool (no DuckDB needed)
- Two modes: Encode and Decode
- Paste text or upload a file (any type)
- For files: shows base64 output, copy/download
- For text: auto-convert as you type
- Side-by-side or stacked layout

### Changes to Existing Files

**Navigation & Homepage** (all 4 categories updated):
- `src/components/layout/Navbar.tsx` -- add new tools to appropriate groups
- `src/pages/Index.tsx` -- add tool cards, update hero badge count and featureList
- `src/components/layout/Footer.tsx` -- add to footer grid
- `public/sitemap.xml` -- add 4 new routes
- `src/lib/seo-content.tsx` -- add SEO data for 4 new tools
- `src/components/shared/CrossToolLinks.tsx` -- add `xml` format links
- `src/App.tsx` -- add lazy imports and routes

**Reorganized Navigation Categories:**
- Converters: existing 10 + XML to JSON, JSON to XML = 12
- Viewers & Formatters: unchanged (3)
- Inspectors: unchanged (3)
- Analysis & SQL: existing 15 + CSV Splitter = 16
- Utilities (new category): Base64 Encoder/Decoder

### New Files
- `src/pages/XmlToJsonPage.tsx`
- `src/pages/JsonToXmlPage.tsx`
- `src/pages/CsvSplitterPage.tsx`
- `src/pages/Base64Page.tsx`

---

## Phase 2: Data Anonymizer, Hash Generator, Data Generator (3 tools)

### New Tools

**5. Data Anonymizer** (`/data-anonymizer`)
- DuckDB-powered tool
- Upload CSV/JSON/Parquet, select columns to mask
- Masking strategies per column: fake name, fake email, hash, redact, shuffle, random number
- Uses deterministic hashing for consistency (same input = same fake output)
- Preview before/after, download anonymized file

**6. Hash Generator** (`/hash-generator`)
- Text-based tool (uses Web Crypto API, no dependencies)
- Input: text or file upload
- Algorithms: SHA-256, SHA-384, SHA-512, MD5 (via simple implementation or SubtleCrypto)
- Shows hash output, copy button
- For files: reads as ArrayBuffer, hashes bytes

**7. Data Generator** (`/data-generator`)
- No DuckDB needed (generates in JS)
- Configure columns: name, type (name, email, integer, float, date, UUID, boolean, city, company, phone)
- Set row count (10 to 10,000)
- Preview generated data in table
- Download as CSV or JSON
- Uses a built-in faker-like function set (no external dependency)

### Changes
- Same navigation/sitemap/SEO updates as Phase 1 pattern
- New category "Utilities" grows: Hash Generator joins Base64
- Data Anonymizer and Data Generator go in "Analysis & SQL"
- `src/components/shared/CrossToolLinks.tsx` -- anonymizer links for csv/json/parquet

### New Files
- `src/pages/DataAnonymizerPage.tsx`
- `src/pages/HashGeneratorPage.tsx`
- `src/pages/DataGeneratorPage.tsx`

---

## Phase 3: JSON Schema Validator, TOML Converters, Enhanced CSV Viewer (3 tools + 1 enhancement)

### New Tools

**8. JSON Schema Validator** (`/json-schema-validator`)
- Text-based tool
- Two input areas: JSON document + JSON Schema
- Validates document against schema
- Shows validation results: pass/fail with specific error paths
- Uses a lightweight JSON Schema validator (Ajv or a minimal built-in implementation)
- Sample schema + document for quick start

**9. TOML to JSON** (`/toml-to-json`)
- Text-based converter (like YAML pages)
- Uses a TOML parser library
- Auto-convert on input, side-by-side layout

**10. JSON to TOML** (`/json-to-toml`)
- Reverse converter
- Side-by-side layout

### Enhancement: CSV Viewer becomes Delimited Viewer

**Enhanced CSV Viewer** (same route `/csv-viewer`)
- Add delimiter auto-detection (comma, tab, semicolon, pipe, custom)
- Accept `.tsv`, `.dsv`, `.txt` extensions in DropZone
- Show detected delimiter in FileInfo bar
- Add manual delimiter override option
- Page title/description updated to mention TSV/DSV support
- SEO content updated to cover delimited files broadly

### Changes
- Navigation updates: TOML converters join "Converters" category
- JSON Schema Validator joins "Analysis & SQL" or new "Validators" sub-section within Utilities
- `src/components/shared/CrossToolLinks.tsx` -- add `toml` format
- All sitemap/SEO/nav updates

### New Files
- `src/pages/JsonSchemaValidatorPage.tsx`
- `src/pages/TomlToJsonPage.tsx`
- `src/pages/JsonToTomlPage.tsx`

### Modified Files
- `src/pages/CsvViewerPage.tsx` -- enhanced delimiter support

---

## Final Navigation Structure

After all 3 phases, the tool suite grows from 31 to 41 tools:

| Category | Tools |
|---|---|
| **Converters** (14) | CSV-Parquet, Parquet-CSV, CSV-JSON, JSON-CSV, JSON-Parquet, Parquet-JSON, Excel-CSV, CSV-Excel, YAML-JSON, JSON-YAML, XML-JSON, JSON-XML, TOML-JSON, JSON-TOML |
| **Viewers & Formatters** (3) | CSV/Delimited Viewer, Parquet Viewer, JSON Formatter |
| **Inspectors** (3) | CSV Inspector, JSON Inspector, Parquet Inspector |
| **Analysis & SQL** (17) | SQL Playground, Data Profiler, JSON Flattener, Schema Generator, CSV-SQL, Dataset Diff, Data Sampler, Deduplicator, SQL Formatter, Markdown Table, Column Editor, Data Merge, Pivot Table, Chart Builder, Regex Filter, CSV Splitter, Data Anonymizer |
| **Generators & Utilities** (4) | Base64 Encoder/Decoder, Hash Generator, Data Generator, JSON Schema Validator |

---

## Technical Details

**Dependencies to add:**
- Phase 3 only: a TOML parser (e.g., `smol-toml` -- lightweight, ~5KB)
- Phase 3 only: a JSON Schema validator (e.g., `ajv` or minimal built-in)
- No new dependencies for Phase 1 or Phase 2 (DOMParser is built-in, Web Crypto API is built-in)

**Patterns followed:**
- All pages use `ToolPage` wrapper with SEO content
- Text-based tools use side-by-side layout (like YAML pages)
- DuckDB-based tools use `DuckDBGate`, `DropZone`, `FileInfo`, `CrossToolLinks`
- All tools lazy-loaded via `React.lazy()`
- Auto-convert on input for text-based tools
- SEO entries in `seo-content.tsx` for every new tool
- Sample data/load sample buttons where appropriate

**Tool count references updated per phase:**
- Phase 1: 31 to 35
- Phase 2: 35 to 38
- Phase 3: 38 to 41

