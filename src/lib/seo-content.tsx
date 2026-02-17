import { SeoFaq } from "@/components/shared/SeoFaq";
import { metaDescriptions } from "@/lib/seo/meta-descriptions";
import type { ToolSeoData } from "@/lib/seo/types";

// Re-export for backward compatibility
export { metaDescriptions } from "@/lib/seo/meta-descriptions";
export type { ToolSeoData } from "@/lib/seo/types";

/** Synchronous meta description lookup (lightweight, always in bundle) */
export function getToolMetaDescription(toolId: string): string | undefined {
  return metaDescriptions[toolId];
}

/**
 * Synchronous SEO content loader — returns null.
 * Tool pages should use the useToolSeo() hook for lazy-loaded SEO content.
 * This function is kept for backward compatibility but always returns null
 * to avoid bundling all SEO content.
 * @deprecated Use useToolSeo() hook instead
 */
export function getToolSeo(_toolId: string) {
  return null;
}
