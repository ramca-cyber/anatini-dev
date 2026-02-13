import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DuckDBProvider } from "@/contexts/DuckDBContext";
import { FileStoreProvider } from "@/contexts/FileStoreContext";
import { Layout } from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const CsvToParquetPage = lazy(() => import("./pages/CsvToParquetPage"));
const ParquetToCsvPage = lazy(() => import("./pages/ParquetToCsvPage"));
const FlattenPage = lazy(() => import("./pages/FlattenPage"));
const SqlPage = lazy(() => import("./pages/SqlPage"));
const ProfilerPage = lazy(() => import("./pages/ProfilerPage"));
const DiffPage = lazy(() => import("./pages/DiffPage"));
const SchemaPage = lazy(() => import("./pages/SchemaPage"));
const JsonFormatterPage = lazy(() => import("./pages/JsonFormatterPage"));
const CsvToJsonPage = lazy(() => import("./pages/CsvToJsonPage"));
const JsonToCsvPage = lazy(() => import("./pages/JsonToCsvPage"));
const JsonToParquetPage = lazy(() => import("./pages/JsonToParquetPage"));
const ParquetToJsonPage = lazy(() => import("./pages/ParquetToJsonPage"));
const ParquetViewerPage = lazy(() => import("./pages/ParquetViewerPage"));
const CsvViewerPage = lazy(() => import("./pages/CsvViewerPage"));
const CsvToSqlPage = lazy(() => import("./pages/CsvToSqlPage"));
const ExcelToCsvPage = lazy(() => import("./pages/ExcelToCsvPage"));
const CsvToExcelPage = lazy(() => import("./pages/CsvToExcelPage"));
const CsvInspectorPage = lazy(() => import("./pages/CsvInspectorPage"));
const JsonInspectorPage = lazy(() => import("./pages/JsonInspectorPage"));
const ParquetInspectorPage = lazy(() => import("./pages/ParquetInspectorPage"));
const DataSamplerPage = lazy(() => import("./pages/DataSamplerPage"));
const DeduplicatorPage = lazy(() => import("./pages/DeduplicatorPage"));
const SqlFormatterPage = lazy(() => import("./pages/SqlFormatterPage"));
const MarkdownTablePage = lazy(() => import("./pages/MarkdownTablePage"));
const ColumnEditorPage = lazy(() => import("./pages/ColumnEditorPage"));
const DataMergePage = lazy(() => import("./pages/DataMergePage"));
const PivotTablePage = lazy(() => import("./pages/PivotTablePage"));
const ChartBuilderPage = lazy(() => import("./pages/ChartBuilderPage"));
const YamlJsonPage = lazy(() => import("./pages/YamlJsonPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const HowToConvertCsvToParquet = lazy(() => import("./pages/blog/HowToConvertCsvToParquet"));
const HowToQueryCsvWithSql = lazy(() => import("./pages/blog/HowToQueryCsvWithSql"));
const OfflineDataQualityProfiler = lazy(() => import("./pages/blog/OfflineDataQualityProfiler"));
const JsonVsCsvVsParquet = lazy(() => import("./pages/blog/JsonVsCsvVsParquet"));
const HowToGenerateSqlFromCsv = lazy(() => import("./pages/blog/HowToGenerateSqlFromCsv"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DuckDBProvider>
        <FileStoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />

                  {/* Converters */}
                  <Route path="/csv-to-parquet" element={<CsvToParquetPage />} />
                  <Route path="/parquet-to-csv" element={<ParquetToCsvPage />} />
                  <Route path="/csv-to-json" element={<CsvToJsonPage />} />
                  <Route path="/json-to-csv" element={<JsonToCsvPage />} />
                  <Route path="/json-to-parquet" element={<JsonToParquetPage />} />
                  <Route path="/parquet-to-json" element={<ParquetToJsonPage />} />
                  <Route path="/excel-to-csv" element={<ExcelToCsvPage />} />
                  <Route path="/csv-to-excel" element={<CsvToExcelPage />} />
                  <Route path="/excel-csv-converter" element={<Navigate to="/excel-to-csv" replace />} />

                  {/* Viewers & Formatters */}
                  <Route path="/csv-viewer" element={<CsvViewerPage />} />
                  <Route path="/parquet-viewer" element={<ParquetViewerPage />} />
                  <Route path="/json-formatter" element={<JsonFormatterPage />} />

                  {/* Inspectors */}
                  <Route path="/csv-inspector" element={<CsvInspectorPage />} />
                  <Route path="/json-inspector" element={<JsonInspectorPage />} />
                  <Route path="/parquet-inspector" element={<ParquetInspectorPage />} />

                  {/* Analysis & SQL */}
                  <Route path="/sql-playground" element={<SqlPage />} />
                  <Route path="/data-profiler" element={<ProfilerPage />} />
                  <Route path="/json-flattener" element={<FlattenPage />} />
                  <Route path="/schema-generator" element={<SchemaPage />} />
                  <Route path="/csv-to-sql" element={<CsvToSqlPage />} />
                  <Route path="/data-sampler" element={<DataSamplerPage />} />
                  <Route path="/deduplicator" element={<DeduplicatorPage />} />
                  <Route path="/sql-formatter" element={<SqlFormatterPage />} />
                  <Route path="/markdown-table" element={<MarkdownTablePage />} />
                  <Route path="/column-editor" element={<ColumnEditorPage />} />
                  <Route path="/data-merge" element={<DataMergePage />} />
                  <Route path="/pivot-table" element={<PivotTablePage />} />
                  <Route path="/chart-builder" element={<ChartBuilderPage />} />
                  <Route path="/yaml-json" element={<YamlJsonPage />} />

                  {/* Legacy */}
                  <Route path="/dataset-diff" element={<DiffPage />} />
                  <Route path="/diff" element={<Navigate to="/dataset-diff" replace />} />

                  {/* Redirects from old routes */}
                  <Route path="/convert" element={<Navigate to="/csv-to-parquet" replace />} />
                  <Route path="/flatten" element={<Navigate to="/json-flattener" replace />} />
                  <Route path="/sql" element={<Navigate to="/sql-playground" replace />} />
                  <Route path="/profiler" element={<Navigate to="/data-profiler" replace />} />
                  <Route path="/schema" element={<Navigate to="/schema-generator" replace />} />

                  <Route path="/about" element={<About />} />

                  {/* Blog */}
                  <Route path="/blog" element={<BlogIndex />} />
                  <Route path="/blog/how-to-convert-csv-to-parquet" element={<HowToConvertCsvToParquet />} />
                  <Route path="/blog/how-to-query-csv-with-sql" element={<HowToQueryCsvWithSql />} />
                  <Route path="/blog/offline-data-quality-profiler" element={<OfflineDataQualityProfiler />} />
                  <Route path="/blog/json-vs-csv-vs-parquet" element={<JsonVsCsvVsParquet />} />
                  <Route path="/blog/how-to-generate-sql-from-csv" element={<HowToGenerateSqlFromCsv />} />
                </Route>
                <Route element={<Layout />}>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </FileStoreProvider>
      </DuckDBProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
