# Catalog Module

Reusable service-catalog and pricing module for digital service businesses.

## Current implementation
- Server source: `server/catalogStore.ts`, `server/index.ts`
- Client source: `client/src/lib/admin.ts`, `client/src/components/admin/CatalogManager.tsx`

## Reusable entrypoints
- `contracts.ts`: package and pricing shapes
- `client.ts`: public/admin catalog API client
- `server.ts`: generic catalog state manager
- `env.ts`: optional default booking price environment variables

## Notes
- This module is intentionally separate from `dashboard` so pricing and packages can be reused in non-dashboard projects.
