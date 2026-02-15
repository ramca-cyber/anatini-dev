

# IndexDecode Scan Review -- Fixing AI Visibility Issues

## Scan Summary

| Area | Score | Status |
|------|-------|--------|
| Google Indexability | 92/100 | Excellent |
| AI Visibility | 59/100 | Needs Work |

## What's Already Good

- Google indexing: meta tags, canonical URLs, sitemap, robots.txt, clean URLs, language declaration all passing
- SoftwareApplication JSON-LD on every tool page
- FAQPage JSON-LD via SeoFaq component
- BreadcrumbList JSON-LD on every tool page
- Organization JSON-LD on About page

## Issues Flagged by Scanner (and Fixes)

### 1. No `llms.txt` or `llms-full.txt` (HIGH IMPACT on AI score)

The scanner flagged missing `llms.txt` and `llms-full.txt` files. These are a newer standard for guiding AI models about your site's content and purpose.

**Fix:** Create `public/llms.txt` with a concise site summary, tool list, and usage guidance for AI crawlers.

### 2. Only 8 words in server-rendered HTML (SPA limitation) (MEDIUM)

Since this is a Vite SPA, the server-rendered HTML in `index.html` contains almost no content. AI crawlers that don't execute JavaScript see very little. Google renders JS fine, but ChatGPT/Claude/Perplexity crawlers may not.

**Fix:** Add a `<noscript>` block in `index.html` with a text summary of the site and links to key tool pages. This gives non-JS crawlers meaningful content to index.

### 3. No internal links in server-rendered HTML (SPA limitation) (MEDIUM)

Related to issue 2 -- zero `<a>` tags in the static HTML means non-JS crawlers can't discover any pages.

**Fix:** The `<noscript>` block from issue 2 will include internal links to the main tool categories, solving both problems at once.

### 4. No structured data in server-rendered HTML (LOW)

JSON-LD is injected via React at runtime, so non-JS crawlers can't see it. Google handles this fine.

**Fix:** Add a static `WebSite` JSON-LD block directly in `index.html` `<head>` so it's visible without JS execution.

### 5. robots.txt has no AI crawler rules (INFO)

The scanner notes all AI crawlers are allowed by default (no explicit rules). This is fine if you want maximum AI visibility ("Open Door" strategy), which seems intentional. No changes needed unless you want to block training bots.

---

## Technical Changes

### File 1: `public/llms.txt` (NEW)

Create a structured text file following the llms.txt convention with:
- Site name, URL, and purpose
- Brief description of all 50 tools organized by category
- Note that all tools are free, offline, and browser-based
- Link to sitemap for full URL list

### File 2: `index.html` (EDIT)

1. Add a static `WebSite` JSON-LD block inside `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Anatini.dev",
  "url": "https://anatini.dev",
  "description": "50 free, offline data tools..."
}
```

2. Add a `<noscript>` block inside `<body>` with:
   - Site heading and description paragraph
   - Links to all major tool categories (converters, viewers, inspectors, utilities, formatters)
   - This provides content and internal links for non-JS crawlers

### Files NOT Changed

- `robots.txt` -- keeping the current "allow all" strategy (maximum AI visibility)
- `ToolPage.tsx`, `SeoFaq.tsx`, `PageMeta.tsx` -- already have proper BreadcrumbList, FAQPage, and SoftwareApplication JSON-LD (the scanner just can't see them without JS)

