# Payments Module

Reusable Stripe layer for service businesses that sell virtual sessions, audits, support, or other non-shipping services.

## Current implementation
- Server source: `server/stripeBooking.ts`, `server/stripeEventStore.ts`, `server/index.ts`
- Client source: `client/src/lib/stripeBooking.ts`, `client/src/components/booking/StripePaymentForm.tsx`

## Reusable entrypoints
- `contracts.ts`: payment config, line items, and payment-intent response shapes
- `client.ts`: browser-side payment config and intent client
- `server.ts`: Stripe helpers for intents, verification, refunds, and webhooks
- `env.ts`: required Stripe environment variables

## Notes
- This module is generic and should stay independent from appointment logic.
- Bookings, courses, retainers, and other digital services can all sit on top of it.
- Refund actions should be initiated from the platform dashboard when possible so Stripe remains the payment source of truth and the platform remains the booking source of truth.
