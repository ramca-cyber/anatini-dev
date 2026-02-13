import { describe, it, expect } from "vitest";
import { getToolMetaDescription } from "@/lib/seo-content";

// All tool IDs that should have SEO content
const ALL_TOOL_IDS = [
  "csv-to-parquet",
  "parquet-to-csv",
  "csv-to-json",
  "json-to-csv",
  "json-to-parquet",
  "parquet-to-json",
  "excel-to-csv",
  "csv-to-excel",
  "csv-viewer",
  "parquet-viewer",
  "json-formatter",
  "csv-inspector",
  "json-inspector",
  "parquet-inspector",
  "sql-playground",
  "data-profiler",
  "json-flattener",
  "schema-generator",
  "csv-to-sql",
  "dataset-diff",
  "data-sampler",
  "deduplicator",
  "sql-formatter",
  "markdown-table",
  "column-editor",
  "data-merge",
  "pivot-table",
  "chart-builder",
  "yaml-to-json",
  "json-to-yaml",
  "regex-filter",
  "xml-to-json",
  "json-to-xml",
  "csv-splitter",
  "base64",
  "data-anonymizer",
  "hash-generator",
  "data-generator",
];

describe("SEO content coverage", () => {
  it.each(ALL_TOOL_IDS)("tool '%s' has a meta description", (toolId) => {
    const desc = getToolMetaDescription(toolId);
    expect(desc).toBeDefined();
    expect(desc!.length).toBeGreaterThan(20);
    expect(desc!.length).toBeLessThanOrEqual(160);
  });

  it("returns undefined for unknown tool IDs", () => {
    expect(getToolMetaDescription("nonexistent-tool")).toBeUndefined();
  });
});
