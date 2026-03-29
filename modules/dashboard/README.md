# Dashboard Module

Reusable dashboard layer for:
- customer profile
- booking history
- invoice status and customer downloads
- admin pricing controls
- package management
- customer requests
- bookings and refund controls
- support and analytics views

## Current implementation
- Customer profile storage: `server/customerProfileStore.ts`
- Admin and customer API shapes: `client/src/lib/admin.ts`, `client/src/lib/customer.ts`
- UI screens: `client/src/pages/AdminDashboard.tsx`, `CustomerDashboard.tsx`
- Admin operations panels: `client/src/components/admin/BookingsManager.tsx`, `RequestsManager.tsx`

## Reusable entrypoints
- `contracts.ts`
- `client.ts`
- `env.ts`

## Notes
- Keep the dashboard module as an orchestration layer that consumes other modules.
- Pricing and package management belong here because they are operational controls.
- Bookings, leads, invoices, and profile data should be surfaced as separate operational sections instead of one crowded screen.
