import * as duckdb from "@duckdb/duckdb-wasm";
import { toast } from "@/hooks/use-toast";

const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50 MB

export function warnLargeFile(file: File): void {
  if (file.size > LARGE_FILE_THRESHOLD) {
    toast({
      title: "Large file detected",
      description: `This file is ${formatBytes(file.size)}. Large files may cause browser slowdowns or crashes.`,
      variant: "destructive",
    });
  }
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  types: string[];
}

export async function runQuery(db: duckdb.AsyncDuckDB, sql: string): Promise<QueryResult> {
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    const types = result.schema.fields.map((f) => f.type.toString());
    const rows: any[][] = [];
    for (let i = 0; i < result.numRows; i++) {
      const row: any[] = [];
      for (let j = 0; j < columns.length; j++) {
        const col = result.getChildAt(j);
        row.push(col?.get(i));
      }
      rows.push(row);
    }
    return { columns, rows, rowCount: result.numRows, types };
  } finally {
    await conn.close();
  }
}

export interface CsvParseOptions {
  delimiter?: string;
  header?: boolean;
}

export async function registerFile(
  db: duckdb.AsyncDuckDB,
  file: File,
  tableName: string,
  csvOptions?: CsvParseOptions
): Promise<{ columns: string[]; rowCount: number; types: string[] }> {
  await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

  const safeName = file.name.replace(/'/g, "''");
  const ext = file.name.split(".").pop()?.toLowerCase();
  const conn = await db.connect();
  try {
    if (ext === "csv" || ext === "tsv") {
      const opts: string[] = [];
      if (csvOptions?.delimiter && csvOptions.delimiter !== ",") {
        opts.push(`delim='${csvOptions.delimiter}'`);
      }
      if (csvOptions?.header === false) {
        opts.push("header=false");
      }
      const optStr = opts.length > 0 ? `, ${opts.join(", ")}` : "";
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${safeName}'${optStr})`);
    } else if (ext === "parquet") {
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_parquet('${safeName}')`);
    } else if (ext === "json" || ext === "jsonl") {
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${safeName}')`);
    } else {
      throw new Error(`Unsupported file type: .${ext}`);
    }

    const countResult = await conn.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    const rowCount = Number(countResult.getChildAt(0)?.get(0) ?? 0);

    const schemaResult = await conn.query(`DESCRIBE "${tableName}"`);
    const columns: string[] = [];
    const types: string[] = [];
    const nameCol = schemaResult.getChildAt(0);
    const typeCol = schemaResult.getChildAt(1);
    for (let i = 0; i < schemaResult.numRows; i++) {
      columns.push(String(nameCol?.get(i)));
      types.push(String(typeCol?.get(i)));
    }

    return { columns, rowCount, types };
  } finally {
    await conn.close();
  }
}

export async function exportToCSV(db: duckdb.AsyncDuckDB, sql: string, options?: { delimiter?: string; header?: boolean; nullValue?: string }): Promise<string> {
  const delim = options?.delimiter ?? ",";
  const includeHeader = options?.header !== false;
  const nullVal = options?.nullValue ?? "";
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    let csv = "";
    if (includeHeader) {
      csv = columns.map(c => c.includes(delim) || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c).join(delim) + "\n";
    }
    for (let i = 0; i < result.numRows; i++) {
      const row: string[] = [];
      for (let j = 0; j < columns.length; j++) {
        const val = result.getChildAt(j)?.get(i);
        const str = val === null || val === undefined ? nullVal : String(val);
        row.push(str.includes(delim) || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str);
      }
      csv += row.join(delim) + "\n";
    }
    return csv;
  } finally {
    await conn.close();
  }
}

export async function exportToParquet(db: duckdb.AsyncDuckDB, tableName: string, options?: { compression?: string; rowGroupSize?: number | null }): Promise<Uint8Array> {
  const conn = await db.connect();
  try {
    const outName = `${tableName}_export.parquet`;
    const parts = ["FORMAT PARQUET"];
    if (options?.compression && options.compression !== "snappy") {
      parts.push(`COMPRESSION '${options.compression.toUpperCase()}'`);
    }
    if (options?.rowGroupSize) {
      parts.push(`ROW_GROUP_SIZE ${options.rowGroupSize}`);
    }
    await conn.query(`COPY "${tableName}" TO '${outName}' (${parts.join(", ")})`);
    const buf = await db.copyFileToBuffer(outName);
    return buf;
  } finally {
    await conn.close();
  }
}

export async function exportQueryToJSON(db: duckdb.AsyncDuckDB, sql: string): Promise<string> {
  const result = await runQuery(db, sql);
  const records = result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
  return JSON.stringify(records, bigIntReplacer, 2);
}

export function downloadBlob(data: string | ArrayBuffer | Uint8Array, filename: string, mimeType: string) {
  const blobData = data instanceof Uint8Array ? new Blob([new Uint8Array(data)], { type: mimeType }) : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blobData);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const bigIntReplacer = (_key: string, value: unknown) =>
  typeof value === "bigint" ? Number(value) : value;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function sanitizeTableName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
}
