import Stripe from "stripe";
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
  const prices = getPriceMap();
  return Boolean(
    getStripeSecretKey() &&
      getStripePublishableKey() &&
      prices["standard:consultation"] &&
      prices["standard:support"] &&
      prices["express:consultation"] &&
      prices["express:support"]
  );
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
  date: string;
  hour: number;
  locale: "en" | "fr" | "ar";
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const amount = getBookingPrice(input.priority, input.serviceType);
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
  }

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
      date: input.date,
      hour: String(input.hour),
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
  date: string;
  hour: number;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const amount = getBookingPrice(input.priority, input.serviceType);
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
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

  if (intent.metadata?.date !== input.date || intent.metadata?.hour !== String(input.hour)) {
    throw new Error("Payment does not match the selected appointment time.");
  }

  return intent;
}
