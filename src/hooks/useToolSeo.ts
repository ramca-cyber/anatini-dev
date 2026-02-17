import { useState, useEffect, type ReactNode, createElement } from "react";
import { metaDescriptions } from "@/lib/seo/meta-descriptions";
import { SeoFaq } from "@/components/shared/SeoFaq";
import type { ToolSeoData } from "@/lib/seo/types";

interface UseToolSeoResult {
  seoContent: ReactNode | null;
  metaDescription: string | undefined;
  loading: boolean;
}

const cache = new Map<string, ToolSeoData>();

export function useToolSeo(toolId: string): UseToolSeoResult {
  const [data, setData] = useState<ToolSeoData | null>(cache.get(toolId) ?? null);
  const [loading, setLoading] = useState(!cache.has(toolId));

  useEffect(() => {
    if (cache.has(toolId)) {
      setData(cache.get(toolId)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    import(`../lib/seo/${toolId}.ts`)
      .then((mod) => {
        if (cancelled) return;
        const seoData: ToolSeoData = mod.default;
        cache.set(toolId, seoData);
        setData(seoData);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [toolId]);

  const seoContent = data
    ? createElement(SeoFaq, { whatIs: data.whatIs, howToUse: data.howToUse, faqs: data.faqs })
    : null;

  return {
    seoContent,
    metaDescription: metaDescriptions[toolId],
    loading,
  };
}
