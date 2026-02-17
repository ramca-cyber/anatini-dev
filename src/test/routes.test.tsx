import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileStoreProvider } from "@/contexts/FileStoreContext";
import { toolCount } from "@/lib/tool-registry";

// Mock DuckDB since it requires WASM which isn't available in jsdom
vi.mock("@/contexts/DuckDBContext", () => ({
  DuckDBProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDuckDB: () => ({ db: null, loading: false, error: null, requestInit: vi.fn() }),
}));

// Mock window.matchMedia (already in setup but ensure it's available)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

function renderWithRoute(path: string, element: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FileStoreProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </MemoryRouter>
        </FileStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Import all page components
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import YamlToJsonPage from "@/pages/YamlToJsonPage";
import JsonToYamlPage from "@/pages/JsonToYamlPage";
import SqlFormatterPage from "@/pages/SqlFormatterPage";
import JsonFormatterPage from "@/pages/JsonFormatterPage";

describe("Page rendering", () => {
  it("renders the homepage with all tool categories", () => {
    renderWithRoute("/", <Index />);
    expect(screen.getByText("Converters")).toBeInTheDocument();
    expect(screen.getByText("Viewers & Formatters")).toBeInTheDocument();
    expect(screen.getByText("Inspectors")).toBeInTheDocument();
    expect(screen.getByText("Analysis & SQL")).toBeInTheDocument();
  });

  it("homepage displays correct tool count", () => {
    renderWithRoute("/", <Index />);
    expect(screen.getByText(new RegExp(`${toolCount} Tools`))).toBeInTheDocument();
  });

  it(`homepage has all ${toolCount} tool cards`, () => {
    renderWithRoute("/", <Index />);
    // Check a tool from each category using getAllByText to handle hero CTA duplicates
    expect(screen.getAllByText("CSV → Parquet").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Delimited Viewer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Excel Viewer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("XML Formatter").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("YAML Formatter").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Log Viewer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Hex Viewer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CSV Inspector").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SQL Playground").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("YAML → JSON").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("JSON → YAML").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Regex Filter").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Chart Builder").length).toBeGreaterThanOrEqual(1);
  });

  it("renders NotFound page", () => {
    renderWithRoute("/not-a-real-page", <NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Return to Home")).toBeInTheDocument();
  });

  it("renders YAML to JSON page with heading", () => {
    renderWithRoute("/yaml-to-json", <YamlToJsonPage />);
    expect(screen.getByRole("heading", { name: "YAML → JSON Converter" })).toBeInTheDocument();
    expect(screen.getByText("Load Sample")).toBeInTheDocument();
  });

  it("renders JSON to YAML page with heading", () => {
    renderWithRoute("/json-to-yaml", <JsonToYamlPage />);
    expect(screen.getByRole("heading", { name: "JSON → YAML Converter" })).toBeInTheDocument();
  });

  it("renders SQL Formatter page", () => {
    renderWithRoute("/sql-formatter", <SqlFormatterPage />);
    expect(screen.getByRole("heading", { name: "SQL Formatter" })).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("Minify")).toBeInTheDocument();
  });

  it("renders JSON Formatter page", () => {
    renderWithRoute("/json-formatter", <JsonFormatterPage />);
    expect(screen.getByRole("heading", { name: "JSON Formatter" })).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });
});

describe("Homepage consistency", () => {
  it("hero badge and meta reference correct counts", () => {
    renderWithRoute("/", <Index />);
    expect(screen.getByText(new RegExp(`${toolCount} Tools`))).toBeInTheDocument();
  });

  it("all tool categories have tool rows", () => {
    renderWithRoute("/", <Index />);
    // Each tool renders as a link with a truncated span — count them
    const toolLinks = screen.getAllByRole("link").filter(el => el.getAttribute("href")?.startsWith("/") && el.querySelector(".truncate"));
    expect(toolLinks.length).toBe(toolCount);
  });

  it("privacy section is present", () => {
    renderWithRoute("/", <Index />);
    expect(screen.getByText("Your data stays yours.")).toBeInTheDocument();
  });

  it("JSON-LD script is rendered", () => {
    renderWithRoute("/", <Index />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);
    const jsonLd = JSON.parse(scripts[0].textContent || "{}");
    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.featureList).toContain("YAML → JSON");
    expect(jsonLd.featureList).toContain("JSON → YAML");
    expect(jsonLd.featureList).toContain("Regex Filter");
  });
});
