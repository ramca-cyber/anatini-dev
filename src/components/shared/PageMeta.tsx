import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMetaProps {
  title: string;
  description: string;
}

export function PageMeta({ title, description }: PageMetaProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const prev = document.title;
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = metaDesc?.content;
    if (metaDesc) metaDesc.content = description;

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const prevCanonical = canonical?.href;
    if (canonical) canonical.href = `https://anatini.dev${pathname}`;

    // OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    const prevOgTitle = ogTitle?.content;
    if (ogTitle) ogTitle.content = title;

    const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    const prevOgDesc = ogDesc?.content;
    if (ogDesc) ogDesc.content = description;

    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    const prevOgUrl = ogUrl?.content;
    if (ogUrl) ogUrl.content = `https://anatini.dev${pathname}`;

    // Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null;
    const prevTwTitle = twTitle?.content;
    if (twTitle) twTitle.content = title;

    const twDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement | null;
    const prevTwDesc = twDesc?.content;
    if (twDesc) twDesc.content = description;

    return () => {
      document.title = prev;
      if (metaDesc && prevDesc) metaDesc.content = prevDesc;
      if (canonical && prevCanonical) canonical.href = prevCanonical;
      if (ogTitle && prevOgTitle) ogTitle.content = prevOgTitle;
      if (ogDesc && prevOgDesc) ogDesc.content = prevOgDesc;
      if (ogUrl && prevOgUrl) ogUrl.content = prevOgUrl;
      if (twTitle && prevTwTitle) twTitle.content = prevTwTitle;
      if (twDesc && prevTwDesc) twDesc.content = prevTwDesc;
    };
  }, [title, description, pathname]);

  return null;
}
