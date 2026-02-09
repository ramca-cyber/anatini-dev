import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface ToolPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolPage({ icon: Icon, title, description, children }: ToolPageProps) {
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center gap-3">
        <Icon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
