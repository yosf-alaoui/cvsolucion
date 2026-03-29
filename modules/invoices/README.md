# Invoices Module

Reusable invoice layer for digital-service businesses that need:
- invoice issuance after service delivery
- PDF export for paid appointments
- dashboard-ready invoice summaries

## Current implementation
- Server source: `server/invoiceStore.ts`, `server/invoicePdf.ts`, `server/index.ts`
- Client source: `client/src/lib/customer.ts`, `client/src/pages/CustomerDashboard.tsx`

## Reusable entrypoints
- `contracts.ts`: invoice record and summary shapes
- `client.ts`: customer invoice endpoint helpers
- `server.ts`: invoice issuance and lookup contracts
- `env.ts`: invoice module manifest

## Notes
- This module is intentionally generic for service businesses with no shipping.
- PDF rendering can be replaced per project if branding or tax rules differ.
