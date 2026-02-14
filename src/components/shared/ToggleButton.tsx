import { cn } from "@/lib/utils";

interface ToggleButtonProps {
  options: { label: string; value: string }[];
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  className?: string;
}

export function ToggleButton({ options, value, onChange, className }: ToggleButtonProps) {
  return (
    <div className={cn("flex gap-1", className)} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
          className={cn(
            "px-3 py-1 text-xs font-bold border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value === opt.value
              ? "bg-foreground text-background"
              : "bg-background text-foreground hover:bg-secondary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
