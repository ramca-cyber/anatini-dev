

## Cleanup: Dead File, Stale Tool Count, and Copy Fixes

After auditing the full codebase post-YAML split, here are the remaining gaps:

---

### 1. Delete dead file: `src/pages/YamlJsonPage.tsx`

The old combined YAML/JSON converter page still exists in the codebase. It is no longer imported or routed anywhere (replaced by `YamlToJsonPage.tsx` and `JsonToYamlPage.tsx`). It should be deleted to avoid confusion.

---

### 2. Fix inconsistent tool count references

The homepage hero badge says "30 Tools" but there are actually **31** tools (10 converters + 3 viewers + 3 inspectors + 15 analysis). Additionally:

- The "Free Forever" feature card says "All 28+ tools" -- should say "30+"
- The meta description says "28+ free, offline data tools" -- should say "30+"
- The NotFound page says "Browse 28+ free offline data tools" -- should say "30+"

| Location | Current | Fix |
|----------|---------|-----|
| Hero badge (Index.tsx line 110) | "30 Tools" | "31 Tools" |
| Feature card (Index.tsx line 57) | "All 28+ tools" | "All 30+ tools" |
| Meta description (Index.tsx line 95) | "28+ free" | "30+ free" |
| NotFound.tsx line 14 | "Browse 28+" | "Browse 30+" |

---

### Summary of changes

| File | Change |
|------|--------|
| `src/pages/YamlJsonPage.tsx` | Delete (dead code) |
| `src/pages/Index.tsx` | Update tool count from "28+" to "30+" and hero badge to "31 Tools" |
| `src/pages/NotFound.tsx` | Update "28+" to "30+" |

