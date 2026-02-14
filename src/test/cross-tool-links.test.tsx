import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";

function renderCrossLinks(props: { format: string; excludeRoute?: string }) {
  return render(
    <MemoryRouter>
      <CrossToolLinks {...props} />
    </MemoryRouter>
  );
}

describe("CrossToolLinks", () => {
  it("renders CSV links", () => {
    renderCrossLinks({ format: "csv" });
    expect(screen.getByText("Convert to JSON")).toBeInTheDocument();
    expect(screen.getByText("Convert to Parquet")).toBeInTheDocument();
    expect(screen.getByText("SQL Playground")).toBeInTheDocument();
  });

  it("renders JSON links", () => {
    renderCrossLinks({ format: "json" });
    expect(screen.getByText("Convert to CSV")).toBeInTheDocument();
    expect(screen.getByText("Flatten JSON")).toBeInTheDocument();
  });

  it("renders Parquet links", () => {
    renderCrossLinks({ format: "parquet" });
    expect(screen.getByText("Convert to CSV")).toBeInTheDocument();
    expect(screen.getByText("Convert to JSON")).toBeInTheDocument();
  });

  it("renders Excel links", () => {
    renderCrossLinks({ format: "excel" });
    expect(screen.getByText("Convert to CSV")).toBeInTheDocument();
  });

  it("renders YAML links", () => {
    renderCrossLinks({ format: "yaml" });
    expect(screen.getByText("YAML → JSON")).toBeInTheDocument();
    expect(screen.getByText("JSON → YAML")).toBeInTheDocument();
    expect(screen.getByText("JSON Formatter")).toBeInTheDocument();
  });

  it("excludes the current route", () => {
    renderCrossLinks({ format: "yaml", excludeRoute: "/yaml-to-json" });
    expect(screen.queryByText("YAML → JSON")).not.toBeInTheDocument();
    expect(screen.getByText("JSON → YAML")).toBeInTheDocument();
  });

  it("returns null for unknown format", () => {
    const { container } = renderCrossLinks({ format: "unknown" });
    expect(container.innerHTML).toBe("");
  });

  it("all CSV links point to valid routes", () => {
    const { container } = renderCrossLinks({ format: "csv" });
    const links = container.querySelectorAll("a");
    const validRoutes = [
      "/csv-to-json", "/csv-to-parquet", "/csv-to-sql", "/csv-viewer",
      "/sql-playground", "/data-profiler", "/data-sampler", "/deduplicator",
      "/column-editor", "/data-merge", "/pivot-table", "/chart-builder", "/regex-filter",
      "/data-anonymizer",
    ];
    links.forEach((link) => {
      expect(validRoutes).toContain(link.getAttribute("href"));
    });
  });
});
