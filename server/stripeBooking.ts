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

function parseNonNegativeCents(value: string | undefined, fallback: number) {
  if (typeof value === "undefined" || !value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getCardPaymentFeeCents() {
  return parseNonNegativeCents(process.env.STRIPE_CARD_PAYMENT_FEE_CENTS, 1500);
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

function getPriceMap(countryCode?: string | null): StripeBookingPriceMap {
  const bookingPrices = getCatalogSnapshot(countryCode).bookingPrices;
  return {
    "standard:consultation": bookingPrices.standardConsultation,
    "standard:support": bookingPrices.standardSupport,
    "express:consultation": bookingPrices.expressConsultation,
    "express:support": bookingPrices.expressSupport,
  };
}

function getTrainingPriceMap(countryCode?: string | null) {
  return getCatalogSnapshot(countryCode).trainingPrices;
}

function getTrainingProgram(identifier: string, countryCode?: string | null) {
  return getCatalogTrainingProgram(identifier, countryCode);
}

export function getBookingPrice(priority: BookingPriority, serviceType: BookingServiceType, countryCode?: string | null) {
  const priceMap = getPriceMap(countryCode);
  return priceMap[`${priority}:${serviceType}`];
}

export function getTrainingPrice(level: TrainingPriceKey, countryCode?: string | null) {
  return getTrainingProgram(level, countryCode)?.priceCents || 0;
}

export function buildBookingSlotsDigest(slots: Array<{ date: string; hour: number }>) {
  const normalized = [...slots]
    .map((slot) => `${slot.date}:${String(slot.hour).padStart(2, "0")}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function getStripePricingSnapshot(countryCode?: string | null) {
  const snapshot = getCatalogSnapshot(countryCode);
  return {
    enabled: isStripeConfigured(),
    publishableKey: getStripePublishableKey(),
    currency: getStripeCurrency(),
    cardPaymentFeeCents: getCardPaymentFeeCents(),
    prices: getPriceMap(countryCode),
    appliedCountryCode: snapshot.appliedCountryCode,
  };
}

export function getTrainingPricingSnapshot(countryCode?: string | null) {
  const snapshot = getCatalogSnapshot(countryCode);
  return {
    enabled: isStripeConfigured(),
    publishableKey: getStripePublishableKey(),
    currency: getStripeCurrency(),
    cardPaymentFeeCents: getCardPaymentFeeCents(),
    prices: snapshot.trainingPrices,
    appliedCountryCode: snapshot.appliedCountryCode,
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
  countryCode?: string | null;
  slots: Array<{ date: string; hour: number }>;
  locale: "en" | "fr" | "ar";
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const unitAmount = getBookingPrice(input.priority, input.serviceType, input.countryCode);
  const slotCount = input.slots.length;
  if (!unitAmount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
  }
  if (!slotCount) {
    throw new Error("At least one booking slot is required.");
  }
  const subtotal = unitAmount * slotCount;
  const cardPaymentFeeCents = getCardPaymentFeeCents();
  const amount = subtotal + cardPaymentFeeCents;

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
      countryCode: input.countryCode || "",
      slotCount: String(slotCount),
      slotsDigest,
      bookingSubtotalCents: String(subtotal),
      cardPaymentFeeCents: String(cardPaymentFeeCents),
      bookingTotalCents: String(amount),
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
  countryCode?: string | null;
  locale: "en" | "fr" | "ar";
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const program = getTrainingProgram(input.level, input.countryCode);
  const subtotal = program?.priceCents || 0;
  if (!subtotal) {
    throw new Error("Stripe pricing is not configured for this training program.");
  }
  if (!program?.active) {
    throw new Error("This training program is not available.");
  }
  const cardPaymentFeeCents = getCardPaymentFeeCents();
  const amount = subtotal + cardPaymentFeeCents;

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
      countryCode: input.countryCode || "",
      trainingSubtotalCents: String(subtotal),
      cardPaymentFeeCents: String(cardPaymentFeeCents),
      trainingPriceCents: String(amount),
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
  countryCode?: string | null;
  slots: Array<{ date: string; hour: number }>;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const pricingCountryCode = input.countryCode || null;
  const unitAmount = getBookingPrice(input.priority, input.serviceType, pricingCountryCode);
  const slotCount = input.slots.length;
  if (!unitAmount) {
    throw new Error("Stripe pricing is not configured for this booking type.");
  }
  if (!slotCount) {
    throw new Error("At least one booking slot is required.");
  }
  const subtotal = unitAmount * slotCount;
  const cardPaymentFeeCents = getCardPaymentFeeCents();
  const amount = subtotal + cardPaymentFeeCents;

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not been completed.");
  }

  const metadataAmount = Number(intent.metadata?.bookingTotalCents || "");
  const expectedAmount = Number.isInteger(metadataAmount) && metadataAmount > 0 ? metadataAmount : amount;
  const amountMatches =
    intent.amount === expectedAmount ||
    (!intent.metadata?.bookingTotalCents && intent.amount === subtotal);
  if (!amountMatches || intent.currency.toLowerCase() !== getStripeCurrency()) {
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
  countryCode?: string | null;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const pricingCountryCode = input.countryCode || null;
  const program = getTrainingProgram(input.level, pricingCountryCode);
  const subtotal = program?.priceCents || 0;
  if (!subtotal) {
    throw new Error("Stripe pricing is not configured for this training program.");
  }
  const cardPaymentFeeCents = getCardPaymentFeeCents();
  const amount = subtotal + cardPaymentFeeCents;

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not been completed.");
  }

  const metadataAmount = Number(intent.metadata?.trainingPriceCents || "");
  const expectedAmount = Number.isInteger(metadataAmount) && metadataAmount > 0 ? metadataAmount : amount;
  const amountMatches =
    intent.amount === expectedAmount ||
    (!intent.metadata?.cardPaymentFeeCents && intent.amount === subtotal);
  if (!amountMatches || intent.currency.toLowerCase() !== getStripeCurrency()) {
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
