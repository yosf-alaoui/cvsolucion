import type { SeoAlternateLink, SeoDocument } from "./contracts";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceMetaTag(selector: { name?: string; property?: string }, content: string) {
  const attribute = selector.name ? "name" : "property";
  const key = selector.name ?? selector.property ?? "";
  let element = document.head.querySelector(
    `meta[${attribute}="${key.replace(/"/g, '\\"')}"]`
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function ensureCanonical(url: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function replaceStructuredData(data: SeoDocument["structuredData"]) {
  const existing = Array.from(document.head.querySelectorAll('script[data-seo="structured"]'));
  existing.forEach((node) => node.remove());

  if (!data) return;

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", "structured");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function replaceAlternates(alternates: SeoAlternateLink[]) {
  const existing = Array.from(document.head.querySelectorAll('link[data-seo="alternate"]'));
  existing.forEach((node) => node.remove());

  for (const alternate of alternates) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.setAttribute("data-seo", "alternate");
    link.hreflang = alternate.hreflang;
    link.href = alternate.href;
    document.head.appendChild(link);
  }
}

export function applySeoDocumentToHead(options: {
  document: SeoDocument;
  canonicalUrl: string;
  alternates?: SeoAlternateLink[];
}) {
  document.documentElement.lang = options.document.lang;
  if (options.document.dir) {
    document.documentElement.dir = options.document.dir;
  } else {
    document.documentElement.removeAttribute("dir");
  }

  document.title = options.document.title;
  replaceMetaTag({ name: "description" }, options.document.description);
  replaceMetaTag({ name: "robots" }, options.document.robots || "index, follow");
  replaceMetaTag({ property: "og:type" }, options.document.ogType || "website");
  replaceMetaTag({ property: "og:title" }, options.document.title);
  replaceMetaTag({ property: "og:description" }, options.document.description);
  replaceMetaTag({ property: "og:url" }, options.canonicalUrl);
  if (options.document.image) {
    replaceMetaTag({ property: "og:image" }, options.document.image);
    replaceMetaTag({ name: "twitter:image" }, options.document.image);
  }
  replaceMetaTag({ name: "twitter:title" }, options.document.title);
  replaceMetaTag({ name: "twitter:description" }, options.document.description);
  replaceMetaTag({ name: "twitter:url" }, options.canonicalUrl);
  ensureCanonical(options.canonicalUrl);
  replaceStructuredData(options.document.structuredData || null);
  replaceAlternates(options.alternates || []);
}

export function escapeSeoHtml(value: string) {
  return escapeHtml(value);
}
