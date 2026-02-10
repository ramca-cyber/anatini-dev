import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { sanitizeTableName } from "@/lib/duckdb-helpers";

export interface StoredFile {
  id: string;
  file: File;
  name: string;
  size: number;
  format: "csv" | "json" | "parquet" | "excel";
  tableName: string;
  loadedAt: number;
}

interface FileStoreContextValue {
  files: StoredFile[];
  addFile: (file: File) => StoredFile;
  getFile: (id: string) => StoredFile | undefined;
  getLatestByFormat: (format: StoredFile["format"]) => StoredFile | undefined;
  removeFile: (id: string) => void;
  clearAll: () => void;
}

const FileStoreContext = createContext<FileStoreContextValue | null>(null);

function detectFormat(file: File): StoredFile["format"] {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["csv", "tsv", "txt"].includes(ext)) return "csv";
  if (["json", "ndjson", "jsonl"].includes(ext)) return "json";
  if (["parquet", "pq"].includes(ext)) return "parquet";
  if (["xlsx", "xls"].includes(ext)) return "excel";
  if (file.type.includes("csv") || file.type.includes("tab-separated")) return "csv";
  if (file.type.includes("json")) return "json";
  if (file.type.includes("spreadsheet") || file.type.includes("excel")) return "excel";
  return "csv";
}

export function FileStoreProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<StoredFile[]>([]);

  const addFile = useCallback((file: File): StoredFile => {
    const storedFile: StoredFile = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      format: detectFormat(file),
      tableName: sanitizeTableName(file.name),
      loadedAt: Date.now(),
    };
    setFiles((prev) => [...prev, storedFile]);
    return storedFile;
  }, []);

  const getFile = useCallback(
    (id: string) => files.find((f) => f.id === id),
    [files]
  );

  const getLatestByFormat = useCallback(
    (format: StoredFile["format"]) =>
      [...files].filter((f) => f.format === format).sort((a, b) => b.loadedAt - a.loadedAt)[0],
    [files]
  );

  const removeFile = useCallback(
    (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id)),
    []
  );

  const clearAll = useCallback(() => setFiles([]), []);

  return (
    <FileStoreContext.Provider value={{ files, addFile, getFile, getLatestByFormat, removeFile, clearAll }}>
      {children}
    </FileStoreContext.Provider>
  );
}

export function useFileStore() {
  const ctx = useContext(FileStoreContext);
  if (!ctx) throw new Error("useFileStore must be used within FileStoreProvider");
  return ctx;
}
