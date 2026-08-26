import Stripe from "stripe";
import crypto from "crypto";
import type { BookingPriority, BookingServiceType } from "./bookingStore";
import { getCatalogSnapshot, getCatalogTrainingProgram } from "./catalogStore";

type StripeBookingPriceMap = Record<
  `${BookingPriority}:${BookingServiceType}`,
  number
>;
export type TrainingPriceKey = string;

export const BOOKING_NOTES_MIN_LENGTH = 10;
export const BOOKING_NOTES_MAX_LENGTH = 500;

export type BookingCheckoutDetails = {
  name: string;
  phone: string;
  company: string | null;
  notes: string;
  packageKey: string | null;
};

export type BookingPaymentSnapshot = BookingCheckoutDetails & {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  countryCode: string;
  slots: Array<{ date: string; hour: number }>;
  locale: "en" | "fr" | "ar";
};

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

export function getBookingPrice(
  priority: BookingPriority,
  serviceType: BookingServiceType,
  countryCode?: string | null,
) {
  const priceMap = getPriceMap(countryCode);
  return priceMap[`${priority}:${serviceType}`];
}

export function getTrainingPrice(
  level: TrainingPriceKey,
  countryCode?: string | null,
) {
  return getTrainingProgram(level, countryCode)?.priceCents || 0;
}

