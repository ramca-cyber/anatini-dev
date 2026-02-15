

# Fix "Page with redirect" Google Search Console Issue

## Problem
Google is flagging 8 legacy redirect URLs because they use client-side JavaScript redirects (`<Navigate>`) instead of HTTP 301 redirects. Google crawls the page, gets an HTML shell, then JavaScript redirects it -- which Google treats as a soft redirect and refuses to index.

## Solution
Two changes are needed:

### 1. Remove redirect URLs from any internal links
Search the entire codebase for any `<a>` or `<Link>` references to the old URLs (`/convert`, `/flatten`, `/sql`, `/profiler`, `/schema`, `/diff`, `/yaml-json`, `/excel-csv-converter`). If any exist, update them to point to the canonical destination directly. This prevents Google from rediscovering these URLs.

### 2. Add server-side redirect rules
Since this is a Vite SPA deployed on Lovable, we need to add a `public/_redirects` file (supported by most static hosting platforms including Netlify-style hosting) to handle 301 redirects at the server level before JavaScript loads:

```
/excel-csv-converter  /excel-to-csv  301
/yaml-json            /yaml-to-json  301
/diff                 /dataset-diff  301
/convert              /csv-to-parquet  301
/flatten              /json-flattener  301
/sql                  /sql-playground  301
/profiler             /data-profiler  301
/schema               /schema-generator  301
```

The client-side `<Navigate>` routes in `App.tsx` should remain as a fallback for users with JavaScript enabled, but the `_redirects` file ensures Google gets a proper 301 before any HTML is served.

## Technical Details

### Files to create
- `public/_redirects` -- server-side 301 redirect rules

### Files to check/modify
- Search all `.tsx` files for links to old redirect paths and update them to canonical paths
- `src/App.tsx` -- keep existing `<Navigate>` routes as fallback (no change needed)

### Why this works
- Google's crawler will receive an HTTP 301 response, which it understands natively
- Google will transfer link equity from old URLs to new ones
- The "Page with redirect" warning will resolve after Google re-crawls
- Client-side redirects remain as a safety net for direct browser navigation

