import { describe, it, expect } from "vitest";
import { formatBytes, sanitizeTableName, bigIntReplacer } from "@/lib/duckdb-helpers";

describe("formatBytes", () => {
  it("returns '0 B' for zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(2560)).toBe("2.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(5242880)).toBe("5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });
});

describe("sanitizeTableName", () => {
  it("strips file extension", () => {
    expect(sanitizeTableName("data.csv")).toBe("data");
  });

  it("replaces special characters with underscores", () => {
    expect(sanitizeTableName("my-file (1).csv")).toBe("my_file__1_");
  });

  it("keeps alphanumeric and underscores", () => {
    expect(sanitizeTableName("valid_name_123.json")).toBe("valid_name_123");
  });

  it("handles dotted filenames", () => {
    expect(sanitizeTableName("data.backup.csv")).toBe("data_backup");
  });
});

describe("bigIntReplacer", () => {
  it("converts BigInt to Number", () => {
    expect(bigIntReplacer("key", BigInt(42))).toBe(42);
  });

  it("passes through non-BigInt values", () => {
    expect(bigIntReplacer("key", "hello")).toBe("hello");
    expect(bigIntReplacer("key", 42)).toBe(42);
    expect(bigIntReplacer("key", null)).toBe(null);
    expect(bigIntReplacer("key", true)).toBe(true);
  });

  it("works with JSON.stringify", () => {
    const obj = { count: BigInt(100), name: "test" };
    const result = JSON.stringify(obj, bigIntReplacer);
    expect(result).toBe('{"count":100,"name":"test"}');
  });
});
