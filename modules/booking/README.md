# Booking Module

Reusable virtual-service booking stack with:
- date and time availability
- standard and express slots
- multi-slot cart
- Stripe checkout
- rescheduling rules
- refund synchronization

## Current implementation
- Availability and booking rules: `server/bookingStore.ts`
- Stripe integration: `server/stripeBooking.ts`
- UI flow: `client/src/pages/Booking.tsx`, `BookingCart.tsx`, `BookingCheckout.tsx`

## Reusable entrypoints
- `contracts.ts`
- `client.ts`
- `env.ts`

## Usage
```ts
import { createBookingModuleClient } from "../modules/booking/client";

const booking = createBookingModuleClient({ baseUrl: "https://example.com" });
const availability = await booking.getAvailability("standard");
const payment = await booking.createCheckoutIntent({
  serviceType: "consultation",
  priority: "standard",
  slots: [{ date: "2026-04-10", hour: 9 }],
  locale: "en",
});
```

## Notes
- Prices are per selected slot.
- This module assumes no physical shipping.
- Keep business-hour logic server-side.

