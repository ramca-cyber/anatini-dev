import { type ReactNode } from "react";
import { type LucideIcon, Lock, ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";

interface ToolPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  pageTitle?: string;
  metaDescription?: string;
  children: ReactNode;
  seoContent?: ReactNode;
}

export function ToolPage({ icon: Icon, title, description, pageTitle, metaDescription, children, seoContent }: ToolPageProps) {
  const fullTitle = pageTitle ?? `${title} — Free, Offline | Anatini.dev`;
  const fullDescription = metaDescription ?? description;

  return (
    <div className="container py-8">
      <PageMeta title={fullTitle} description={fullDescription} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" /> Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anatini.dev/" },
            { "@type": "ListItem", "position": 2, "name": title },
          ],
        }) }}
      />

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
