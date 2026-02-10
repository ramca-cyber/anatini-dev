import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Database, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { CrossToolLinks } from "@/components/shared/CrossToolLinks";
import { InspectLink } from "@/components/shared/InspectLink";
import { ToggleButton } from "@/components/shared/ToggleButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useFileStore } from "@/contexts/FileStoreContext";
import { useAutoLoadFile } from "@/hooks/useAutoLoadFile";
import { registerFile, runQuery, formatBytes, sanitizeTableName, downloadBlob } from "@/lib/duckdb-helpers";
import { getSampleSchemaCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

type Dialect = "postgresql" | "mysql" | "sqlite" | "sqlserver" | "bigquery" | "snowflake" | "duckdb";
type VarcharSizing = "exact" | "plus20" | "plus50" | "fixed255" | "text";

interface ColSchema {
  name: string;
  detectedType: string;
  mappedType: string;
  nullable: boolean;
  sampleValue?: string;
  maxLength?: number;
}

const TYPE_MAP: Record<Dialect, Record<string, string>> = {
  postgresql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE PRECISION", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP", FLOAT: "REAL" },
  mysql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "DOUBLE", BOOLEAN: "TINYINT(1)", DATE: "DATE", TIMESTAMP: "DATETIME", FLOAT: "FLOAT" },
  sqlite: { VARCHAR: "TEXT", BIGINT: "INTEGER", INTEGER: "INTEGER", DOUBLE: "REAL", BOOLEAN: "INTEGER", DATE: "TEXT", TIMESTAMP: "TEXT", FLOAT: "REAL" },
  sqlserver: { VARCHAR: "NVARCHAR(MAX)", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "FLOAT", BOOLEAN: "BIT", DATE: "DATE", TIMESTAMP: "DATETIME2", FLOAT: "FLOAT" },
  bigquery: { VARCHAR: "STRING", BIGINT: "INT64", INTEGER: "INT64", DOUBLE: "FLOAT64", BOOLEAN: "BOOL", DATE: "DATE", TIMESTAMP: "TIMESTAMP", FLOAT: "FLOAT64" },
  snowflake: { VARCHAR: "VARCHAR", BIGINT: "NUMBER", INTEGER: "NUMBER", DOUBLE: "FLOAT", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP_NTZ", FLOAT: "FLOAT" },
  duckdb: { VARCHAR: "VARCHAR", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP", FLOAT: "FLOAT" },
};

function mapType(duckType: string, dialect: Dialect, varcharSizing: VarcharSizing, maxLength?: number): string {
  const upper = duckType.toUpperCase();
  const map = TYPE_MAP[dialect];

  if (upper.includes("VARCHAR") && maxLength !== undefined && varcharSizing !== "text") {
    let size: number;
    switch (varcharSizing) {
      case "exact": size = maxLength; break;
      case "plus20": size = Math.ceil(maxLength * 1.2); break;
      case "plus50": size = Math.ceil(maxLength * 1.5); break;
      case "fixed255": size = 255; break;
      default: size = maxLength;
    }
    if (dialect === "postgresql") return `VARCHAR(${size})`;
    if (dialect === "mysql") return `VARCHAR(${size})`;
    if (dialect === "sqlserver") return `NVARCHAR(${size})`;
    if (dialect === "snowflake") return `VARCHAR(${size})`;
    if (dialect === "bigquery") return "STRING";
    if (dialect === "sqlite") return "TEXT";
    if (dialect === "duckdb") return `VARCHAR(${size})`;
  }

  for (const [key, val] of Object.entries(map)) {
    if (upper.includes(key)) return val;
  }
  return map.VARCHAR || "TEXT";
}

function generateDDL(tableName: string, cols: ColSchema[], dialect: Dialect, prefix: string, addComments: boolean, notNullComplete: boolean): string {
  const quote = dialect === "bigquery" ? "`" : '"';
  const fullName = prefix ? `${prefix}.${tableName}` : tableName;
  const lines = cols.map((c) => {
    const nullable = notNullComplete && !c.nullable ? " NOT NULL" : (c.nullable ? "" : " NOT NULL");
    const comment = addComments && c.sampleValue ? ` -- e.g. ${c.sampleValue}` : "";
    return `  ${quote}${c.name}${quote} ${c.mappedType}${nullable}${comment}`;
  });
  const prefixStr = dialect === "bigquery" ? `CREATE TABLE \`${fullName}\`` : `CREATE TABLE ${quote}${fullName}${quote}`;
  return `${prefixStr} (\n${lines.join(",\n")}\n);`;
}

export default function SchemaPage() {
  const { db } = useDuckDB();
  const { addFile } = useFileStore();
  useAutoLoadFile(handleFile, !!db);
  const [file, setFile] = useState<File | null>(null);
  const [storedFileId, setStoredFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState<ColSchema[]>([]);
  const [tableName, setTableName] = useState("my_table");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [schemaPrefix, setSchemaPrefix] = useState("");
  const [addComments, setAddComments] = useState(false);
  const [notNullComplete, setNotNullComplete] = useState(false);
  const [varcharSizing, setVarcharSizing] = useState<VarcharSizing>("text");

  async function handleFile(f: File) {
    if (!db) return;
    const stored = addFile(f);
    setStoredFileId(stored.id);
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);

      const schemas: ColSchema[] = [];
      for (let i = 0; i < info.columns.length; i++) {
        const nullRes = await runQuery(db, `SELECT COUNT(*) FROM "${tName}" WHERE "${info.columns[i]}" IS NULL`);
        const hasNulls = Number(nullRes.rows[0][0]) > 0;
        let sampleValue: string | undefined;
        let maxLength: number | undefined;
        try {
          const sampleRes = await runQuery(db, `SELECT "${info.columns[i]}"::VARCHAR FROM "${tName}" WHERE "${info.columns[i]}" IS NOT NULL LIMIT 1`);
          sampleValue = sampleRes.rows[0]?.[0] ? String(sampleRes.rows[0][0]) : undefined;
        } catch {}
        // Get max length for VARCHAR columns
        if (info.types[i].toUpperCase().includes("VARCHAR")) {
          try {
            const lenRes = await runQuery(db, `SELECT MAX(LENGTH("${info.columns[i]}"::VARCHAR)) FROM "${tName}" WHERE "${info.columns[i]}" IS NOT NULL`);
            maxLength = Number(lenRes.rows[0]?.[0] ?? 0);
          } catch {}
        }
        schemas.push({
          name: info.columns[i],
          detectedType: info.types[i],
          mappedType: mapType(info.types[i], dialect, varcharSizing, maxLength),
          nullable: hasNulls,
          sampleValue,
          maxLength,
        });
      }
      setCols(schemas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to infer schema");
    } finally {
      setLoading(false);
    }
  }

  function updateMappedTypes(newDialect: Dialect) {
    setDialect(newDialect);
    setCols((prev) => prev.map((c) => ({ ...c, mappedType: mapType(c.detectedType, newDialect, varcharSizing, c.maxLength) })));
  }

  function updateVarcharSizing(newSizing: VarcharSizing) {
    setVarcharSizing(newSizing);
    setCols((prev) => prev.map((c) => ({ ...c, mappedType: mapType(c.detectedType, dialect, newSizing, c.maxLength) })));
  }

  function updateColType(index: number, newType: string) {
    setCols((prev) => prev.map((c, i) => i === index ? { ...c, mappedType: newType } : c));
  }

  const ddl = cols.length > 0 ? generateDDL(tableName, cols, dialect, schemaPrefix, addComments, notNullComplete) : "";

  // Generate all dialects for multi-tab view
  const allDialectDDLs = cols.length > 0
    ? dialects.map(d => ({
        ...d,
        ddl: generateDDL(tableName, cols.map(c => ({ ...c, mappedType: mapType(c.detectedType, d.id, varcharSizing, c.maxLength) })), d.id, schemaPrefix, addComments, notNullComplete),
      }))
    : [];

  function handleCopy(text?: string) {
    navigator.clipboard.writeText(text ?? ddl);
    toast({ title: "DDL copied to clipboard" });
  }

  return (
    <ToolPage icon={Database} title="Schema Generator" description="Infer schemas and generate DDL for Postgres, MySQL, BigQuery and more."
      pageTitle="Schema Generator — Infer DDL Online | Anatini.dev" metaDescription={getToolMetaDescription("schema-generator")} seoContent={getToolSeo("schema-generator")}>
      <div className="space-y-6">
        {!file && (
          <DropZone
            accept={[".csv", ".parquet", ".json"]}
            onFile={handleFile}
            label="Drop a file to infer schema"
            sampleAction={{ label: "⚗ Try with sample data", onClick: () => handleFile(getSampleSchemaCSV()) }}
          />
        )}
        {loading && <LoadingState message="Inferring schema..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {file && cols.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileInfo name={file.name} size={formatBytes(file.size)} columns={cols.length} />
                {storedFileId && <InspectLink fileId={storedFileId} format={file.name.endsWith('.json') ? 'json' : file.name.endsWith('.parquet') ? 'parquet' : 'csv'} />}
              </div>
              <Button variant="outline" onClick={() => { setFile(null); setCols([]); setStoredFileId(null); }}>New file</Button>
            </div>

            {/* Dialect toggle */}
            <ToggleButton
              options={dialects.map(d => ({ label: d.label, value: d.id }))}
              value={dialect}
              onChange={updateMappedTypes}
            />

            <Tabs defaultValue="schema">
              <TabsList>
                <TabsTrigger value="schema">Column Mapping</TabsTrigger>
                <TabsTrigger value="ddl">DDL Output</TabsTrigger>
                <TabsTrigger value="all-dialects">All Dialects</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="schema" className="pt-4">
                <div className="overflow-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Column</th>
                        <th className="px-3 py-2 text-left font-medium">Detected</th>
                        <th className="px-3 py-2 text-left font-medium">Mapped ({dialect})</th>
                        <th className="px-3 py-2 text-left font-medium">Nullable</th>
                        <th className="px-3 py-2 text-left font-medium">Max Len</th>
                        <th className="px-3 py-2 text-left font-medium">Sample</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cols.map((c, idx) => (
                        <tr key={c.name} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono text-xs">{c.name}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{c.detectedType}</td>
                          <td className="px-3 py-1.5">
                            <input
                              value={c.mappedType}
                              onChange={(e) => updateColType(idx, e.target.value)}
                              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs text-primary hover:border-border focus:border-primary focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-xs">{c.nullable ? "YES" : "NO"}</td>
                          <td className="px-3 py-1.5 text-xs font-mono text-muted-foreground">{c.maxLength ?? "—"}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={c.sampleValue}>{c.sampleValue ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="ddl" className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Generated DDL ({dialect})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy()}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadBlob(ddl, `${tableName}.sql`, "text/sql")}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <pre className="rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground overflow-auto">{ddl}</pre>
              </TabsContent>

              <TabsContent value="all-dialects" className="pt-4 space-y-4">
                {allDialectDDLs.map((d) => (
                  <div key={d.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">{d.label}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(d.ddl)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="rounded border border-border bg-card p-3 font-mono text-xs text-foreground overflow-auto max-h-[200px]">{d.ddl}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="settings" className="pt-4 space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Schema prefix:</label>
                      <input
                        value={schemaPrefix}
                        onChange={(e) => setSchemaPrefix(e.target.value)}
                        placeholder="public"
                        className="w-28 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Table name:</label>
                      <input
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">VARCHAR sizing:</label>
                    <select value={varcharSizing} onChange={(e) => updateVarcharSizing(e.target.value as VarcharSizing)} className="border border-border bg-background px-2 py-1 text-xs">
                      <option value="text">TEXT (no size)</option>
                      <option value="exact">Exact max</option>
                      <option value="plus20">Max + 20%</option>
                      <option value="plus50">Max + 50%</option>
                      <option value="fixed255">Fixed 255</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={addComments} onChange={(e) => setAddComments(e.target.checked)} className="rounded" />
                    Add sample value comments in DDL
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={notNullComplete} onChange={(e) => setNotNullComplete(e.target.checked)} className="rounded" />
                    NOT NULL on 100% complete columns
                  </label>
                </div>
              </TabsContent>
            </Tabs>

            <CrossToolLinks format={file.name.endsWith('.json') ? 'json' : file.name.endsWith('.parquet') ? 'parquet' : 'csv'} fileId={storedFileId ?? undefined} excludeRoute="/schema-generator" />
          </>
        )}
      </div>
    </ToolPage>
  );
}

const dialects: { id: Dialect; label: string }[] = [
  { id: "postgresql", label: "Postgres" },
  { id: "mysql", label: "MySQL" },
  { id: "sqlite", label: "SQLite" },
  { id: "sqlserver", label: "SQL Server" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "duckdb", label: "DuckDB" },
];
