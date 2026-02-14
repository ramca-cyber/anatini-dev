import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

const toolGroups = [
  {
    label: "Converters",
    tools: [
      { path: "/csv-to-parquet", label: "CSV → Parquet" },
      { path: "/parquet-to-csv", label: "Parquet → CSV" },
      { path: "/csv-to-json", label: "CSV → JSON" },
      { path: "/json-to-csv", label: "JSON → CSV" },
      { path: "/json-to-parquet", label: "JSON → Parquet" },
      { path: "/parquet-to-json", label: "Parquet → JSON" },
      { path: "/excel-to-csv", label: "Excel → CSV" },
      { path: "/csv-to-excel", label: "CSV → Excel" },
      { path: "/yaml-to-json", label: "YAML → JSON" },
      { path: "/json-to-yaml", label: "JSON → YAML" },
      { path: "/xml-to-json", label: "XML → JSON" },
      { path: "/json-to-xml", label: "JSON → XML" },
      { path: "/toml-to-json", label: "TOML → JSON" },
      { path: "/json-to-toml", label: "JSON → TOML" },
    ],
  },
  {
    label: "Viewers & Formatters",
    tools: [
      { path: "/csv-viewer", label: "Delimited Viewer" },
      { path: "/parquet-viewer", label: "Parquet Viewer" },
      { path: "/excel-viewer", label: "Excel Viewer" },
      { path: "/json-formatter", label: "JSON Formatter" },
      { path: "/xml-formatter", label: "XML Formatter" },
      { path: "/yaml-formatter", label: "YAML Formatter" },
      { path: "/log-viewer", label: "Log Viewer" },
      { path: "/hex-viewer", label: "Hex Viewer" },
    ],
  },
  {
    label: "Inspectors",
    tools: [
      { path: "/csv-inspector", label: "CSV Inspector" },
      { path: "/json-inspector", label: "JSON Inspector" },
      { path: "/parquet-inspector", label: "Parquet Inspector" },
    ],
  },
  {
    label: "Analysis & SQL",
    tools: [
      { path: "/sql-playground", label: "SQL Playground" },
      { path: "/data-profiler", label: "Data Profiler" },
      { path: "/json-flattener", label: "JSON Flattener" },
      { path: "/schema-generator", label: "Schema Generator" },
      { path: "/csv-to-sql", label: "CSV → SQL" },
      { path: "/dataset-diff", label: "Dataset Diff" },
      { path: "/data-sampler", label: "Data Sampler" },
      { path: "/deduplicator", label: "Deduplicator" },
      { path: "/sql-formatter", label: "SQL Formatter" },
      { path: "/markdown-table", label: "Markdown Table" },
      { path: "/column-editor", label: "Column Editor" },
      { path: "/data-merge", label: "Data Merge" },
      { path: "/pivot-table", label: "Pivot Table" },
      { path: "/chart-builder", label: "Chart Builder" },
      { path: "/regex-filter", label: "Regex Filter" },
      { path: "/csv-splitter", label: "CSV Splitter" },
      { path: "/data-anonymizer", label: "Data Anonymizer" },
      { path: "/data-generator", label: "Data Generator" },
    ],
  },
  {
    label: "Utilities",
    tools: [
      { path: "/base64", label: "Base64 Encoder/Decoder" },
      { path: "/hash-generator", label: "Hash Generator" },
      { path: "/json-schema-validator", label: "JSON Schema Validator" },
    ],
  },
  {
    label: "Pages",
    tools: [
      { path: "/blog", label: "Blog" },
      { path: "/about", label: "About" },
    ],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tools…" />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {toolGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.tools.map((tool) => (
              <CommandItem
                key={tool.path}
                value={tool.label}
                onSelect={() => handleSelect(tool.path)}
              >
                {tool.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
