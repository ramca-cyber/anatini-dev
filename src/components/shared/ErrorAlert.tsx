import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div className={`flex items-start gap-2 border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive ${className ?? ""}`}>
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
