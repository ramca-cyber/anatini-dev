# Anatini.dev — Roadmap

> Privacy-first developer utility suite. 100+ tools, all client-side.

## Status Key
- ✅ Done | 🔧 In Progress | ⬚ Todo

---

## Phase 1: Fixes

| # | Item | Status |
|---|------|--------|
| 1.1 | Date/Timestamp display in DataTable | ✅ |
| 1.2 | Failing tests (dynamic counts via registry) | ✅ |
| 1.3 | Tool registry — single source of truth | ✅ |
| 1.4 | Remove Space Mono font remnants | ✅ |
| 1.5 | SEO content — added 4 missing entries, full coverage | ✅ |

## Phase 2: UI/UX

| # | Item | Status |
|---|------|--------|
| 2.1 | Apply converter UI philosophy to all 14 pages | ✅ (already compliant) |
| 2.2 | Auto-convert on file load (all converters) | ✅ (already compliant) |
| 2.3 | CrossToolLinks as quiet text | ✅ |
| 2.4 | Loading overlay (absolute positioned) | ✅ (already compliant) |
| 2.5 | "New file" confirmation dialog | ✅ |
| 2.6 | Navbar mega-menu redesign | ✅ |
| 2.7 | Footer condensed (top 5 per category) | ✅ |

## Phase 3: New Tools

### Tier 1 — High Priority
| Tool | Approach | Status |
|------|----------|--------|
| QR Code Generator | `qrcode` npm, canvas | ✅ |
| Image Compressor | Canvas API, quality slider | ✅ |
| Password Generator | `crypto.getRandomValues()` | ✅ |
| Regex Tester | Match highlighting, capture groups | ✅ |
| Color Picker/Converter | Hex/RGB/HSL, WCAG contrast | ✅ |
| Text Diff | LCS diff, side-by-side | ✅ |
| UUID Generator | `crypto.randomUUID()` v4/v7 | ✅ |
| Timestamp/Epoch Converter | JS Date, bidirectional | ✅ |
| JWT Decoder | `atob()` base64url decode | ✅ |

### Tier 2 — Medium Priority
| Tool | Approach | Status |
|------|----------|--------|
| Cron Generator (upgrade) | Visual toggles, extend existing | ✅ |
| SVG to PNG | Canvas `drawImage()` | ✅ |
| Favicon Generator | Canvas resize, individual downloads | ✅ |
| CSS Formatter | Lightweight CSS parser | ✅ |
| JS Formatter | Brace-aware formatter | ✅ |
| Image to Base64 | FileReader `readAsDataURL()` | ✅ |
| Markdown Editor | `marked` library | ✅ |

### Tier 3 — Niche
| Tool | Status |
|------|--------|
| Meta Tag Generator | ✅ |
| robots.txt Generator | ✅ |
| Chmod Calculator | ✅ |
| JSON to TypeScript | ✅ |
| Lorem Ipsum Generator | ✅ |
| HTML Entity Encoder | ✅ |
| Slug Generator | ✅ |
| Word/Character Counter | ✅ |
| .gitignore Generator | ✅ |
| Sitemap Generator | ✅ |

## Phase 4: Enhancements

| # | Item | Status |
|---|------|--------|
| 4.1 | JSON Formatter — tree view + copy path | ✅ |
| 4.2 | Cron Parser — upgrade to visual generator | ✅ |
| 4.3 | Hash Generator — add MD5 + SHA-1 | ✅ |
| 4.4 | Data Profiler — quality score + export | ✅ |

## Phase 5: SEO & Content

| Item | Status |
|------|--------|
| Blog: "Why Your JSON Formatter Might Leak Data" | ⬚ |
| Blog: "Decode JWT Without a Server" | ⬚ |
| Blog: "Client-Side vs Server-Side Tools" | ⬚ |
| /privacy page | ⬚ |
| /vs/* comparison pages | ⬚ |
| FAQ schema on all new tools | ⬚ |

---

## Implementation Order

1. Phase 1 (Fixes) → 2. Phase 2 (UI/UX) → 3. Phase 4 (Enhancements) → 4. Phase 3 (New Tools, Tier 1 first) → 5. Phase 5 (SEO)

## Removed (Not Feasible)
- Astro migration (Lovable = Vite SPA only)
- Blog pre-rendering / SSR
- HTML Formatter (iframe security)
- OG Image Generator (needs server)
- Code to Image (high complexity)
- AI Prompt Formatter (vague scope)
- Tailwind CSS Lookup (large bundle)
- Web Manifest / Env Template (too niche)
