import Stripe from "stripe";
import crypto from "crypto";
import type { BookingPriority, BookingServiceType } from "./bookingStore";

type StripeBookingPriceMap = Record<`${BookingPriority}:${BookingServiceType}`, number>;

let stripeClient: Stripe | null | undefined;

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripePublishableKey() {
  return process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function getStripeCurrency() {
  return (process.env.STRIPE_CURRENCY?.trim() || "cad").toLowerCase();
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey() && getStripePublishableKey());
}

function getStripeClient() {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const secretKey = getStripeSecretKey();
  stripeClient = secretKey ? new Stripe(secretKey) : null;
  return stripeClient;
}

function parseAmount(value: string | undefined) {
  const amount = Number(value || "");
  return Number.isInteger(amount) && amount > 0 ? amount : 0;
}

function getPriceMap(): StripeBookingPriceMap {
  return {
    "standard:consultation": parseAmount(process.env.STRIPE_PRICE_STANDARD_CONSULTATION),
    "standard:support": parseAmount(process.env.STRIPE_PRICE_STANDARD_SUPPORT),
    "express:consultation": parseAmount(process.env.STRIPE_PRICE_EXPRESS_CONSULTATION),
    "express:support": parseAmount(process.env.STRIPE_PRICE_EXPRESS_SUPPORT),
  };
}

export function getBookingPrice(priority: BookingPriority, serviceType: BookingServiceType) {
  const priceMap = getPriceMap();
  return priceMap[`${priority}:${serviceType}`];
}

export function buildBookingSlotsDigest(slots: Array<{ date: string; hour: number }>) {
  const normalized = [...slots]
    .map((slot) => `${slot.date}:${String(slot.hour).padStart(2, "0")}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function getStripePricingSnapshot() {
  return {
    enabled: isStripeConfigured(),
    publishableKey: getStripePublishableKey(),
    currency: getStripeCurrency(),
    prices: getPriceMap(),
  };
}

export async function createBookingPaymentIntent(input: {
  userId: string;
  email: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  slots: Array<{ date: string; hour: number }>;
  locale: "en" | "fr" | "ar";
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const unitAmount = getBookingPrice(input.priority, input.serviceType);
  const slotCount = input.slots.length;
  const amount = unitAmount * slotCount;
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
  }
  if (!slotCount) {
    throw new Error("At least one booking slot is required.");
  }

  const slotsDigest = buildBookingSlotsDigest(input.slots);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: getStripeCurrency(),
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: input.email,
    metadata: {
      type: "booking",
      userId: input.userId,
      email: input.email,
      serviceType: input.serviceType,
      priority: input.priority,
      slotCount: String(slotCount),
      slotsDigest,
      locale: input.locale,
    },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client secret.");
  }

  return intent;
}

export async function verifyBookingPayment(input: {
  paymentIntentId: string;
  userId: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  slots: Array<{ date: string; hour: number }>;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const unitAmount = getBookingPrice(input.priority, input.serviceType);
  const slotCount = input.slots.length;
  const amount = unitAmount * slotCount;
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
  }
  if (!slotCount) {
    throw new Error("At least one booking slot is required.");
  }

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not been completed.");
  }

  if (intent.amount !== amount || intent.currency.toLowerCase() !== getStripeCurrency()) {
    throw new Error("Payment amount does not match this booking type.");
  }

  if (intent.metadata?.userId !== input.userId) {
    throw new Error("Payment does not belong to this user.");
  }

  if (intent.metadata?.serviceType !== input.serviceType || intent.metadata?.priority !== input.priority) {
    throw new Error("Payment does not match the selected booking type.");
  }

  if (intent.metadata?.slotCount !== String(slotCount)) {
    throw new Error("Payment does not match the selected number of appointments.");
  }

  if (intent.metadata?.slotsDigest !== buildBookingSlotsDigest(input.slots)) {
    throw new Error("Payment does not match the selected appointment slots.");
  }

  return intent;
}

export function constructStripeEvent(payload: Buffer, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;

  if (!stripe || !webhookSecret) {
    throw new Error("Stripe webhook is not configured.");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
