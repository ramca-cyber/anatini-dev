import * as duckdb from "@duckdb/duckdb-wasm";

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

export async function registerFile(
  db: duckdb.AsyncDuckDB,
  file: File,
  tableName: string
): Promise<{ columns: string[]; rowCount: number; types: string[] }> {
  await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

  const ext = file.name.split(".").pop()?.toLowerCase();
  const conn = await db.connect();
  try {
    if (ext === "csv") {
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${file.name}')`);
    } else if (ext === "parquet") {
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_parquet('${file.name}')`);
    } else if (ext === "json" || ext === "jsonl") {
      await conn.query(`CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${file.name}')`);
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

export async function exportToCSV(db: duckdb.AsyncDuckDB, sql: string): Promise<string> {
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    let csv = columns.join(",") + "\n";
    for (let i = 0; i < result.numRows; i++) {
      const row: string[] = [];
      for (let j = 0; j < columns.length; j++) {
        const val = result.getChildAt(j)?.get(i);
        const str = val === null || val === undefined ? "" : String(val);
        row.push(str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str);
      }
      csv += row.join(",") + "\n";
    }
    return csv;
  } finally {
    await conn.close();
  }
}

export async function exportToParquet(db: duckdb.AsyncDuckDB, tableName: string): Promise<Uint8Array> {
  const conn = await db.connect();
  try {
    const outName = `${tableName}_export.parquet`;
    await conn.query(`COPY "${tableName}" TO '${outName}' (FORMAT PARQUET)`);
    const buf = await db.copyFileToBuffer(outName);
    return buf;
  } finally {
    await conn.close();
  }
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
