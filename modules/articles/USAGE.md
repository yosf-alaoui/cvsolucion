# articles usage

## Use when

You want multilingual articles with admin CRUD and optional OpenAI translation.

## Main entrypoints

- `createArticlesModuleClient({ baseUrl?, imageUploadPath? })`
- `createArticleTranslationModule({ apiKey, model?, endpoint? })`

## What you provide

- public/admin article routes
- OpenAI API key only if you want automatic translation

## Example

```ts
const articles = createArticlesModuleClient({ baseUrl: apiBase });
const list = await articles.getArticles("en");
```
