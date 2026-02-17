import { type ReactNode } from "react";
import { type LucideIcon, Lock, ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { useToolSeo } from "@/hooks/useToolSeo";

interface ToolPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  pageTitle?: string;
  metaDescription?: string;
  children: ReactNode;
  seoContent?: ReactNode;
  toolId?: string;
}

export function ToolPage({ icon: Icon, title, description, pageTitle, metaDescription, children, seoContent, toolId }: ToolPageProps) {
  const { pathname } = useLocation();
  const derivedToolId = toolId ?? pathname.replace(/^\//, "");
  const lazy = useToolSeo(derivedToolId);
  const resolvedSeoContent = seoContent || lazy.seoContent;
  const resolvedMeta = metaDescription || lazy.metaDescription;

  const fullTitle = pageTitle ?? `${title} — Free, Offline | Anatini.dev`;
  const fullDescription = resolvedMeta ?? description;

  // SoftwareApplication JSON-LD for each tool
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `${title} — Anatini.dev`,
    "description": fullDescription,
    "url": `https://anatini.dev${window.location.pathname}`,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any (browser-based)",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "isAccessibleForFree": true,
    "browserRequirements": "Requires a modern web browser with WebAssembly support",
  };

  return (
    <div className="container py-8">
      <PageMeta title={fullTitle} description={fullDescription} />

      {/* SoftwareApplication JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />

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
        <div className="ml-auto hidden items-center gap-1.5 border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground sm:flex">
          <Lock className="h-3 w-3" />
          <span>Your data never leaves your browser</span>
        </div>
      </div>
      {children}
      {resolvedSeoContent && <aside aria-label="Learn more" className="mt-12">{resolvedSeoContent}</aside>}
    </div>
  );
}
