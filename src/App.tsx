import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DuckDBProvider } from "@/contexts/DuckDBContext";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import CsvToParquetPage from "./pages/CsvToParquetPage";
import ParquetToCsvPage from "./pages/ParquetToCsvPage";
import FlattenPage from "./pages/FlattenPage";
import SqlPage from "./pages/SqlPage";
import ProfilerPage from "./pages/ProfilerPage";
import DiffPage from "./pages/DiffPage";
import SchemaPage from "./pages/SchemaPage";
import JsonFormatterPage from "./pages/JsonFormatterPage";
import CsvToJsonPage from "./pages/CsvToJsonPage";
import JsonToCsvPage from "./pages/JsonToCsvPage";
import JsonToParquetPage from "./pages/JsonToParquetPage";
import ParquetViewerPage from "./pages/ParquetViewerPage";
import CsvViewerPage from "./pages/CsvViewerPage";
import CsvToSqlPage from "./pages/CsvToSqlPage";
import ExcelCsvPage from "./pages/ExcelCsvPage";
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
              <Route path="/csv-to-parquet" element={<CsvToParquetPage />} />
              <Route path="/parquet-to-csv" element={<ParquetToCsvPage />} />
              <Route path="/csv-to-json" element={<CsvToJsonPage />} />
              <Route path="/json-to-csv" element={<JsonToCsvPage />} />
              <Route path="/json-to-parquet" element={<JsonToParquetPage />} />
              <Route path="/excel-csv-converter" element={<ExcelCsvPage />} />

              {/* Viewers & Formatters */}
              <Route path="/csv-viewer" element={<CsvViewerPage />} />
              <Route path="/parquet-viewer" element={<ParquetViewerPage />} />
              <Route path="/json-formatter" element={<JsonFormatterPage />} />

              {/* Analysis & SQL */}
              <Route path="/sql-playground" element={<SqlPage />} />
              <Route path="/data-profiler" element={<ProfilerPage />} />
              <Route path="/json-flattener" element={<FlattenPage />} />
              <Route path="/schema-generator" element={<SchemaPage />} />
              <Route path="/csv-to-sql" element={<CsvToSqlPage />} />

              {/* Legacy */}
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
