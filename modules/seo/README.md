# SEO Module

Reusable SEO helper layer for SPA + SSR-fallback sites.

## Current implementation
- Server source: `server/seo.ts`, `server/index.ts`
- Client source: `client/src/components/Seo.tsx`, `client/index.html`

## Reusable entrypoints
- `contracts.ts`: SEO document, alternates, and sitemap item types
- `client.ts`: head-tag updater for SPA navigation
- `server.ts`: HTML renderer plus robots/sitemap helpers
- `env.ts`: canonical-origin requirements

## Usage
```ts
import { renderSeoHtml } from "../modules/seo/server";

const html = renderSeoHtml(template, seoDocument, {
  canonicalUrl: "https://example.com/articles/test",
});
```
