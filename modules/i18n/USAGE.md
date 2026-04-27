# i18n usage

## Use when

You need locale-aware routes, translations, and WhatsApp links.

## Main entrypoints

- `createI18nModule({ ... })`
- `getLocaleFromPath(path)`
- `buildPathWithLocale(path, locale)`
- `buildWhatsAppLink(phoneE164, message)`

## What you provide

- the supported locales and translations object
- optional default locale

## Example

```ts
const locale = getLocaleFromPath("/fr/articles");
```
