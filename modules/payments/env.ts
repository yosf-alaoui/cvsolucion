import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const paymentsModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "STRIPE_SECRET_KEY",
    required: true,
    description: "Stripe secret key used to create and verify payment intents.",
  },
  {
    key: "VITE_STRIPE_PUBLISHABLE_KEY",
    required: true,
    description: "Stripe publishable key exposed to the browser checkout form.",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: false,
    description: "Webhook signing secret used to verify Stripe events.",
  },
  {
    key: "STRIPE_CURRENCY",
    required: false,
    description: "Default currency code for digital service payments.",
    example: "usd",
  },
  {
    key: "STRIPE_CARD_PAYMENT_FEE_CENTS",
    required: false,
    description: "Optional fixed card-payment fee in cents added to Stripe checkout totals.",
    example: "1500",
  },
];

export const paymentsModuleManifest: ReusableModuleManifest = {
  name: "payments",
  category: "payments",
  summary: "Generic Stripe payment layer for digital services, checkout, and webhook verification.",
  runtime: ["client", "server"],
  env: paymentsModuleEnv,
  currentProject: {
    client: [
      "client/src/lib/stripeBooking.ts",
      "client/src/components/booking/StripePaymentForm.tsx",
      "client/src/pages/BookingCheckout.tsx",
    ],
    server: ["server/stripeBooking.ts", "server/stripeEventStore.ts", "server/index.ts"],
    data: ["data/stripe-events-db.json", "data/bookings-db.json"],
  },
};
