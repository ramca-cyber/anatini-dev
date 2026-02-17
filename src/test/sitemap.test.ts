import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { allToolPaths } from "@/lib/tool-registry";

describe("Sitemap", () => {
  const sitemapContent = readFileSync(resolve(__dirname, "../../public/sitemap.xml"), "utf-8");

  it.each(allToolPaths)("sitemap contains route '%s'", (route) => {
    expect(sitemapContent).toContain(`https://anatini.dev${route}`);
  });

  it("does not contain stale /yaml-json route", () => {
    expect(sitemapContent).not.toContain("anatini.dev/yaml-json");
  });

  it("contains the homepage", () => {
    expect(sitemapContent).toContain("https://anatini.dev/");
  });

  it("contains the blog index", () => {
    expect(sitemapContent).toContain("https://anatini.dev/blog");
  });
});
