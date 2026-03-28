export type SeoDocument = {
  lang: string;
  dir?: "ltr" | "rtl";
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: "website" | "article";
  robots?: string;
  image?: string;
  fallbackHtml?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

export type SeoAlternateLink = {
  hreflang: string;
  href: string;
};

export type SeoSitemapItem = {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string | number;
};
