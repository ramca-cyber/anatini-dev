import { type ReactNode, useEffect } from "react";
import { type LucideIcon, Lock } from "lucide-react";

interface ToolPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  pageTitle?: string;
  children: ReactNode;
  seoContent?: ReactNode;
}

export function ToolPage({ icon: Icon, title, description, pageTitle, children, seoContent }: ToolPageProps) {
  useEffect(() => {
    const prev = document.title;
    document.title = pageTitle ?? `${title} — Free, Offline | Anatini.dev`;
    return () => { document.title = prev; };
  }, [title, pageTitle]);

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center gap-3">
        <Icon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground sm:flex">
          <Lock className="h-3 w-3" />
          <span>Your data never leaves your browser</span>
        </div>
      </div>
      {children}
      {seoContent && <div className="mt-12">{seoContent}</div>}
    </div>
  );
}
