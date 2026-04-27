# shared usage

## Use when

You need a small HTTP wrapper or a common manifest type for a new reusable module.

## Main entrypoints

- `createJsonHttpClient(options)`
- `ReusableModuleManifest`

## What you provide

- `baseUrl` only if the new project does not use the same origin
- `fetchImpl` only for tests or SSR

## Example

```ts
import { createJsonHttpClient } from "../modules/shared/http";

const request = createJsonHttpClient({ baseUrl: "https://example.com" });
const data = await request("/api/ping", { method: "GET" });
```
