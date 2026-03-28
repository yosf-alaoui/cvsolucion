# Dashboard Module

Reusable dashboard layer for:
- customer profile
- booking history
- admin pricing controls
- package management
- support and analytics views

## Current implementation
- Customer profile storage: `server/customerProfileStore.ts`
- Admin and customer API shapes: `client/src/lib/admin.ts`, `client/src/lib/customer.ts`
- UI screens: `client/src/pages/AdminDashboard.tsx`, `CustomerDashboard.tsx`

## Reusable entrypoints
- `contracts.ts`
- `client.ts`
- `env.ts`

## Notes
- Keep the dashboard module as an orchestration layer that consumes other modules.
- Pricing and package management belong here because they are operational controls.

