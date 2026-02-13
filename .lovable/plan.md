
## Fix: JSON Schema Validator - Add `ajv-formats` Support

### Problem
The JSON Schema Validator shows `unknown format "email" ignored in schema` because the `ajv` library does not include format validation (e.g., "email", "uri", "date") by default. The `ajv-formats` package is required.

### Solution

**1. Install `ajv-formats` dependency**
Add `ajv-formats` to `package.json`.

**2. Update `src/pages/JsonSchemaValidatorPage.tsx`**
- Import `addFormats` from `ajv-formats`
- Apply it to the Ajv instance: `addFormats(ajv)`
- This enables validation of all standard JSON Schema string formats: email, uri, date, date-time, time, ipv4, ipv6, uuid, etc.

### Changes

| File | Change |
|---|---|
| `package.json` | Add `ajv-formats` dependency |
| `src/pages/JsonSchemaValidatorPage.tsx` | Import and apply `addFormats(ajv)` (2 lines changed) |

### Technical Detail

```
// Before
import Ajv from "ajv";
const ajv = new Ajv({ allErrors: true, verbose: true });

// After
import Ajv from "ajv";
import addFormats from "ajv-formats";
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);
```
