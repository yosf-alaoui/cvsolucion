# Visitor Tracking Module

Reusable first-party telemetry module for page views, sessions, clicks, and chat interactions.

## Current implementation
- Server source: `server/visitorStore.ts`, `server/index.ts`
- Client source: `client/src/components/Analytics.tsx`

## Reusable entrypoints
- `contracts.ts`: visitor, page-view, and interaction types
- `client.ts`: visit/interaction API client
- `server.ts`: generic visitor tracking store
- `env.ts`: manifest
