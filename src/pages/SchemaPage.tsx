import { useState } from "react";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Database, Copy, Download, FlaskConical } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName, downloadBlob } from "@/lib/duckdb-helpers";
import { getSampleSchemaCSV } from "@/lib/sample-data";
import { toast } from "@/hooks/use-toast";

type Dialect = "postgresql" | "mysql" | "sqlite" | "sqlserver" | "bigquery" | "snowflake" | "duckdb";

interface ColSchema {
  name: string;
  detectedType: string;
  mappedType: string;
  nullable: boolean;
  sampleValue?: string;
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

function mapType(duckType: string, dialect: Dialect): string {
  const upper = duckType.toUpperCase();
  const map = TYPE_MAP[dialect];
  for (const [key, val] of Object.entries(map)) {
    if (upper.includes(key)) return val;
  }
  return map.VARCHAR || "TEXT";
}

function generateDDL(tableName: string, cols: ColSchema[], dialect: Dialect, prefix: string, addComments: boolean): string {
  const quote = dialect === "bigquery" ? "`" : '"';
  const fullName = prefix ? `${prefix}.${tableName}` : tableName;
  const lines = cols.map((c) => {
    const nullable = c.nullable ? "" : " NOT NULL";
    const comment = addComments && c.sampleValue ? ` -- e.g. ${c.sampleValue}` : "";
    return `  ${quote}${c.name}${quote} ${c.mappedType}${nullable}${comment}`;
  });
  const prefixStr = dialect === "bigquery" ? `CREATE TABLE \`${fullName}\`` : `CREATE TABLE ${quote}${fullName}${quote}`;
  return `${prefixStr} (\n${lines.join(",\n")}\n);`;
}

export default function SchemaPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState<ColSchema[]>([]);
  const [tableName, setTableName] = useState("my_table");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [schemaPrefix, setSchemaPrefix] = useState("");
  const [addComments, setAddComments] = useState(false);

  async function handleFile(f: File) {
    if (!db) return;
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
        try {
          const sampleRes = await runQuery(db, `SELECT "${info.columns[i]}"::VARCHAR FROM "${tName}" WHERE "${info.columns[i]}" IS NOT NULL LIMIT 1`);
          sampleValue = sampleRes.rows[0]?.[0] ? String(sampleRes.rows[0][0]) : undefined;
        } catch {}
        schemas.push({
          name: info.columns[i],
          detectedType: info.types[i],
          mappedType: mapType(info.types[i], dialect),
          nullable: hasNulls,
          sampleValue,
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
    setCols((prev) => prev.map((c) => ({ ...c, mappedType: mapType(c.detectedType, newDialect) })));
  }

  function updateColType(index: number, newType: string) {
    setCols((prev) => prev.map((c, i) => i === index ? { ...c, mappedType: newType } : c));
  }

  const ddl = cols.length > 0 ? generateDDL(tableName, cols, dialect, schemaPrefix, addComments) : "";

  function handleCopy() {
    navigator.clipboard.writeText(ddl);
    toast({ title: "DDL copied to clipboard" });
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

  return (
    <ToolPage icon={Database} title="Schema Generator" description="Infer schemas and generate DDL for Postgres, MySQL, BigQuery and more."
      pageTitle="Schema Generator — Infer DDL Online | Anatini.dev" metaDescription={getToolMetaDescription("schema-generator")} seoContent={getToolSeo("schema-generator")}>
      <div className="space-y-6">
        {!file && (
          <div className="space-y-3">
            <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Drop a file to infer schema" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleFile(getSampleSchemaCSV())}>
                <FlaskConical className="h-4 w-4 mr-1" /> Try with sample data
              </Button>
            </div>
          </div>
        )}
        {loading && <LoadingState message="Inferring schema..." />}
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {file && cols.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FileInfo name={file.name} size={formatBytes(file.size)} columns={cols.length} />
              <Button variant="outline" onClick={() => { setFile(null); setCols([]); }}>New file</Button>
            </div>

            {/* Dialect toggle */}
            <div className="flex flex-wrap gap-2">
              {dialects.map((d) => (
                <button key={d.id} onClick={() => updateMappedTypes(d.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${dialect === d.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                  {d.label}
                </button>
              ))}
            </div>

            <Tabs defaultValue="schema">
              <TabsList>
                <TabsTrigger value="schema">Column Mapping</TabsTrigger>
                <TabsTrigger value="ddl">DDL Output</TabsTrigger>
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
                          <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={c.sampleValue}>{c.sampleValue ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="ddl" className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Generated DDL</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadBlob(ddl, `${tableName}.sql`, "text/sql")}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <pre className="rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground overflow-auto">{ddl}</pre>
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
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={addComments} onChange={(e) => setAddComments(e.target.checked)} className="rounded" />
                    Add sample value comments in DDL
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ToolPage>
  );
}
