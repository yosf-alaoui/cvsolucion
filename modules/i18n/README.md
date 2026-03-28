# I18n Module

Reusable locale-routing and translation helper layer.

## Current implementation
- Client source: `client/src/i18n/i18n.tsx`, `client/src/i18n/translations.ts`

## Reusable entrypoints
- `contracts.ts`: locale and module context types
- `client.ts`: locale path helpers plus translation lookup
- `env.ts`: manifest

## Usage
```ts
import { createI18nModule } from "../modules/i18n/client";

const i18n = createI18nModule({
  translations: {
    en: { nav: { home: "Home" } },
    fr: { nav: { home: "Accueil" } },
    ar: { nav: { home: "الرئيسية" } },
  },
});

const ctx = i18n.createContext("/fr/articles");
ctx.t("nav.home");
```
