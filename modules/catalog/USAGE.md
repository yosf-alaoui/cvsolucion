# catalog usage

## Use when

You need reusable service packages, booking prices, and training programs.

## Main entrypoints

- `createCatalogModule({ storage, defaults? })`
- `createCatalogModuleClient({ baseUrl? })`

## What you provide

- a `load/save` storage adapter
- optional default prices and package data

## Example

```ts
const catalog = createCatalogModule({ storage });
const snapshot = await catalog.getSnapshot();
```
