

## Fix: Move YAML ↔ JSON to Converters Category

### The Issue

YAML ↔ JSON (`/yaml-json`) is a bidirectional format converter currently miscategorized under "Analysis & SQL" in all three navigation locations. It should be under "Converters."

No tools have been incorrectly combined — all converter pairs (CSV/Parquet, CSV/JSON, JSON/Parquet, Excel/CSV) are properly split into separate bidirectional tools.

### Changes

Three files need the same update — move the YAML ↔ JSON entry from "Analysis & SQL" to "Converters":

1. **`src/pages/Index.tsx`** — Move the `yaml-json` entry from the `analysis` array to the `converters` array
2. **`src/components/layout/Navbar.tsx`** — Move it from the "Analysis & SQL" group to "Converters" in `toolGroups`
3. **`src/components/layout/Footer.tsx`** — Move it from the "Analysis & SQL" section to "Converters" in `toolGrid`

Also update the homepage hero badge from "28 Tools" to "28+ Tools" if it isn't already accurate after this recategorization (tool count stays the same, just moving between categories).

### Result

- Converters: 9 tools (was 8)
- Analysis & SQL: 15 tools (was 16)
- Viewers and Inspectors: unchanged
