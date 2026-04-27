# seo usage

## Use when

You need canonical tags, hreflang, sitemap, robots, or SSR SEO HTML.

## Main entrypoints

- `applySeoDocumentToHead({ document, canonicalUrl, alternates? })`
- `renderSeoHtml(document, canonicalUrl, alternates?)`
- `buildSitemapXml(items)`
- `buildRobotsTxt({ origin, disallow? })`

## What you provide

- page title and description
- canonical URL
- optional alternate locale links

## Example

```ts
applySeoDocumentToHead({ document: seoDoc, canonicalUrl, alternates });
```
