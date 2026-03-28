import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const bookingModuleEnv: ModuleEnvRequirement[] = [
  { key: "STRIPE_SECRET_KEY", required: true, description: "Stripe secret key used to create payment intents." },
  {
    key: "VITE_STRIPE_PUBLISHABLE_KEY",
    required: true,
    description: "Stripe publishable key exposed to the client checkout flow.",
  },
  { key: "STRIPE_WEBHOOK_SECRET", required: true, description: "Stripe webhook signing secret." },
  { key: "STRIPE_CURRENCY", required: false, description: "Checkout currency.", example: "cad" },
  {
    key: "STRIPE_PRICE_STANDARD_CONSULTATION",
    required: true,
    description: "Unit amount in minor currency units.",
    example: "14000",
  },
  {
    key: "STRIPE_PRICE_STANDARD_SUPPORT",
    required: true,
    description: "Unit amount in minor currency units.",
    example: "14000",
  },
  {
    key: "STRIPE_PRICE_EXPRESS_CONSULTATION",
    required: true,
    description: "Unit amount in minor currency units.",
    example: "18000",
  },
  {
    key: "STRIPE_PRICE_EXPRESS_SUPPORT",
    required: true,
    description: "Unit amount in minor currency units.",
    example: "18000",
  },
];

export const bookingModuleManifest: ReusableModuleManifest = {
  name: "booking",
  category: "booking",
  summary: "Virtual-service booking, checkout, Stripe payment, rescheduling, and refund synchronization.",
  runtime: ["client", "server"],
  env: bookingModuleEnv,
  currentProject: {
    client: [
      "client/src/lib/bookings.ts",
      "client/src/lib/bookingCheckout.ts",
      "client/src/pages/Booking.tsx",
      "client/src/pages/BookingCart.tsx",
      "client/src/pages/BookingCheckout.tsx",
    ],
    server: ["server/bookingStore.ts", "server/stripeBooking.ts", "server/stripeEventStore.ts", "server/index.ts"],
    data: ["data/bookings-db.json", "data/customer-profiles-db.json"],
  },
};

