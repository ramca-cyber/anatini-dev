

## Responsive Layout Fixes

### Audit Results

Tested across 4 viewports: 320px (iPhone SE), 390px (iPhone 14), 768px (iPad), and 1920px (desktop).

**Everything looks good except one issue:**

### Issue: SQL Playground sidebar open by default on mobile

On mobile, the sidebar (file drop zone, URL input, loaded tables) is visible by default, pushing the SQL editor far down the page. Users have to scroll past the entire sidebar before they can see or use the editor.

**Fix:** Default `sidebarOpen` to `false` on mobile devices. The toggle button already exists -- users can expand it when needed.

### What already works well
- Homepage hero and tool grid adapt properly to all sizes
- Mobile hamburger menu opens/closes correctly
- Blog, About, and tool pages all render cleanly
- Footer 2-column grid works well on mobile
- Navbar collapses to hamburger on mobile
- "100% Offline" badge hides on small screens as intended

---

### Technical Details

**File:** `src/pages/SqlPage.tsx`

Change `useState(true)` to use `isMobile` to determine the default:

```typescript
// Before
const isMobile = useIsMobile();
const [sidebarOpen, setSidebarOpen] = useState(true);

// After  
const isMobile = useIsMobile();
const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
```

However, since `useIsMobile()` returns `false` on first render (before the effect runs), we also need a `useEffect` to close the sidebar when the initial mobile detection resolves:

```typescript
const isMobile = useIsMobile();
const [sidebarOpen, setSidebarOpen] = useState(true);

// Close sidebar by default on mobile
useEffect(() => {
  if (isMobile) setSidebarOpen(false);
}, []); // only on mount
```

This is a single-line fix in one file.
