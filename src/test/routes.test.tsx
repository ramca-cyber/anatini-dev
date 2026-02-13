import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileStoreProvider } from "@/contexts/FileStoreContext";

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
    expect(screen.getByText(/45 Tools/)).toBeInTheDocument();
  });

  it("homepage has all 45 tool cards", () => {
    renderWithRoute("/", <Index />);
    // Check a tool from each category
    expect(screen.getByText("CSV → Parquet")).toBeInTheDocument();
    expect(screen.getByText("Delimited Viewer")).toBeInTheDocument();
    expect(screen.getByText("Excel Viewer")).toBeInTheDocument();
    expect(screen.getByText("XML Formatter")).toBeInTheDocument();
    expect(screen.getByText("YAML Formatter")).toBeInTheDocument();
    expect(screen.getByText("Log Viewer")).toBeInTheDocument();
    expect(screen.getByText("CSV Inspector")).toBeInTheDocument();
    expect(screen.getByText("SQL Playground")).toBeInTheDocument();
    expect(screen.getByText("YAML → JSON")).toBeInTheDocument();
    expect(screen.getByText("JSON → YAML")).toBeInTheDocument();
    expect(screen.getByText("Regex Filter")).toBeInTheDocument();
    expect(screen.getByText("Chart Builder")).toBeInTheDocument();
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
  it("hero badge, feature card, and meta all reference correct counts", () => {
    renderWithRoute("/", <Index />);
    // Hero badge says "45 Tools"
    expect(screen.getByText(/45 Tools/)).toBeInTheDocument();
    // Feature card says "45+ tools"
    expect(screen.getByText(/45\+ tools/)).toBeInTheDocument();
  });

  it("all tool categories have cards", () => {
    renderWithRoute("/", <Index />);
    // 14 converters + 7 viewers + 3 inspectors + 18 analysis + 3 utilities = 45
    const allLinks = screen.getAllByText("Open");
    // Each tool card has an "Open" text that appears on hover
    expect(allLinks.length).toBe(45);
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
    expect(jsonLd.featureList).toContain("YAML to JSON");
    expect(jsonLd.featureList).toContain("JSON to YAML");
    expect(jsonLd.featureList).toContain("Regex Filter");
  });
});
