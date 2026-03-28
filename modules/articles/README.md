# Articles Module

Reusable article publishing kit with:
- multilingual article records
- admin CRUD
- public list/detail reads
- image uploads
- automatic translation through OpenAI

## Current implementation
- Server source: `server/articleStore.ts`, `server/articleTranslation.ts`, `server/index.ts`
- Client source: `client/src/lib/articles.ts`, `client/src/components/admin/ArticlesManager.tsx`

## Reusable entrypoints
- `contracts.ts`: article record shapes and payloads
- `client.ts`: public/admin article API client
- `server.ts`: translation helper plus reusable article utilities
- `env.ts`: OpenAI translation requirements

## Usage
```ts
import { createArticlesModuleClient } from "../modules/articles/client";

const articles = createArticlesModuleClient({ baseUrl: "https://example.com" });
const list = await articles.getArticles("en");
```

## Notes
- Translation is async and depends on OpenAI.
- Image normalization can stay app-specific if each project has different media rules.
