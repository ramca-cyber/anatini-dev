

## Fix: YAML/JSON Converter Broken Page

### Problem
The `/yaml-json` page shows a blank screen due to a `SyntaxError: Unexpected token '{'` in the bundled `js-yaml` dependency chunk. All other 9 new tools load correctly.

This is a CommonJS/ESM interop issue -- `js-yaml` uses CommonJS exports, and Vite's dependency pre-bundling is producing an invalid chunk.

### Solution
Change the import style in `YamlJsonPage.tsx` to use a namespace import instead of a default import, which resolves the CJS/ESM interop issue:

**File: `src/pages/YamlJsonPage.tsx`**

Change line 9 from:
```typescript
import yaml from "js-yaml";
```
to:
```typescript
import * as yaml from "js-yaml";
```

This is a one-line fix. The `yaml.load()` and `yaml.dump()` calls remain the same since both are named exports on the `js-yaml` module.

### Verification
After the fix, navigate to `/yaml-json`, load a sample, and confirm the conversion works in both directions (YAML to JSON and JSON to YAML).

