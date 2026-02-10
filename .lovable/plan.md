

# Spec vs. Implementation Gap Analysis

## Summary

The current implementation covers all 14 tools from the spec (plus 2 extras: Dataset Diff and Parquet to JSON), but many tools are missing configurable options, advanced features, and interactive elements specified in the detailed tool specs. Below is a comprehensive gap analysis organized by priority.

---

## Currently Matching the Spec

These areas are well-aligned:

- All 14 routes exist and match the spec's routing structure
- DuckDB-WASM initialized once via React context (DuckDBProvider)
- Shared layout shell with header, privacy badge, SEO content, and footer
- "Powered by DuckDB" in footer
- Privacy badge on each tool page
- Unique meta tags and SEO content per tool
- BreadcrumbList JSON-LD schema
- Sample data / "Try with sample data" button on all tools
- JSON Formatter and JSON Flattener use pure JS (no DuckDB) as specified
- SQL Playground has schema sidebar, query history, Ctrl+Enter, multi-file support
- Data Profiler has column cards with completeness, uniqueness, top values, findings, and export (JSON/CSV/HTML)
- Schema Generator has interactive column mapping, multi-dialect, editable types
- CSV Viewer has search, sort, column quick stats, and "Open in SQL Playground" link

---

## Gaps by Tool

### Tool 1: CSV to JSON
| Spec Feature | Status |
|---|---|
| "Paste CSV data" textarea toggle | MISSING |
| Delimiter selector (comma/tab/semicolon/pipe) | MISSING |
| "First row is header" checkbox | MISSING |
| Output format: Array of Arrays option | MISSING (only Array of Objects and NDJSON) |
| Indent selector (2/4/tab) | MISSING |
| Conversion stats ("Converted X rows, Y columns") | MISSING |
| Copy to Clipboard button on output | MISSING (only download) |

### Tool 2: JSON to CSV
| Spec Feature | Status |
|---|---|
| "Paste JSON data" textarea toggle | MISSING |
| Delimiter selector (comma/tab/semicolon) | MISSING |
| Flatten nested objects checkbox + separator config | MISSING |
| Include header row toggle | MISSING |
| Quote all values toggle | MISSING |
| Handle arrays option (join/expand/stringify) | MISSING |
| Conversion stats | MISSING |
| Copy to Clipboard button | MISSING |

### Tool 3: CSV to Parquet
| Spec Feature | Status |
|---|---|
| Delimiter selector | MISSING |
| "First row is header" checkbox | MISSING |
| Row group size option | MISSING |
| GZIP compression option | MISSING (only Snappy/ZSTD/None) |
| Schema preview table (Column/Type/Nullable) | MISSING |

### Tool 4: Parquet to CSV
| Spec Feature | Status |
|---|---|
| Delimiter selector | MISSING |
| Include header toggle | MISSING |
| Quote style selector | MISSING |
| Null value representation | MISSING |
| Timestamp format selector | MISSING |
| Parquet metadata display (row groups, compression) | MISSING |
| Copy to Clipboard (first 10k rows) | MISSING |

### Tool 5: Parquet Viewer
| Spec Feature | Status |
|---|---|
| Column-specific search/filter | MISSING (has global search only) |
| Page navigation for large files (LIMIT/OFFSET) | MISSING |
| Parquet Type + Encoding in schema tab | PARTIAL (missing Parquet-specific type and encoding) |
| Per-row-group stats in metadata | PARTIAL |
| "Copy Schema as SQL DDL" button | MISSING |
| "Download as JSON" link in export | EXISTS |

### Tool 6: JSON Formatter
| Spec Feature | Status |
|---|---|
| FileDropZone for .json files | MISSING (paste only) |
| Status banner ("Valid JSON - 3 objects, 12 keys, 847B" or error with line/col) | PARTIAL (basic error shown, no stats) |
| Tab indent option | PARTIAL (listed as "1 tab" but likely just 1 space) |

### Tool 7: CSV Viewer
| Spec Feature | Status |
|---|---|
| Encoding selector | MISSING |
| Delimiter selector | MISSING |
| Column-specific search ("in [All cols]" dropdown) | MISSING (global only) |
| Detected delimiter display | MISSING |
| Column resize via drag | MISSING |
| Freeze first column option | MISSING |
| Alternating row colors | MISSING |
| Null/empty cell red tint highlighting | PARTIAL (shows null symbol but no red tint) |
| Top 5 values bar chart in column stats | MISSING |
| "Download filtered results as CSV" | MISSING |

### Tool 8: SQL Playground
| Spec Feature | Status |
|---|---|
| Sample queries dropdown | MISSING |
| Download results as JSON button | MISSING |
| Error display with line/column highlighting | MISSING (basic error only) |

### Tool 9: JSON Flattener
| Spec Feature | Status |
|---|---|
| Paste textarea input option | MISSING |
| Max depth selector | MISSING |
| Array handling options (index/bracket/stringify) | MISSING |
| Preserve empty objects toggle | MISSING |
| Preserve null values toggle | MISSING |
| Stats ("Depth reduced: 4 to 1, Keys: 6, Nested objects removed: 2") | MISSING |
| "Convert to CSV" cross-link | MISSING |
| Before/after tree comparison view | PARTIAL (shows original JSON text + flat table, not tree view) |

