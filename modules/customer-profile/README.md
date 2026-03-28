# Customer Profile Module

Reusable customer account-profile module for dashboards, checkout autofill, and account edits.

## Current implementation
- Server source: `server/customerProfileStore.ts`, `server/index.ts`
- Client source: `client/src/lib/customer.ts`, `client/src/pages/CustomerDashboard.tsx`, `client/src/pages/BookingCheckout.tsx`

## Reusable entrypoints
- `contracts.ts`: profile and update payloads
- `client.ts`: profile dashboard/update client
- `server.ts`: generic upsert/get profile store
- `env.ts`: manifest
