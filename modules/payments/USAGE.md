# payments usage

## Use when

You need Stripe config, payment intents, totals, and webhook verification.

## Main entrypoints

- `createPaymentsModuleClient({ baseUrl?, configPath?, intentPath? })`
- `createStripePaymentsModule({ secretKey, publishableKey, webhookSecret?, currency?, cardPaymentFeeCents? })`
- `calculateOrderTotals(lineItems, taxRate?, fees?)`

## What you provide

- Stripe keys
- your line items
- optional fixed card fee

## Example

```ts
const totals = calculateOrderTotals(items, 0, 1500);
```
