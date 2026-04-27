import type {
  BookingPriority,
  BookingSlot,
  CreateBookingPayload,
} from "./contracts";

export type BookingHoursConfig = {
  timezone: string;
  standardHours: number[];
  expressHours: number[];
  lunchBreakStart: number;
  lunchBreakEnd: number;
};

function createHourRange(start: number, end: number, excluded: number[] = []) {
  const blocked = new Set(excluded);
  const hours: number[] = [];
  for (let hour = start; hour <= end; hour += 1) {
    if (!blocked.has(hour)) {
      hours.push(hour);
    }
  }
  return hours;
}

function requireText(value: unknown, message: string) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

export function createBookingHoursConfig(
  overrides: Partial<BookingHoursConfig> = {}
): BookingHoursConfig {
  return {
    timezone: overrides.timezone || "America/Toronto",
    standardHours:
      overrides.standardHours || createHourRange(8, 17, [12]),
    expressHours:
      overrides.expressHours || createHourRange(8, 21, [12]),
    lunchBreakStart: overrides.lunchBreakStart ?? 12,
    lunchBreakEnd: overrides.lunchBreakEnd ?? 13,
  };
}

export function toBookingSlotId(slot: BookingSlot, priority: BookingPriority) {
  return `${slot.date}:${slot.hour}:${priority}`;
}

export function isBookableHour(
  priority: BookingPriority,
  hour: number,
  config: BookingHoursConfig = createBookingHoursConfig()
) {
  const source = priority === "express" ? config.expressHours : config.standardHours;
  return source.includes(hour);
}

export function calculateBookingCharge(input: {
  unitAmountCents: number;
  slotCount: number;
  cardPaymentFeeCents?: number;
}) {
  const unitAmountCents =
    Number.isInteger(input.unitAmountCents) && Number(input.unitAmountCents) > 0
      ? Number(input.unitAmountCents)
      : 0;
  const slotCount =
    Number.isInteger(input.slotCount) && Number(input.slotCount) > 0
      ? Number(input.slotCount)
      : 0;
  const cardPaymentFeeCents =
    Number.isInteger(input.cardPaymentFeeCents) && Number(input.cardPaymentFeeCents) > 0
      ? Number(input.cardPaymentFeeCents)
      : 0;

  const subtotal = unitAmountCents * slotCount;
  return {
    unitAmountCents,
    slotCount,
    subtotalCents: subtotal,
    cardPaymentFeeCents,
    totalCents: subtotal + cardPaymentFeeCents,
  };
}

export function validateCreateBookingPayload(
  payload: CreateBookingPayload
): CreateBookingPayload {
  if (!Array.isArray(payload.slots) || payload.slots.length === 0) {
    throw new Error("At least one booking slot is required.");
  }

  return {
    ...payload,
    packageKey: payload.packageKey?.trim() || null,
    regionCode: payload.regionCode?.trim() || null,
    name: requireText(payload.name, "Name is required."),
    email: requireText(payload.email, "Email is required.").toLowerCase(),
    phone: requireText(payload.phone, "Phone is required."),
    country: requireText(payload.country, "Country is required."),
    company: String(payload.company || "").trim(),
    notes: String(payload.notes || "").trim(),
    locale: requireText(payload.locale, "Locale is required.") as CreateBookingPayload["locale"],
    paymentIntentId: payload.paymentIntentId?.trim() || undefined,
    slots: payload.slots.map((slot) => ({
      date: requireText(slot.date, "Slot date is required."),
      hour:
        Number.isInteger(slot.hour) && Number(slot.hour) >= 0 && Number(slot.hour) <= 23
          ? Number(slot.hour)
          : (() => {
              throw new Error("Slot hour is invalid.");
            })(),
    })),
  };
}
