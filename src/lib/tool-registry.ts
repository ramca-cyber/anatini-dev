import {
  FileSpreadsheet, Braces, Terminal, BarChart3, Database,
  FileJson, Table, Eye, Code, FileText, Zap, Lock, Globe, Shield,
  GitCompare, Search, Shuffle, Copy, AlignLeft, Columns3, Merge,
  TableProperties, RefreshCw, Filter, Scissors, Binary, ShieldOff, Hash, Wand2,
  CheckCircle2, Link2, Clock, ScanSearch,
  QrCode, ImageDown, KeyRound, Regex, Palette, Fingerprint,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolDef {
  id: string;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface ToolCategory {
  label: string;
  tools: ToolDef[];
}

export const toolCategories: ToolCategory[] = [
  {
    label: "Converters",
    tools: [
      { id: "csv-to-parquet", path: "/csv-to-parquet", label: "CSV → Parquet", description: "Columnar format with compression options.", icon: FileSpreadsheet },
      { id: "parquet-to-csv", path: "/parquet-to-csv", label: "Parquet → CSV", description: "Export Parquet back to CSV.", icon: FileSpreadsheet },
      { id: "csv-to-json", path: "/csv-to-json", label: "CSV → JSON", description: "Array or NDJSON output format.", icon: FileJson },
      { id: "json-to-csv", path: "/json-to-csv", label: "JSON → CSV", description: "Flatten and convert to CSV.", icon: Table },
      { id: "json-to-parquet", path: "/json-to-parquet", label: "JSON → Parquet", description: "Compress JSON into Parquet.", icon: Braces },
      { id: "parquet-to-json", path: "/parquet-to-json", label: "Parquet → JSON", description: "Export Parquet to JSON/NDJSON.", icon: Braces },
      { id: "excel-to-csv", path: "/excel-to-csv", label: "Excel → CSV", description: "Multi-sheet export to CSV.", icon: FileText },
      { id: "csv-to-excel", path: "/csv-to-excel", label: "CSV → Excel", description: "Combine CSVs into a workbook.", icon: FileText },
      { id: "yaml-to-json", path: "/yaml-to-json", label: "YAML → JSON", description: "Convert YAML documents to JSON.", icon: RefreshCw },
      { id: "json-to-yaml", path: "/json-to-yaml", label: "JSON → YAML", description: "Convert JSON documents to YAML.", icon: RefreshCw },
      { id: "xml-to-json", path: "/xml-to-json", label: "XML → JSON", description: "Convert XML documents to JSON.", icon: RefreshCw },
      { id: "json-to-xml", path: "/json-to-xml", label: "JSON → XML", description: "Convert JSON documents to XML.", icon: RefreshCw },
      { id: "toml-to-json", path: "/toml-to-json", label: "TOML → JSON", description: "Convert TOML config files to JSON.", icon: RefreshCw },
      { id: "json-to-toml", path: "/json-to-toml", label: "JSON → TOML", description: "Convert JSON to TOML config format.", icon: RefreshCw },
    ],
  },
  {
    label: "Viewers & Formatters",
    tools: [
      { id: "csv-viewer", path: "/csv-viewer", label: "Delimited Viewer", description: "View CSV, TSV, DSV with search & stats.", icon: Eye },
      { id: "parquet-viewer", path: "/parquet-viewer", label: "Parquet Viewer", description: "Data, schema, and metadata tabs.", icon: Eye },
      { id: "excel-viewer", path: "/excel-viewer", label: "Excel Viewer", description: "Browse XLSX/XLS with multi-sheet tabs.", icon: Eye },
      { id: "json-formatter", path: "/json-formatter", label: "JSON Formatter", description: "Format, minify, validate with tree view.", icon: Code },
      { id: "xml-formatter", path: "/xml-formatter", label: "XML Formatter", description: "Format, minify, validate XML documents.", icon: Code },
      { id: "yaml-formatter", path: "/yaml-formatter", label: "YAML Formatter", description: "Format, minify, validate YAML documents.", icon: Code },
      { id: "log-viewer", path: "/log-viewer", label: "Log Viewer", description: "Filter logs by level, regex search, line numbers.", icon: FileText },
      { id: "hex-viewer", path: "/hex-viewer", label: "Hex Viewer", description: "Inspect binary files with hex + ASCII columns.", icon: Binary },
    ],
  },
  {
    label: "Inspectors",
    tools: [
      { id: "csv-inspector", path: "/csv-inspector", label: "CSV Inspector", description: "Analyze encoding, structure & quality.", icon: Search },
      { id: "json-inspector", path: "/json-inspector", label: "JSON Inspector", description: "Analyze schema, types & consistency.", icon: Search },
      { id: "parquet-inspector", path: "/parquet-inspector", label: "Parquet Inspector", description: "View metadata, row groups & stats.", icon: Search },
    ],
  },
  {
    label: "Analysis & SQL",
    tools: [
      { id: "sql-playground", path: "/sql-playground", label: "SQL Playground", description: "Full DuckDB SQL against local files.", icon: Terminal },
      { id: "data-profiler", path: "/data-profiler", label: "Data Profiler", description: "Nulls, duplicates, outliers, quality.", icon: BarChart3 },
      { id: "json-flattener", path: "/json-flattener", label: "JSON Flattener", description: "Flatten nested JSON to tabular.", icon: Braces },
      { id: "schema-generator", path: "/schema-generator", label: "Schema Generator", description: "DDL for Postgres, MySQL, BigQuery.", icon: Database },
      { id: "csv-to-sql", path: "/csv-to-sql", label: "CSV → SQL", description: "CREATE TABLE + INSERT statements.", icon: Database },
      { id: "dataset-diff", path: "/dataset-diff", label: "Dataset Diff", description: "Compare two dataset versions.", icon: GitCompare },
      { id: "data-sampler", path: "/data-sampler", label: "Data Sampler", description: "Random or stratified sampling.", icon: Shuffle },
      { id: "deduplicator", path: "/deduplicator", label: "Deduplicator", description: "Find and remove duplicate rows.", icon: Copy },
      { id: "sql-formatter", path: "/sql-formatter", label: "SQL Formatter", description: "Beautify and minify SQL queries.", icon: Code },
      { id: "markdown-table", path: "/markdown-table", label: "Markdown Table", description: "Convert data to Markdown tables.", icon: AlignLeft },
      { id: "column-editor", path: "/column-editor", label: "Column Editor", description: "Select, reorder, rename columns.", icon: Columns3 },
      { id: "data-merge", path: "/data-merge", label: "Data Merge", description: "Join two datasets visually.", icon: Merge },
      { id: "pivot-table", path: "/pivot-table", label: "Pivot Table", description: "Build pivot tables with aggregation.", icon: TableProperties },
      { id: "chart-builder", path: "/chart-builder", label: "Chart Builder", description: "Bar, line, area, pie, scatter charts.", icon: BarChart3 },
      { id: "regex-filter", path: "/regex-filter", label: "Regex Filter", description: "Filter rows by regex pattern.", icon: Filter },
      { id: "csv-splitter", path: "/csv-splitter", label: "CSV Splitter", description: "Split files by row count or column.", icon: Scissors },
      { id: "data-anonymizer", path: "/data-anonymizer", label: "Data Anonymizer", description: "Mask, redact, or fake sensitive columns.", icon: ShieldOff },
      { id: "data-generator", path: "/data-generator", label: "Data Generator", description: "Generate realistic sample datasets.", icon: Wand2 },
    ],
  },
  {
    label: "Utilities",
    tools: [
      { id: "base64", path: "/base64", label: "Base64 Encoder/Decoder", description: "Encode and decode Base64 text or files.", icon: Binary },
      { id: "hash-generator", path: "/hash-generator", label: "Hash Generator", description: "SHA-256, SHA-384, SHA-512 from text or files.", icon: Hash },
      { id: "json-schema-validator", path: "/json-schema-validator", label: "JSON Schema Validator", description: "Validate JSON against schema definitions.", icon: CheckCircle2 },
      { id: "json-diff", path: "/json-diff", label: "JSON Diff", description: "Compare two JSON documents side-by-side.", icon: GitCompare },
      { id: "url-encoder", path: "/url-encoder", label: "URL Encoder / Decoder", description: "Encode or decode URLs and query strings.", icon: Link2 },
      { id: "cron-parser", path: "/cron-parser", label: "Cron Parser", description: "Explain cron expressions in plain English.", icon: Clock },
      { id: "encoding-detector", path: "/encoding-detector", label: "Encoding Detector", description: "Detect charset, BOM, and line endings.", icon: ScanSearch },
      { id: "qr-code", path: "/qr-code", label: "QR Code Generator", description: "Generate QR codes from text or URLs.", icon: QrCode },
      { id: "image-compressor", path: "/image-compressor", label: "Image Compressor", description: "Compress images with quality control.", icon: ImageDown },
      { id: "password-generator", path: "/password-generator", label: "Password Generator", description: "Cryptographically secure passwords.", icon: KeyRound },
      { id: "regex-tester", path: "/regex-tester", label: "Regex Tester", description: "Test regex with match highlighting.", icon: Regex },
      { id: "color-picker", path: "/color-picker", label: "Color Picker", description: "Hex/RGB/HSL converter & WCAG contrast.", icon: Palette },
      { id: "text-diff", path: "/text-diff", label: "Text Diff", description: "Compare text blocks side-by-side.", icon: GitCompare },
      { id: "uuid-generator", path: "/uuid-generator", label: "UUID Generator", description: "Generate v4 and v7 UUIDs.", icon: Fingerprint },
      { id: "timestamp-converter", path: "/timestamp-converter", label: "Timestamp Converter", description: "Unix epoch ↔ human-readable dates.", icon: Clock },
      { id: "jwt-decoder", path: "/jwt-decoder", label: "JWT Decoder", description: "Decode JWT header and payload.", icon: Shield },
    ],
  },
];

/** Flat list of all tools */
export const allTools = toolCategories.flatMap((c) => c.tools);

/** Total tool count */
export const toolCount = allTools.length;

/** All tool IDs */
export const allToolIds = allTools.map((t) => t.id);

/** All tool paths (for sitemap/route validation) */
export const allToolPaths = allTools.map((t) => t.path);

/** Flat list for nav/command palette (label + path only) */
export const navToolGroups = toolCategories.map((c) => ({
  label: c.label,
  tools: c.tools.map((t) => ({ path: t.path, label: t.label })),
}));

/** Feature list string for JSON-LD */
export const featureListString = allTools.map((t) => t.label).join(", ");
