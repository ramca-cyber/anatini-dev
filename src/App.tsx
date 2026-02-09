import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DuckDBProvider } from "@/contexts/DuckDBContext";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import ConvertPage from "./pages/ConvertPage";
import FlattenPage from "./pages/FlattenPage";
import SqlPage from "./pages/SqlPage";
import ProfilerPage from "./pages/ProfilerPage";
import DiffPage from "./pages/DiffPage";
import SchemaPage from "./pages/SchemaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DuckDBProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />

              {/* Converters */}
              <Route path="/csv-to-parquet" element={<ConvertPage />} />
              <Route path="/parquet-to-csv" element={<ConvertPage />} />
              <Route path="/csv-to-json" element={<NotFound />} />
              <Route path="/json-to-csv" element={<NotFound />} />
              <Route path="/json-to-parquet" element={<NotFound />} />
              <Route path="/excel-csv-converter" element={<NotFound />} />

              {/* Viewers & Formatters */}
              <Route path="/csv-viewer" element={<NotFound />} />
              <Route path="/parquet-viewer" element={<NotFound />} />
              <Route path="/json-formatter" element={<NotFound />} />

              {/* Analysis & SQL */}
              <Route path="/sql-playground" element={<SqlPage />} />
              <Route path="/data-profiler" element={<ProfilerPage />} />
              <Route path="/json-flattener" element={<FlattenPage />} />
              <Route path="/schema-generator" element={<SchemaPage />} />
              <Route path="/csv-to-sql" element={<NotFound />} />

              {/* Legacy — kept */}
              <Route path="/diff" element={<DiffPage />} />

              {/* Redirects from old routes */}
              <Route path="/convert" element={<Navigate to="/csv-to-parquet" replace />} />
              <Route path="/flatten" element={<Navigate to="/json-flattener" replace />} />
              <Route path="/sql" element={<Navigate to="/sql-playground" replace />} />
              <Route path="/profiler" element={<Navigate to="/data-profiler" replace />} />
              <Route path="/schema" element={<Navigate to="/schema-generator" replace />} />

              <Route path="/about" element={<About />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DuckDBProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
