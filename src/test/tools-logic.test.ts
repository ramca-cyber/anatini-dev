import { describe, it, expect } from "vitest";
import * as yaml from "js-yaml";
import { format as formatSql } from "sql-formatter";

describe("YAML → JSON conversion logic", () => {
  it("converts simple YAML to JSON", () => {
    const input = "name: Alice\nage: 30";
    const parsed = yaml.load(input);
    const result = JSON.stringify(parsed, null, 2);
    const obj = JSON.parse(result);
    expect(obj.name).toBe("Alice");
    expect(obj.age).toBe(30);
  });

  it("handles nested YAML", () => {
    const input = `
server:
  host: localhost
  port: 8080
`;
    const parsed = yaml.load(input) as any;
    expect(parsed.server.host).toBe("localhost");
    expect(parsed.server.port).toBe(8080);
  });

  it("handles YAML arrays", () => {
    const input = `
features:
  - auth
  - logging
`;
    const parsed = yaml.load(input) as any;
    expect(parsed.features).toEqual(["auth", "logging"]);
  });

  it("throws on invalid YAML", () => {
    const input = "key: [unclosed";
    expect(() => yaml.load(input)).toThrow();
  });
});

describe("JSON → YAML conversion logic", () => {
  it("converts simple JSON to YAML", () => {
    const input = { name: "Alice", age: 30 };
    const result = yaml.dump(input, { indent: 2, lineWidth: -1, noRefs: true });
    expect(result).toContain("name: Alice");
    expect(result).toContain("age: 30");
  });

  it("converts nested objects", () => {
    const input = { server: { host: "localhost", port: 8080 } };
    const result = yaml.dump(input, { indent: 2 });
    expect(result).toContain("server:");
    expect(result).toContain("host: localhost");
  });

  it("converts arrays", () => {
    const input = { items: ["a", "b", "c"] };
    const result = yaml.dump(input);
    expect(result).toContain("- a");
    expect(result).toContain("- b");
  });

  it("respects indent option", () => {
    const input = { a: { b: "c" } };
    const result2 = yaml.dump(input, { indent: 2 });
    const result4 = yaml.dump(input, { indent: 4 });
    // 4-space indent should have more spaces before b
    expect(result4.indexOf("b:")).toBeGreaterThan(result2.indexOf("b:"));
  });
});

describe("YAML ↔ JSON roundtrip", () => {
  it("roundtrips complex data", () => {
    const original = {
      server: { host: "localhost", port: 8080, debug: true },
      database: { driver: "postgres", pool_size: 10 },
      features: ["auth", "logging", "caching"],
    };
    const yamlStr = yaml.dump(original);
    const backToJson = yaml.load(yamlStr);
    expect(backToJson).toEqual(original);
  });
});

describe("SQL Formatter logic", () => {
  it("formats a simple SELECT", () => {
    const input = "SELECT id, name FROM users WHERE age > 30 ORDER BY name";
    const result = formatSql(input, { language: "sql", keywordCase: "upper", tabWidth: 2 });
    expect(result).toContain("SELECT");
    expect(result).toContain("FROM");
    expect(result).toContain("WHERE");
    expect(result.split("\n").length).toBeGreaterThan(1);
  });

  it("handles different dialects", () => {
    const input = "SELECT * FROM users LIMIT 10";
    const pg = formatSql(input, { language: "postgresql" });
    expect(pg).toContain("SELECT");
  });

  it("applies keyword casing", () => {
    const input = "select id from users";
    const upper = formatSql(input, { keywordCase: "upper" });
    expect(upper).toContain("SELECT");
    const lower = formatSql(input, { keywordCase: "lower" });
    expect(lower).toContain("select");
  });

  it("minification reduces whitespace", () => {
    const input = "SELECT id, name\nFROM users\nWHERE age > 30";
    const formatted = formatSql(input, { tabWidth: 0 });
    const minified = formatted.replace(/\n\s*/g, " ").replace(/\s+/g, " ").trim();
    expect(minified.split("\n").length).toBe(1);
  });
});

describe("JSON formatting logic", () => {
  it("formats valid JSON with indentation", () => {
    const input = '{"name":"Alice","age":30}';
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, 2);
    expect(formatted).toContain("  ");
    expect(formatted.split("\n").length).toBeGreaterThan(1);
  });

  it("minifies JSON by removing whitespace", () => {
    const input = { name: "Alice", age: 30, nested: { key: "value" } };
    const minified = JSON.stringify(input);
    expect(minified).not.toContain("\n");
    expect(minified).not.toContain("  ");
  });

  it("sorts keys alphabetically", () => {
    const input = { zebra: 1, alpha: 2, middle: 3 };
    const sorted = Object.keys(input).sort().reduce((acc, key) => {
      (acc as any)[key] = (input as any)[key];
      return acc;
    }, {} as Record<string, unknown>);
    const keys = Object.keys(sorted);
    expect(keys).toEqual(["alpha", "middle", "zebra"]);
  });

  it("throws on invalid JSON", () => {
    expect(() => JSON.parse("{invalid}")).toThrow();
  });

  it("handles tab indentation", () => {
    const result = JSON.stringify({ a: 1 }, null, "\t");
    expect(result).toContain("\t");
  });
});
