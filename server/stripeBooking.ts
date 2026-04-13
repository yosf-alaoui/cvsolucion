import Stripe from "stripe";
import crypto from "crypto";
import type { BookingPriority, BookingServiceType } from "./bookingStore";
import { getCatalogSnapshot, getCatalogTrainingProgram } from "./catalogStore";

type StripeBookingPriceMap = Record<`${BookingPriority}:${BookingServiceType}`, number>;
export type TrainingPriceKey = string;

let stripeClient: Stripe | null | undefined;

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripePublishableKey() {
  return process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function getStripeCurrency() {
  return (process.env.STRIPE_CURRENCY?.trim() || "usd").toLowerCase();
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

function getPriceMap(): StripeBookingPriceMap {
  const bookingPrices = getCatalogSnapshot().bookingPrices;
  return {
    "standard:consultation": bookingPrices.standardConsultation,
    "standard:support": bookingPrices.standardSupport,
    "express:consultation": bookingPrices.expressConsultation,
    "express:support": bookingPrices.expressSupport,
  };
}

function getTrainingPriceMap() {
  return getCatalogSnapshot().trainingPrices;
}

function getTrainingProgram(identifier: string) {
  return getCatalogTrainingProgram(identifier);
}

export function getBookingPrice(priority: BookingPriority, serviceType: BookingServiceType) {
  const priceMap = getPriceMap();
  return priceMap[`${priority}:${serviceType}`];
}

export function getTrainingPrice(level: TrainingPriceKey) {
  return getTrainingProgram(level)?.priceCents || 0;
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

export function getTrainingPricingSnapshot() {
  const snapshot = getCatalogSnapshot();
  return {
    enabled: isStripeConfigured(),
    publishableKey: getStripePublishableKey(),
    currency: getStripeCurrency(),
    prices: snapshot.trainingPrices,
    programs: snapshot.trainingPrograms
      .filter((program) => program.active)
      .map((program) => ({
        id: program.id,
        key: program.key,
        active: program.active,
        featured: program.featured,
        order: program.order,
        priceCents: program.priceCents,
        translations: program.translations,
      })),
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

export async function createTrainingPaymentIntent(input: {
  userId: string;
  email: string;
  level: TrainingPriceKey;
  locale: "en" | "fr" | "ar";
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const program = getTrainingProgram(input.level);
  const amount = program?.priceCents || 0;
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this training program.");
  }
  if (!program?.active) {
    throw new Error("This training program is not available.");
  }

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: getStripeCurrency(),
    receipt_email: input.email,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      type: "training",
      userId: input.userId,
      email: input.email,
      trainingLevel: program.key,
      trainingProgramId: program.id,
      trainingProgramKey: program.key,
      trainingPriceCents: String(program.priceCents),
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

export async function verifyTrainingPayment(input: {
  paymentIntentId: string;
  userId: string;
  level: TrainingPriceKey;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const program = getTrainingProgram(input.level);
  const amount = program?.priceCents || 0;
  if (!amount) {
    throw new Error("Stripe pricing is not configured for this training program.");
  }

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not been completed.");
  }

  const metadataAmount = Number(intent.metadata?.trainingPriceCents || "");
  const expectedAmount = Number.isInteger(metadataAmount) && metadataAmount > 0 ? metadataAmount : amount;
  if (intent.amount !== expectedAmount || intent.currency.toLowerCase() !== getStripeCurrency()) {
    throw new Error("Payment amount does not match this training program.");
  }

  if (intent.metadata?.type !== "training") {
    throw new Error("Payment does not match a training purchase.");
  }

  if (intent.metadata?.userId !== input.userId) {
    throw new Error("Payment does not belong to this user.");
  }

  const metadataMatchesProgram =
    intent.metadata?.trainingProgramId === program?.id ||
    intent.metadata?.trainingProgramKey === program?.key ||
    intent.metadata?.trainingLevel === program?.key;
  if (!metadataMatchesProgram) {
    throw new Error("Payment does not match this training program.");
  }

  return intent;
}

export async function createBookingRefund(input: {
  paymentIntentId: string;
  amount: number;
  bookingIds: string[];
  reason?: Stripe.RefundCreateParams.Reason;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  if (!input.paymentIntentId.trim()) {
    throw new Error("Payment reference is required.");
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const refund = await stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    amount: input.amount,
    reason: input.reason || "requested_by_customer",
    metadata: {
      bookingIds: input.bookingIds.join(","),
    },
  });

  return refund;
}

export function constructStripeEvent(payload: Buffer, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;

  if (!stripe || !webhookSecret) {
    throw new Error("Stripe webhook is not configured.");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
