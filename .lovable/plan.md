

# Refactor CsvToJsonPage to Use Shared registerFile Helper

## What and Why

The only remaining actionable item from the code review is **BUG 5**: `CsvToJsonPage.tsx` still manually calls `db.registerFileHandle` + `conn.query` instead of using the shared `registerFile` helper from `duckdb-helpers.ts`. This creates a maintenance burden and means CSV parsing options (delimiter, header) bypass the centralized helper.

All other review items have been implemented or were intentionally deferred as future features.

## Changes

### 1. Extend `registerFile` in `duckdb-helpers.ts`

Add an optional `csvOptions` parameter to support custom delimiter and header settings:

```text
interface CsvParseOptions {
  delimiter?: string;
  header?: boolean;
}

export async function registerFile(
  db: duckdb.AsyncDuckDB,
  file: File,
  tableName: string,
  csvOptions?: CsvParseOptions
): Promise<{ columns: string[]; rowCount: number; types: string[] }>
```

When `csvOptions` is provided and the file is CSV/TSV, append `delim` and `header` options to the `read_csv_auto` call.

### 2. Refactor `CsvToJsonPage.tsx`

Replace the manual `registerFileHandle` + `conn.query` block (lines 61-87) with a single call to the extended `registerFile` helper, passing the delimiter and header options.

### Files Modified

- `src/lib/duckdb-helpers.ts` — add optional `csvOptions` parameter to `registerFile`
- `src/pages/CsvToJsonPage.tsx` — replace manual DuckDB calls with `registerFile(db, f, tableName, { delimiter, header: hasHeader })`

