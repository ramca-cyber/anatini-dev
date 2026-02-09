import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";

interface DuckDBContextValue {
  db: duckdb.AsyncDuckDB | null;
  loading: boolean;
  error: string | null;
}

const DuckDBContext = createContext<DuckDBContextValue>({
  db: null,
  loading: true,
  error: null,
});

export function useDuckDB() {
  return useContext(DuckDBContext);
}

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" })
        );

        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        const instance = new duckdb.AsyncDuckDB(logger, worker);
        await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);

        URL.revokeObjectURL(worker_url);
        setDb(instance);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize DuckDB");
        console.error("DuckDB init error:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  return (
    <DuckDBContext.Provider value={{ db, loading, error }}>
      {children}
    </DuckDBContext.Provider>
  );
}
