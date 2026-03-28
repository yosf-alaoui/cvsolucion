import type { SeoAlternateLink, SeoDocument, SeoSitemapItem } from "./contracts";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceMeta(html: string, selector: { name?: string; property?: string }, content: string) {
  const attribute = selector.name ? "name" : "property";
  const key = selector.name ?? selector.property ?? "";
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*\\/?>`,
    "i"
  );
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

export function buildSeoAlternates(alternates: SeoAlternateLink[]) {
  return alternates
    .map(
      (item) =>
        `<link rel="alternate" hreflang="${escapeHtml(item.hreflang)}" href="${escapeHtml(item.href)}" />`
    )
    .join("\n");
}

export function renderSeoHtml(
  template: string,
  document: SeoDocument,
  options: {
    canonicalUrl: string;
    alternates?: SeoAlternateLink[];
  }
) {
  const structuredData = document.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(document.structuredData)}</script>`
    : "";

  let html = template;
  html = html.replace(
    /<html[^>]*lang="[^"]*"[^>]*>/i,
    `<html lang="${document.lang}"${document.dir === "rtl" ? ' dir="rtl"' : ""}>`
  );
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(document.title)}</title>`);
  html = replaceMeta(html, { name: "description" }, document.description);
  html = replaceMeta(html, { name: "robots" }, document.robots || "index, follow");
  html = replaceMeta(html, { property: "og:type" }, document.ogType || "website");
  html = replaceMeta(html, { property: "og:title" }, document.title);
  html = replaceMeta(html, { property: "og:description" }, document.description);
  html = replaceMeta(html, { property: "og:url" }, options.canonicalUrl);
  if (document.image) {
    html = replaceMeta(html, { property: "og:image" }, document.image);
    html = replaceMeta(html, { name: "twitter:image" }, document.image);
  }
  html = replaceMeta(html, { name: "twitter:title" }, document.title);
  html = replaceMeta(html, { name: "twitter:description" }, document.description);
  html = replaceMeta(html, { name: "twitter:url" }, options.canonicalUrl);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(options.canonicalUrl)}" />`);
  html = html.replace("<!-- SEO_ALTERNATES -->", buildSeoAlternates(options.alternates || []));
  html = html.replace("<!-- SEO_STRUCTURED_DATA -->", structuredData);
  html = html.replace("<!-- SEO_FALLBACK -->", document.fallbackHtml || "");
  return html;
}

export function buildSitemapXml(items: SeoSitemapItem[]) {
  const entries = items
    .map((item) => {
      const lastmod = item.lastmod ? `<lastmod>${escapeHtml(item.lastmod)}</lastmod>` : "";
      const changefreq = item.changefreq ? `<changefreq>${escapeHtml(item.changefreq)}</changefreq>` : "";
      const priority =
        item.priority !== undefined ? `<priority>${escapeHtml(String(item.priority))}</priority>` : "";
      return `<url><loc>${escapeHtml(item.url)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function buildRobotsTxt(options: { origin: string; disallow?: string[] }) {
  const lines = ["User-agent: *", "Allow: /"];
  for (const path of options.disallow || []) {
    lines.push(`Disallow: ${path}`);
  }
  lines.push("", `Sitemap: ${options.origin}/sitemap.xml`, "");
  return lines.join("\n");
}
