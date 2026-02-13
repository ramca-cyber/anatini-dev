import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { FileStoreProvider, useFileStore } from "@/contexts/FileStoreContext";
import { useEffect, useState } from "react";

function TestConsumer({ onStore }: { onStore: (store: ReturnType<typeof useFileStore>) => void }) {
  const store = useFileStore();
  const [called, setCalled] = useState(false);
  useEffect(() => {
    if (!called) {
      onStore(store);
      setCalled(true);
    }
  }, [store, onStore, called]);
  return null;
}

function renderWithStore(callback: (store: ReturnType<typeof useFileStore>) => void) {
  return render(
    <FileStoreProvider>
      <TestConsumer onStore={callback} />
    </FileStoreProvider>
  );
}

describe("FileStoreContext", () => {
  it("starts with no files", () => {
    let captured: ReturnType<typeof useFileStore> | null = null;
    renderWithStore((store) => { captured = store; });
    expect(captured!.files).toHaveLength(0);
  });

  it("adds a CSV file and detects format", () => {
    let result: any = null;
    renderWithStore((store) => {
      result = store.addFile(new File(["a,b\n1,2"], "test.csv", { type: "text/csv" }));
    });
    expect(result).toBeDefined();
    expect(result.format).toBe("csv");
    expect(result.name).toBe("test.csv");
    expect(result.id).toBeTruthy();
  });

  it("adds a JSON file and detects format", () => {
    let result: any = null;
    renderWithStore((store) => {
      result = store.addFile(new File(['[{"a":1}]'], "data.json", { type: "application/json" }));
    });
    expect(result.format).toBe("json");
  });

  it("adds a Parquet file and detects format", () => {
    let result: any = null;
    renderWithStore((store) => {
      result = store.addFile(new File([new Uint8Array(10)], "data.parquet"));
    });
    expect(result.format).toBe("parquet");
  });

  it("adds an Excel file and detects format", () => {
    let result: any = null;
    renderWithStore((store) => {
      result = store.addFile(new File([new Uint8Array(10)], "report.xlsx"));
    });
    expect(result.format).toBe("excel");
  });

  it("generates a sanitized table name", () => {
    let result: any = null;
    renderWithStore((store) => {
      result = store.addFile(new File(["data"], "my-data (1).csv"));
    });
    expect(result.tableName).toBe("my_data__1_");
  });
});
