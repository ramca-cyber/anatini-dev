import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
              <Route path="/convert" element={<ConvertPage />} />
              <Route path="/flatten" element={<FlattenPage />} />
              <Route path="/sql" element={<SqlPage />} />
              <Route path="/profiler" element={<ProfilerPage />} />
              <Route path="/diff" element={<DiffPage />} />
              <Route path="/schema" element={<SchemaPage />} />
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
