

# Fix Duplicate Cross-Tool Links on Dataset Diff Page

## Problem
The Diff page renders two identical "Continue:" cross-link rows at the bottom -- one for the "before" file and one for the "after" file. Since both files are typically the same format (e.g., both CSV), the links are redundant.

## Solution
Show only a single `CrossToolLinks` row. Use the "before" file's format by default. Remove the second conditional render entirely -- the after file's format will almost always match, and showing two identical link rows is never useful.

## Technical Change

**File: `src/pages/DiffPage.tsx` (lines 380-381)**

Replace:
```tsx
{beforeFile && <CrossToolLinks format={detectFormat(beforeFile.name)} fileId={beforeFileId ?? undefined} excludeRoute="/dataset-diff" />}
{afterFile && afterFile.name !== beforeFile?.name && <CrossToolLinks format={detectFormat(afterFile.name)} fileId={afterFileId ?? undefined} excludeRoute="/dataset-diff" />}
```

With:
```tsx
{beforeFile && <CrossToolLinks format={detectFormat(beforeFile.name)} fileId={beforeFileId ?? undefined} excludeRoute="/dataset-diff" />}
```

Single line change -- just remove line 381.

