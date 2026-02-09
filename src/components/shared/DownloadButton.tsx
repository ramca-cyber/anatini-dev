import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
  fileSize?: string;
  disabled?: boolean;
}

export function DownloadButton({ onClick, label = "Download", fileSize, disabled }: DownloadButtonProps) {
  const [done, setDone] = useState(false);

  const handleClick = () => {
    onClick();
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <Button onClick={handleClick} disabled={disabled || done} variant={done ? "secondary" : "default"}>
      {done ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label}
          {fileSize && <span className="text-xs opacity-70">({fileSize})</span>}
        </>
      )}
    </Button>
  );
}
