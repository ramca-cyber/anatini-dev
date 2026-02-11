
# Auto-Convert on File Load

## What Changes

All 7 converter pages will automatically trigger conversion immediately after a file is successfully loaded. Downloads remain user-initiated (no change there). The convert button stays visible but always shows "Re-convert" after auto-conversion completes.

## Approach

In each converter page's `handleFile` function, after the file is registered and preview is loaded, call `handleConvert()` automatically. To avoid issues with stale state (since `handleConvert` reads from state like `file`, `meta`, `delimiter`), the conversion will be triggered via a `useEffect` that watches for a successful file load.

### Pattern

Add a simple `useEffect` to each page:

```text
useEffect(() => {
  if (meta && file && !conversionResult) {
    handleConvert();
  }
}, [meta]);
```

This fires once after `handleFile` completes and sets `meta`, triggering conversion automatically. Since `conversionResult` is cleared in `handleFile`, it won't re-trigger on subsequent renders.

## Files Modified

1. `src/pages/CsvToJsonPage.tsx` -- add auto-convert useEffect
2. `src/pages/JsonToCsvPage.tsx` -- add auto-convert useEffect
3. `src/pages/CsvToParquetPage.tsx` -- add auto-convert useEffect
4. `src/pages/ParquetToCsvPage.tsx` -- add auto-convert useEffect
5. `src/pages/JsonToParquetPage.tsx` -- add auto-convert useEffect
6. `src/pages/ParquetToJsonPage.tsx` -- add auto-convert useEffect
7. `src/pages/CsvToSqlPage.tsx` -- add auto-convert useEffect

Each change is ~4 lines added. No other modifications needed -- the convert button already shows "Re-convert" when output exists, and downloads are already user-initiated via explicit button clicks.

## What Stays the Same

- Download buttons remain manual (user must click)
- Copy-to-clipboard remains manual
- Re-convert button stays visible for when users change options
- All conversion stats and output sections appear as before
