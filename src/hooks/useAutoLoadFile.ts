import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useFileStore } from "@/contexts/FileStoreContext";

export function useAutoLoadFile(
  onFile: (file: File) => void,
  ready: boolean = true
) {
  const [searchParams] = useSearchParams();
  const { getFile } = useFileStore();
  const loaded = useRef(false);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    if (loaded.current || !ready) return;
    const fileId = searchParams.get("fileId");
    if (fileId) {
      const stored = getFile(fileId);
      if (stored) {
        loaded.current = true;
        onFileRef.current(stored.file);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
