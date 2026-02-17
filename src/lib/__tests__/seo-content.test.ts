import { describe, it, expect } from "vitest";
import { getToolMetaDescription } from "@/lib/seo-content";
import { metaDescriptions } from "@/lib/seo/meta-descriptions";
import { allToolIds } from "@/lib/tool-registry";

describe("SEO content coverage", () => {
  it.each(allToolIds)("tool '%s' has a meta description", (toolId) => {
    const desc = getToolMetaDescription(toolId);
    expect(desc).toBeDefined();
    expect(desc!.length).toBeGreaterThan(20);
    expect(desc!.length).toBeLessThanOrEqual(160);
  });

  it("returns undefined for unknown tool IDs", () => {
    expect(getToolMetaDescription("nonexistent-tool")).toBeUndefined();
  });

  it("meta-descriptions map covers all tool IDs", () => {
    for (const id of allToolIds) {
      expect(metaDescriptions).toHaveProperty(id);
    }
  });

  it("each tool has a matching seo file", async () => {
    for (const id of allToolIds) {
      try {
        const mod = await import(`@/lib/seo/${id}.ts`);
        expect(mod.default).toBeDefined();
        expect(mod.default.whatIs).toBeDefined();
        expect(mod.default.howToUse).toBeDefined();
        expect(mod.default.faqs).toBeDefined();
        expect(Array.isArray(mod.default.faqs)).toBe(true);
      } catch {
        throw new Error(`Missing or invalid SEO file for tool: ${id}`);
      }
    }
  });
});