### Tool 10: Data Profiler
| Spec Feature | Status |
|---|---|
| Duplicate row detection | MISSING |
| Empty row detection | MISSING |
| Data Quality Score (0-100) | MISSING |
| Histogram charts for numeric distributions | MISSING |
| Date column stats (range, day of week, month distribution, sparkline) | MISSING |
| Boolean column pie/donut chart | MISSING |
| String pattern detection (email-like, phone-like, URL-like) | MISSING |
| String length stats (min/max/avg) | MISSING |
| Whitespace-only detection for strings | MISSING |
| Correlation matrix heatmap | MISSING |
| Memory usage estimate | MISSING |
| "Open in SQL Playground" link | MISSING |

### Tool 11: CSV to SQL
| Spec Feature | Status |
|---|---|
| Paste textarea input | MISSING |
| SQL Server dialect | MISSING (has BigQuery instead -- spec says PostgreSQL/MySQL/SQLite/SQL Server/DuckDB) |
| DuckDB dialect | MISSING |
| Schema name option | MISSING |
| NOT NULL constraints on complete columns | MISSING |
| Quoted identifiers toggle | MISSING |
| Interactive schema editor (editable type dropdowns per column) | MISSING |

### Tool 12: Schema Generator
| Spec Feature | Status |
|---|---|
| SQLite dialect | MISSING (spec: PostgreSQL/MySQL/SQLite/SQL Server/DuckDB; current: Postgres/MySQL/BigQuery/Snowflake/DuckDB) |
| SQL Server dialect | MISSING |
| VARCHAR sizing options (exact max / +20% / +50% / fixed 255 / TEXT) | MISSING |
| PRIMARY KEY selection | MISSING |
| DEFAULT values toggle | MISSING |
| Multi-dialect output tabs (show all DDLs simultaneously) | MISSING |
| NOT NULL on complete columns toggle | MISSING |

### Tool 13: Excel to CSV / CSV to Excel
| Spec Feature | Status |
|---|---|
| CSV to Excel mode | MISSING (only Excel to CSV exists) |
| Sheet selector with checkboxes | MISSING |
| "Export as separate CSV files" vs "combined" | MISSING |
| Date format selector | MISSING |
| Encoding selector | MISSING |
| Multi-file input for CSV to Excel with sheet naming | MISSING |
| Download ZIP for multi-sheet | MISSING |

### Tool 14: JSON to Parquet
| Spec Feature | Status |
|---|---|
| Paste textarea input | MISSING |
| Flatten nested objects option | MISSING |
| Compression selector | MISSING |
| Row group size option | MISSING |
| Compression report (JSON size vs Parquet size) | MISSING |
| Schema preview table | MISSING |

---

## Global/Cross-Cutting Gaps

| Spec Feature | Status |
|---|---|
| Cross-tool linking (e.g., "Convert to CSV" from Parquet Viewer pre-loads file) | MOSTLY MISSING |
| Paste/textarea input mode on text-based tools | MISSING on most tools |
| DuckDB loading spinner ("Initializing data engine...") | MISSING |
| Large file pagination (LIMIT/OFFSET with page nav) | MISSING everywhere |
| localStorage note: spec says "NO localStorage" | VIOLATED -- SQL history uses localStorage |
| "No server calls ever. No fetch()" | Compliant |
| maxSizeMB on FileDropZone | NOT SHOWN in UI |

---

## Recommended Implementation Priority

### Phase 1: High-Impact, Low-Effort
1. Add paste/textarea input to CSV to JSON, JSON to CSV, JSON Flattener, JSON to Parquet, CSV to SQL
2. Add DuckDB loading state ("Initializing data engine..." spinner)
3. Add conversion stats line to converter tools
4. Add Copy to Clipboard buttons where missing
5. Fix localStorage usage in SQL Playground (move to React state only)

### Phase 2: Options and Configuration
6. Add delimiter selectors to CSV tools
7. Add compression/row group size options to Parquet tools  
8. Add missing dialect options (SQL Server, DuckDB, SQLite) to CSV to SQL and Schema Generator
9. Add CSV to Excel mode in Excel converter
10. Add "Array of Arrays" output format to CSV to JSON

### Phase 3: Advanced Features
11. Add Data Quality Score, duplicate/empty row detection, histograms, and correlation matrix to Data Profiler
12. Add pagination (LIMIT/OFFSET) to viewers
13. Add column-specific search to CSV Viewer and Parquet Viewer
14. Add JSON Formatter file upload support
15. Add cross-tool linking with React Router state

### Phase 4: Polish
16. Add string pattern detection to Data Profiler
17. Add interactive schema editor to CSV to SQL
18. Add multi-sheet selector and ZIP download to Excel converter
19. Add date column sparklines and boolean pie charts to Data Profiler

