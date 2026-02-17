import { describe, it, expect } from "vitest";
import { getToolMetaDescription } from "@/lib/seo-content";
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
});
