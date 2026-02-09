import { useState } from "react";
import { Database, Copy, Download } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DropZone } from "@/components/shared/DropZone";
import { FileInfo, LoadingState } from "@/components/shared/FileInfo";
import { Button } from "@/components/ui/button";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { registerFile, runQuery, formatBytes, sanitizeTableName, downloadBlob } from "@/lib/duckdb-helpers";
import { toast } from "@/hooks/use-toast";

type Dialect = "postgresql" | "mysql" | "bigquery" | "snowflake" | "duckdb";

interface ColSchema {
  name: string;
  detectedType: string;
  nullable: boolean;
}

const TYPE_MAP: Record<Dialect, Record<string, string>> = {
  postgresql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INTEGER", DOUBLE: "DOUBLE PRECISION", BOOLEAN: "BOOLEAN", DATE: "DATE", TIMESTAMP: "TIMESTAMP", FLOAT: "REAL" },
  mysql: { VARCHAR: "TEXT", BIGINT: "BIGINT", INTEGER: "INT", DOUBLE: "DOUBLE", BOOLEAN: "TINYINT(1)", DATE: "DATE", TIMESTAMP: "DATETIME", FLOAT: "FLOAT" },
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

function generateDDL(tableName: string, cols: ColSchema[], dialect: Dialect): string {
  const quote = dialect === "bigquery" ? "`" : '"';
  const lines = cols.map((c) => {
    const mapped = mapType(c.detectedType, dialect);
    const nullable = c.nullable ? "" : " NOT NULL";
    return `  ${quote}${c.name}${quote} ${mapped}${nullable}`;
  });
  const prefix = dialect === "bigquery" ? `CREATE TABLE \`${tableName}\`` : `CREATE TABLE ${quote}${tableName}${quote}`;
  return `${prefix} (\n${lines.join(",\n")}\n);`;
}

export default function SchemaPage() {
  const { db } = useDuckDB();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState<ColSchema[]>([]);
  const [tableName, setTableName] = useState("my_table");
  const [dialect, setDialect] = useState<Dialect>("postgresql");

  async function handleFile(f: File) {
    if (!db) return;
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const tName = sanitizeTableName(f.name);
      setTableName(tName);
      const info = await registerFile(db, f, tName);

      // Check nullability
      const schemas: ColSchema[] = [];
      for (let i = 0; i < info.columns.length; i++) {
        const nullRes = await runQuery(db, `SELECT COUNT(*) FROM "${tName}" WHERE "${info.columns[i]}" IS NULL`);
        const hasNulls = Number(nullRes.rows[0][0]) > 0;
        schemas.push({ name: info.columns[i], detectedType: info.types[i], nullable: hasNulls });
      }
      setCols(schemas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to infer schema");
    } finally {
      setLoading(false);
    }
  }

  const ddl = cols.length > 0 ? generateDDL(tableName, cols, dialect) : "";

  function handleCopy() {
    navigator.clipboard.writeText(ddl);
    toast({ title: "DDL copied to clipboard" });
  }

  const dialects: { id: Dialect; label: string }[] = [
    { id: "postgresql", label: "Postgres" },
    { id: "mysql", label: "MySQL" },
    { id: "bigquery", label: "BigQuery" },
    { id: "snowflake", label: "Snowflake" },
    { id: "duckdb", label: "DuckDB" },
  ];

  return (
    <ToolPage icon={Database} title="Schema Generator" description="Infer schemas and generate DDL for Postgres, MySQL, BigQuery and more.">
      <div className="space-y-6">
        {!file && <DropZone accept={[".csv", ".parquet", ".json"]} onFile={handleFile} label="Drop a file to infer schema" />}
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
                <button
                  key={d.id}
                  onClick={() => setDialect(d.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    dialect === d.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Table name */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Table name:</label>
              <input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Schema table */}
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Column</th>
                    <th className="px-3 py-2 text-left font-medium">Detected</th>
                    <th className="px-3 py-2 text-left font-medium">Mapped ({dialect})</th>
                    <th className="px-3 py-2 text-left font-medium">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map((c) => (
                    <tr key={c.name} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-1.5 font-mono text-xs">{c.name}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{c.detectedType}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-primary">{mapType(c.detectedType, dialect)}</td>
                      <td className="px-3 py-1.5 text-xs">{c.nullable ? "YES" : "NO"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DDL */}
            <div className="space-y-2">
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
            </div>
          </>
        )}
      </div>
    </ToolPage>
  );
}
