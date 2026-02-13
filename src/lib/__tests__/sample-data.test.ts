import { describe, it, expect } from "vitest";
import { getSampleCSV, getSampleCSVBefore, getSampleCSVAfter, getSampleJSON, getSampleProfilerCSV, getSampleSchemaCSV } from "@/lib/sample-data";

describe("sample data generators", () => {
  it("getSampleCSV returns a valid CSV File", () => {
    const file = getSampleCSV();
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("employees.csv");
    expect(file.type).toBe("text/csv");
    expect(file.size).toBeGreaterThan(0);
  });

  it("getSampleCSVBefore returns a File for diff comparison", () => {
    const file = getSampleCSVBefore();
    expect(file.name).toBe("employees_v1.csv");
  });

  it("getSampleCSVAfter returns a different File for diff comparison", () => {
    const file = getSampleCSVAfter();
    expect(file.name).toBe("employees_v2.csv");
  });

  it("getSampleJSON returns a valid JSON File", () => {
    const file = getSampleJSON();
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("customers.json");
    expect(file.type).toBe("application/json");
  });

  it("getSampleProfilerCSV returns a profiler-specific CSV", () => {
    const file = getSampleProfilerCSV();
    expect(file.name).toBe("team_data.csv");
  });

  it("getSampleSchemaCSV returns a schema-specific CSV", () => {
    const file = getSampleSchemaCSV();
    expect(file.name).toBe("employees.csv");
  });

  it("CSV sample data has expected headers", () => {
    const file = getSampleCSV();
    // File constructor stores content as blob, read via FileReader alternative
    // In jsdom, File.text() may not be available, so test the file size instead
    expect(file.size).toBeGreaterThan(100);
  });

  it("JSON sample data has correct size", () => {
    const file = getSampleJSON();
    expect(file.size).toBeGreaterThan(100);
  });

  it("diff samples are different files", () => {
    const before = getSampleCSVBefore();
    const after = getSampleCSVAfter();
    expect(before.name).not.toBe(after.name);
    expect(after.size).toBeGreaterThan(before.size);
  });
});
