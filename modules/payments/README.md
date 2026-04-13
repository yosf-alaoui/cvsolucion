# Payments Module

Reusable Stripe layer for service businesses that sell virtual sessions, audits, support, or other non-shipping services.

## Current implementation
- Server source: `server/stripeBooking.ts`, `server/stripeEventStore.ts`, `server/index.ts`
- Client source: `client/src/lib/stripeBooking.ts`, `client/src/components/booking/StripePaymentForm.tsx`

## Payment fee
- Set `STRIPE_CARD_PAYMENT_FEE_CENTS=1500` to add a fixed $15 card-payment fee to checkout totals.
- Expose `cardPaymentFeeCents` in the public config so the UI invoice and Stripe amount stay aligned.
- Store the fee in Stripe metadata when creating a payment intent so later verification and support checks can explain the total.

## Reusable entrypoints
- `contracts.ts`: payment config, line items, and payment-intent response shapes
- `client.ts`: browser-side payment config and intent client
- `server.ts`: Stripe helpers for intents, verification, refunds, and webhooks
- `env.ts`: required Stripe environment variables

## Notes
- This module is generic and should stay independent from appointment logic.
- Bookings, courses, retainers, and other digital services can all sit on top of it.
- Refund actions should be initiated from the platform dashboard when possible so Stripe remains the payment source of truth and the platform remains the booking source of truth.
