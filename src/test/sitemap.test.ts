import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Sitemap", () => {
  const sitemapContent = readFileSync(resolve(__dirname, "../../public/sitemap.xml"), "utf-8");

  const allRoutes = [
    // Converters
    "/csv-to-parquet", "/parquet-to-csv", "/csv-to-json", "/json-to-csv",
    "/json-to-parquet", "/parquet-to-json", "/excel-to-csv", "/csv-to-excel",
    "/yaml-to-json", "/json-to-yaml", "/xml-to-json", "/json-to-xml",
    "/toml-to-json", "/json-to-toml",
    // Viewers & Formatters
    "/csv-viewer", "/parquet-viewer", "/excel-viewer", "/json-formatter",
    "/xml-formatter", "/yaml-formatter", "/log-viewer", "/hex-viewer",
    // Inspectors
    "/csv-inspector", "/json-inspector", "/parquet-inspector",
    // Analysis & SQL
    "/sql-playground", "/data-profiler", "/json-flattener", "/schema-generator",
    "/csv-to-sql", "/dataset-diff", "/data-sampler", "/deduplicator",
    "/sql-formatter", "/markdown-table", "/column-editor", "/data-merge",
    "/pivot-table", "/chart-builder", "/regex-filter", "/csv-splitter",
    "/data-anonymizer", "/data-generator",
    // Utilities
    "/base64", "/hash-generator", "/json-schema-validator",
  ];

  it.each(allRoutes)("sitemap contains route '%s'", (route) => {
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