export function buildBookingSlotsDigest(
  slots: Array<{ date: string; hour: number }>,
) {
  const normalized = [...slots]
    .map((slot) => `${slot.date}:${String(slot.hour).padStart(2, "0")}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function requiredTrimmedText(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < minLength) {
    throw new Error(`${field} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${field} is too long.`);
  }
  return normalized;
}

function optionalTrimmedText(value: unknown, field: string, maxLength: number) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length > maxLength) {
    throw new Error(`${field} is too long.`);
  }
  return normalized || null;
}

export function validateBookingCheckoutDetails(input: {
  name?: unknown;
  phone?: unknown;
  company?: unknown;
  notes?: unknown;
  packageKey?: unknown;
}): BookingCheckoutDetails {
  const name = requiredTrimmedText(input.name, "Name", 2, 120);
  const phone = requiredTrimmedText(input.phone, "Phone number", 6, 40);
  if (phone.replace(/\D/g, "").length < 6) {
    throw new Error("A valid phone number is required.");
  }

  const notes = requiredTrimmedText(
    input.notes,
    "Issue or request description",
    BOOKING_NOTES_MIN_LENGTH,
    BOOKING_NOTES_MAX_LENGTH,
  );

  return {
    name,
    phone,
    company: optionalTrimmedText(input.company, "Company name", 160),
    notes,
    packageKey: optionalTrimmedText(input.packageKey, "Package", 100),
  };
}

function normalizeBookingPaymentSnapshot(input: {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  countryCode?: string | null;
  slots: Array<{ date: string; hour: number }>;
  locale: "en" | "fr" | "ar";
  name?: unknown;
  phone?: unknown;
  company?: unknown;
  notes?: unknown;
  packageKey?: unknown;
}): BookingPaymentSnapshot {
  const countryCode = String(input.countryCode || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error("Select a valid country from the list.");
  }
  if (!input.slots.length) {
    throw new Error("At least one booking slot is required.");
  }

  const details = validateBookingCheckoutDetails(input);
  return {
    ...details,
    serviceType: input.serviceType,
    priority: input.priority,
    countryCode,
    slots: input.slots.map((slot) => ({ date: slot.date, hour: slot.hour })),
    locale: input.locale,
  };
}

export function buildBookingCheckoutDigest(input: BookingPaymentSnapshot) {
  const normalized = {
    serviceType: input.serviceType,
    priority: input.priority,
    countryCode: input.countryCode || "",
    slots: [...input.slots]
      .map((slot) => ({ date: slot.date, hour: slot.hour }))
      .sort((left, right) =>
        `${left.date}:${left.hour}`.localeCompare(
          `${right.date}:${right.hour}`,
        ),
      ),
    locale: input.locale,
    name: input.name,
    phone: input.phone,
    company: input.company ?? null,
    notes: input.notes,
    packageKey: input.packageKey ?? null,
  };
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

const BOOKING_SLOTS_METADATA_CHUNK_SIZE = 450;
const MAX_BOOKING_SLOTS_METADATA_CHUNKS = 20;

export function buildBookingPaymentMetadata(input: BookingPaymentSnapshot) {
  const snapshot = normalizeBookingPaymentSnapshot(input);
  const encodedSlots = JSON.stringify(
    snapshot.slots.map((slot) => [slot.date, slot.hour]),
  );
  const slotChunks = Array.from(
    {
      length: Math.ceil(
        encodedSlots.length / BOOKING_SLOTS_METADATA_CHUNK_SIZE,
      ),
    },
    (_, index) =>
      encodedSlots.slice(
        index * BOOKING_SLOTS_METADATA_CHUNK_SIZE,
        (index + 1) * BOOKING_SLOTS_METADATA_CHUNK_SIZE,
      ),
  );
  if (
    !slotChunks.length ||
    slotChunks.length > MAX_BOOKING_SLOTS_METADATA_CHUNKS
  ) {
    throw new Error("Too many appointment slots were selected.");
  }

  const metadata: Record<string, string> = {
    type: "booking",
    bookingDataVersion: "2",
    serviceType: snapshot.serviceType,
    priority: snapshot.priority,
    countryCode: snapshot.countryCode,
    slotCount: String(snapshot.slots.length),
    slotsDigest: buildBookingSlotsDigest(snapshot.slots),
    bookingSlotsChunks: String(slotChunks.length),
    locale: snapshot.locale,
    customerName: snapshot.name,
    customerPhone: snapshot.phone,
    customerCompany: snapshot.company || "",
    customerNotes: snapshot.notes,
    packageKey: snapshot.packageKey || "",
    bookingCheckoutDigest: buildBookingCheckoutDigest(snapshot),
  };
  slotChunks.forEach((chunk, index) => {
    metadata[`bookingSlots${index + 1}`] = chunk;
  });
  return metadata;
}

export function parseBookingPaymentMetadata(
  metadata: Record<string, string> | null | undefined,
): BookingPaymentSnapshot | null {
  if (
    !metadata ||
    metadata.type !== "booking" ||
    metadata.bookingDataVersion !== "2"
  ) {
    return null;
  }

  const chunkCount = Number(metadata.bookingSlotsChunks);
  if (
    !Number.isInteger(chunkCount) ||
    chunkCount < 1 ||
    chunkCount > MAX_BOOKING_SLOTS_METADATA_CHUNKS
  ) {
    throw new Error("Booking payment metadata is incomplete.");
  }

  let decoded: unknown;
  try {
    const encoded = Array.from(
      { length: chunkCount },
      (_, index) => metadata[`bookingSlots${index + 1}`] || "",
    ).join("");
    decoded = JSON.parse(encoded);
  } catch {
    throw new Error("Booking payment metadata contains invalid slots.");
  }

  if (!Array.isArray(decoded)) {
    throw new Error("Booking payment metadata contains invalid slots.");
  }
  const slots = decoded.map((value) => {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(value[0] || "")) ||
      !Number.isInteger(Number(value[1]))
    ) {
      throw new Error("Booking payment metadata contains invalid slots.");
    }
    return { date: String(value[0]), hour: Number(value[1]) };
  });

  const serviceType =
    metadata.serviceType === "support"
      ? "support"
      : metadata.serviceType === "consultation"
        ? "consultation"
        : null;
  const priority =
    metadata.priority === "express"
      ? "express"
      : metadata.priority === "standard"
        ? "standard"
        : null;
  if (!serviceType || !priority) {
    throw new Error(
      "Booking payment metadata contains an invalid booking type.",
    );
  }

  const snapshot = normalizeBookingPaymentSnapshot({
    serviceType,
    priority,
    countryCode: metadata.countryCode,
    slots,
    locale:
      metadata.locale === "fr" || metadata.locale === "ar"
        ? metadata.locale
        : "en",
    name: metadata.customerName,
    phone: metadata.customerPhone,
    company: metadata.customerCompany,
    notes: metadata.customerNotes,
    packageKey: metadata.packageKey,
  });

  if (
    metadata.slotCount !== String(snapshot.slots.length) ||
    metadata.slotsDigest !== buildBookingSlotsDigest(snapshot.slots) ||
    metadata.bookingCheckoutDigest !== buildBookingCheckoutDigest(snapshot)
  ) {
    throw new Error("Booking payment metadata failed integrity checks.");
  }

  return snapshot;
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
  checkoutAttemptId: string;
  name: string;
  phone: string;
  company?: string | null;
  notes: string;
  packageKey?: string | null;
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const unitAmount = getBookingPrice(
    input.priority,
    input.serviceType,
    input.countryCode,
  );
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

  const bookingMetadata = buildBookingPaymentMetadata({
    serviceType: input.serviceType,
    priority: input.priority,
    countryCode: input.countryCode || "",
    slots: input.slots,
    locale: input.locale,
    name: input.name,
    phone: input.phone,
    company: input.company ?? null,
    notes: input.notes,
    packageKey: input.packageKey ?? null,
  });

  const intent = await stripe.paymentIntents.create(
    {
      amount,
      currency: getStripeCurrency(),
      receipt_email: input.email,
      capture_method: "manual",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...bookingMetadata,
        checkoutAttemptId: input.checkoutAttemptId,
        userId: input.userId,
        email: input.email,
        bookingSubtotalCents: String(subtotal),
        cardPaymentFeeCents: String(cardPaymentFeeCents),
        bookingTotalCents: String(amount),
      },
    },
    {
      idempotencyKey: `booking-${crypto
        .createHash("sha256")
        .update(
          `${input.userId}:${input.checkoutAttemptId}:${bookingMetadata.bookingCheckoutDigest}:${amount}:${getStripeCurrency()}`,
        )
        .digest("hex")}`,
    },
  );

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
    throw new Error(
      "Stripe pricing is not configured for this training program.",
    );
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

export class BookingPaymentAlreadyRefundedError extends Error {
  constructor(readonly paymentIntentId: string) {
    super("This payment has already been refunded.");
  }
}

function assertPaymentIntentNotRefunded(intent: Stripe.PaymentIntent) {
  const latestCharge = intent.latest_charge;
  if (
    latestCharge &&
    typeof latestCharge !== "string" &&
    (latestCharge.refunded || latestCharge.amount_refunded > 0)
  ) {
    throw new BookingPaymentAlreadyRefundedError(intent.id);
  }
}

/** Refresh webhook payloads before booking fulfillment or capture. */
export async function retrieveBookingPaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured.");

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  if (intent.metadata?.type !== "booking") {
    throw new Error("Payment does not match a booking purchase.");
  }
  assertPaymentIntentNotRefunded(intent);
  return intent;
}

export async function verifyBookingPayment(input: {
  paymentIntentId: string;
  userId: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  countryCode?: string | null;
  slots: Array<{ date: string; hour: number }>;
  checkout?: {
    locale: "en" | "fr" | "ar";
    name: string;
    phone: string;
    company?: string | null;
    notes: string;
    packageKey?: string | null;
  };
}) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const pricingCountryCode = input.countryCode || null;
  const unitAmount = getBookingPrice(
    input.priority,
    input.serviceType,
    pricingCountryCode,
  );
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

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId, {
    expand: ["latest_charge"],
  });
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded" && intent.status !== "requires_capture") {
    throw new Error("Payment has not been completed.");
  }
  assertPaymentIntentNotRefunded(intent);

  if (intent.metadata?.type !== "booking") {
    throw new Error("Payment does not match a booking purchase.");
  }

  const metadataAmount = Number(intent.metadata?.bookingTotalCents || "");
  const expectedAmount =
    Number.isInteger(metadataAmount) && metadataAmount > 0
      ? metadataAmount
      : amount;
  const amountMatches =
    intent.amount === expectedAmount ||
    (!intent.metadata?.bookingTotalCents && intent.amount === subtotal);
  if (!amountMatches || intent.currency.toLowerCase() !== getStripeCurrency()) {
    throw new Error("Payment amount does not match this booking type.");
  }

  if (intent.metadata?.userId !== input.userId) {
    throw new Error("Payment does not belong to this user.");
  }

  if (
    intent.metadata?.serviceType !== input.serviceType ||
    intent.metadata?.priority !== input.priority
  ) {
    throw new Error("Payment does not match the selected booking type.");
  }

  if (intent.metadata?.slotCount !== String(slotCount)) {
    throw new Error(
      "Payment does not match the selected number of appointments.",
    );
  }

  if (intent.metadata?.slotsDigest !== buildBookingSlotsDigest(input.slots)) {
    throw new Error("Payment does not match the selected appointment slots.");
  }

  const metadataSnapshot = parseBookingPaymentMetadata(intent.metadata);
  if (metadataSnapshot && input.checkout) {
    const expectedSnapshot = normalizeBookingPaymentSnapshot({
      serviceType: input.serviceType,
      priority: input.priority,
      countryCode: input.countryCode,
      slots: input.slots,
      ...input.checkout,
    });
    if (
      buildBookingCheckoutDigest(metadataSnapshot) !==
      buildBookingCheckoutDigest(expectedSnapshot)
    ) {
      throw new Error("Payment does not match the submitted booking details.");
    }
  }

  return intent;
}

export async function captureBookingPaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured.");

  const intent = await retrieveBookingPaymentIntent(paymentIntentId);
  if (intent.status === "succeeded") return intent;
  if (intent.status !== "requires_capture") {
    throw new Error("Booking payment is not ready to be captured.");
  }

  return stripe.paymentIntents.capture(
    paymentIntentId,
    {},
    { idempotencyKey: `capture-booking-${paymentIntentId}` },
  );
}

export async function cancelBookingPaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured.");

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status === "canceled" || intent.status === "succeeded") {
    return intent;
  }

  return stripe.paymentIntents.cancel(
    paymentIntentId,
    {},
    { idempotencyKey: `cancel-booking-${paymentIntentId}` },
  );
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
    throw new Error(
      "Stripe pricing is not configured for this training program.",
    );
  }
  const cardPaymentFeeCents = getCardPaymentFeeCents();
  const amount = subtotal + cardPaymentFeeCents;

  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId, {
    expand: ["latest_charge"],
  });
  if (!intent) {
    throw new Error("Payment intent not found.");
  }

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not been completed.");
  }
  assertPaymentIntentNotRefunded(intent);

  const metadataAmount = Number(intent.metadata?.trainingPriceCents || "");
  const expectedAmount =
    Number.isInteger(metadataAmount) && metadataAmount > 0
      ? metadataAmount
      : amount;
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
  idempotencyKey?: string;
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

  const refund = await stripe.refunds.create(
    {
      payment_intent: input.paymentIntentId,
      amount: input.amount,
      reason: input.reason || "requested_by_customer",
      metadata: {
        bookingIds: input.bookingIds.join(","),
      },
    },
    input.idempotencyKey
      ? { idempotencyKey: input.idempotencyKey }
      : undefined,
  );

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
