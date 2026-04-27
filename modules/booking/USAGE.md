# booking usage

## Use when

You need availability, booking creation, checkout intent, and admin slot control.

## Main entrypoints

- `createBookingModuleClient({ baseUrl? })`
- `createBookingHoursConfig(overrides?)`
- `validateCreateBookingPayload(payload)`
- `calculateBookingCharge({ unitAmountCents, slotCount, cardPaymentFeeCents? })`

## What you provide

- service type, priority, slot list
- customer info only: name, email, phone, country
- optional region code and package key

## Example

```ts
const booking = createBookingModuleClient({ baseUrl: apiBase });
const availability = await booking.getAvailability("standard");
```
