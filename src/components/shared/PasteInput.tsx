import { useState } from "react";
import { ClipboardPaste, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PasteInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  label?: string;
  accept?: string[];
  onFile?: (file: File) => void;
}

export function PasteInput({ onSubmit, placeholder = "Paste data here...", label = "Or paste data directly", accept, onFile }: PasteInputProps) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</h3>
        {onFile && (
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              if (accept) input.accept = accept.join(",");
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) onFile(f);
              };
              input.click();
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-3 w-3" /> Upload file instead
          </button>
        )}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[160px] font-mono text-xs border-2"
      />
      <Button
        size="sm"
        onClick={() => { if (text.trim()) onSubmit(text.trim()); }}
        disabled={!text.trim()}
      >
        <ClipboardPaste className="h-4 w-4 mr-1" /> Process pasted data
      </Button>
    </div>
  );
}
