

## Add Sample Data to Base64 and Hash Generator Tools

Two of the new tools -- Base64 Encoder/Decoder and Hash Generator -- are missing "Load Sample" buttons. All other new tools already have them.

### Changes

**1. `src/pages/Base64Page.tsx`**
- Add a sample text string (e.g., a short multi-line snippet like a JSON config or a famous quote)
- Add a "Load Sample" button in the toolbar that populates the input textarea with the sample text

**2. `src/pages/HashGeneratorPage.tsx`**
- Add a sample text string (e.g., "The quick brown fox jumps over the lazy dog" -- a classic hash test vector)
- Add a "Load Sample" button in the toolbar that populates the input textarea with the sample text

### Technical Detail

Both pages follow the same pattern already used in YAML/TOML/XML converter pages:

```typescript
// Define sample constant
const sampleText = `Hello, World!\nThis is sample text for hashing.`;

// Add button in toolbar
<Button variant="outline" size="sm" onClick={() => setInput(sampleText)}>
  Load Sample
</Button>
```

No new dependencies or files needed -- just two small additions to existing pages.
