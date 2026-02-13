

## Remaining Fixes and Enhancements

### Status: What's Done vs What's Left

All high and medium priority items from the audit have been completed. Three low-priority items remain, plus a significant SEO gap discovered in the sitemap.

---

### 1. Sitemap Missing 10 Tool Routes (HIGH - SEO Impact)

`public/sitemap.xml` is missing these pages, meaning search engines may not discover them:

- `/data-sampler`
- `/deduplicator`
- `/sql-formatter`
- `/markdown-table`
- `/column-editor`
- `/data-merge`
- `/pivot-table`
- `/chart-builder`
- `/yaml-json`
- `/regex-filter`

**Fix:** Add all 10 missing URLs to `sitemap.xml` with `lastmod` of today's date and `priority` of 0.8.

---

### 2. Fix Module-Level `tabCounter` in SQL Playground (LOW)

`SqlPage.tsx` line 46 has `let tabCounter = 1` at module scope. When the user navigates away and back, the counter keeps incrementing but the tabs reset, producing labels like "Query 5" on a fresh visit.

**Fix:** Use a `useRef` inside the component instead of a module-level variable, resetting naturally on unmount.

---

### 3. SQL Playground Mobile Layout (LOW)

On mobile, the 280px sidebar stacks above the editor, pushing it far down the page.

**Fix:** On screens below `lg`, collapse the sidebar into a toggleable panel or make it horizontally scrollable so the editor is immediately visible.

---

### 4. Mobile Menu Focus Trap (LOW)

When the mobile nav is open, keyboard users can tab through background content behind the menu.

**Fix:** Add focus trapping to the mobile menu overlay so Tab/Shift+Tab cycles only within the menu while it's open.

---

### Summary

| Item | Priority | Effort |
|------|----------|--------|
| Add 10 missing routes to sitemap.xml | High | 2 min |
| Fix module-level tabCounter | Low | 3 min |
| SQL Playground collapsible mobile sidebar | Low | 15 min |
| Mobile menu focus trap | Low | 10 min |

### Technical Details

**Sitemap additions** -- 10 new `<url>` entries in `public/sitemap.xml`.

**tabCounter fix** -- Replace the module-level `let tabCounter = 1` with a `useRef(1)` inside the `SqlPage` component. Update `createTab` to accept a counter ref.

**Mobile sidebar** -- Add a state toggle and a button (e.g., "Show Tables") visible only on `< lg` screens. Wrap the sidebar content in a collapsible section.

**Focus trap** -- When `mobileOpen` is true in `Navbar.tsx`, attach a keydown listener that wraps focus from the last focusable element back to the first (and vice versa for Shift+Tab).
