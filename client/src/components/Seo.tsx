import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export default function Seo({ title, description, image, type = "website", structuredData }: SeoProps) {
  useEffect(() => {
    const href = window.location.href;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", href);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = href;

    const scriptId = "seo-structured-data";
    document.getElementById(scriptId)?.remove();
    if (structuredData) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, image, type, structuredData]);

  return null;
}
