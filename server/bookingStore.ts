import crypto from "crypto";
import fs from "fs";
import path from "path";

export type BookingPriority = "standard" | "express";
export type BookingServiceType = "consultation" | "support";
export type BookingStatus = "confirmed" | "cancelled";
export type BookingPaymentStatus = "pending" | "paid" | "unpaid" | "partially_refunded" | "refunded";
export type BookingRefundStatus = "none" | "pending" | "succeeded" | "failed" | "canceled";

export type BookingRecord = {
  id: string;
  userId: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  country: string | null;
  company: string | null;
  notes: string | null;
  locale: "en" | "fr" | "ar";
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  rescheduledFromBookingId: string | null;
  paymentStatus: BookingPaymentStatus;
  paymentProvider: "stripe" | null;
  paymentReference: string | null;
  unitAmount: number;
  refundStatus: BookingRefundStatus;
  refundReference: string | null;
  refundAmount: number;
  refundedAt: string | null;
};

type BookingDb = {
  bookings: BookingRecord[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "bookings-db.json");
const QUEBEC_TIMEZONE = "America/Toronto";
const STANDARD_HOURS = [8, 9, 10, 11, 13, 14, 15, 16, 17];
const EXPRESS_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ bookings: [] }, null, 2), "utf8");
  }
}

function loadDb(): BookingDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<BookingDb>;
  return {
    bookings: (parsed.bookings ?? []).map((booking) => ({
      ...booking,
      userId: booking.userId ?? "",
      country: booking.country ?? null,
      status: booking.status ?? "confirmed",
      updatedAt: booking.updatedAt ?? booking.createdAt ?? nowIso(),
      rescheduledFromBookingId: booking.rescheduledFromBookingId ?? null,
      paymentStatus: booking.paymentStatus ?? "unpaid",
      paymentProvider: booking.paymentProvider ?? null,
      paymentReference: booking.paymentReference ?? null,
      unitAmount: resolveBookingUnitAmount(booking),
      refundStatus: booking.refundStatus ?? "none",
      refundReference: booking.refundReference ?? null,
      refundAmount: Number.isFinite(booking.refundAmount) ? Number(booking.refundAmount) : 0,
      refundedAt: booking.refundedAt ?? null,
    })),
  };
}

function saveDb(db: BookingDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 16) {
  return crypto.randomBytes(size).toString("hex");
}

function parseAmount(value: string | undefined) {
  const amount = Number(value || "");
  return Number.isInteger(amount) && amount > 0 ? amount : 0;
}

function resolveBookingUnitAmount(booking: Partial<BookingRecord>) {
  if (Number.isInteger(booking.unitAmount) && Number(booking.unitAmount) > 0) {
    return Number(booking.unitAmount);
  }

  const serviceType = booking.serviceType === "support" ? "support" : "consultation";
  const priority = booking.priority === "express" ? "express" : "standard";

  const envKey =
    priority === "express"
      ? serviceType === "support"
        ? "STRIPE_PRICE_EXPRESS_SUPPORT"
        : "STRIPE_PRICE_EXPRESS_CONSULTATION"
      : serviceType === "support"
        ? "STRIPE_PRICE_STANDARD_SUPPORT"
        : "STRIPE_PRICE_STANDARD_CONSULTATION";

  return parseAmount(process.env[envKey]);
}

function dateKeyParts(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error("Invalid date.");
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const { year, month, day } = dateKeyParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function formatInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    weekday: values.weekday,
    dateKey: `${values.year}-${values.month}-${values.day}`,
  };
}

function getQuebecNow() {
  return formatInTimeZone(new Date(), QUEBEC_TIMEZONE);
}

function getWeekdayIndex(dateKey: string) {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

function getHoursForPriority(priority: BookingPriority) {
  return priority === "express" ? EXPRESS_HOURS : STANDARD_HOURS;
}

function getBookableHoursForDate(priority: BookingPriority, date: string, startDate: string, currentHour: number) {
  const hours = getHoursForPriority(priority);

  if (priority === "express") {
    if (date === startDate) {
      return hours.filter((hour) => hour > currentHour && hour <= 21);
    }
    return date === addDays(startDate, 1) ? hours : [];
  }

  if (date === startDate) {
    return hours.filter((hour) => hour > currentHour);
  }

  return hours;
}

function buildSlotId(date: string, hour: number, priority: BookingPriority) {
  return `${date}:${String(hour).padStart(2, "0")}:${priority}`;
}

function getUpcomingBusinessDates(startDate: string, count: number) {
  const dates: string[] = [];
  let cursor = startDate;

  while (dates.length < count) {
    if (getWeekdayIndex(cursor) <= 5) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function addShowcaseBlock(booked: Set<string>, date: string, startHour: number) {
  const hours = getHoursForPriority("standard");
  const index = hours.indexOf(startHour);
  if (index === -1) return;

  booked.add(buildSlotId(date, startHour, "standard"));
  const nextHour = hours[index + 1];
  if (typeof nextHour === "number" && nextHour - startHour === 1) {
    booked.add(buildSlotId(date, nextHour, "standard"));
  }
}

function buildShowcaseBookedIds(startDate: string, daysAhead = 31) {
  const booked = new Set<string>();
  const businessDates = getUpcomingBusinessDates(startDate, Math.max(daysAhead, 9));
  const today = businessDates[0];
  const nextDay = businessDates[1];
  const nextSevenDays = businessDates.slice(2, 9);

  if (today === startDate) {
    STANDARD_HOURS.forEach((hour) => {
      booked.add(buildSlotId(today, hour, "standard"));
    });
  }

  if (nextDay) {
    [8, 9, 10, 11].forEach((hour) => {
      booked.add(buildSlotId(nextDay, hour, "standard"));
    });
  }

  const patterns = [
    { dayIndex: 0, hour: 13 },
    { dayIndex: 1, hour: 9 },
    { dayIndex: 2, hour: 15 },
    { dayIndex: 4, hour: 10 },
    { dayIndex: 6, hour: 14 },
  ];

  patterns.forEach((pattern, index) => {
    const date = nextSevenDays[pattern.dayIndex] ?? nextSevenDays[index] ?? null;
    if (!date) return;
    addShowcaseBlock(booked, date, pattern.hour);
  });

  return booked;
}

function sortBookings(items: BookingRecord[]) {
  return [...items].sort((a, b) => {
    const slotA = `${a.date}-${String(a.hour).padStart(2, "0")}`;
    const slotB = `${b.date}-${String(b.hour).padStart(2, "0")}`;
    return slotA.localeCompare(slotB);
  });
}

function getBookingUtcMs(dateKey: string, hour: number) {
  const { year, month, day } = dateKeyParts(dateKey);
  let utcMs = Date.UTC(year, month - 1, day, hour, 0, 0);

  for (let index = 0; index < 4; index += 1) {
    const zoned = formatInTimeZone(new Date(utcMs), QUEBEC_TIMEZONE);
    const targetMs = Date.UTC(year, month - 1, day, hour, 0, 0);
    const zonedMs = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, 0, 0);
    const diffMs = targetMs - zonedMs;
    if (diffMs === 0) break;
    utcMs += diffMs;
  }

  return utcMs;
}

function canRescheduleBooking(booking: BookingRecord) {
  const bookingUtcMs = getBookingUtcMs(booking.date, booking.hour);
  return bookingUtcMs - Date.now() > 1000 * 60 * 60 * 12;
}

export function listBookings() {
  const db = loadDb();
  return sortBookings(db.bookings);
}

export function listBookingsForUser(userId: string, email?: string | null) {
  const db = loadDb();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  return sortBookings(
    db.bookings.filter(
      (booking) => booking.userId === userId || (!!normalizedEmail && !booking.userId && booking.email === normalizedEmail)
    )
  );
}

export function listBookingsByPaymentReference(paymentReference: string) {
  const db = loadDb();
  return sortBookings(
    db.bookings.filter((booking) => booking.paymentReference && booking.paymentReference === paymentReference)
  );
}

export function getBookingAvailability(priority: BookingPriority) {
  const db = loadDb();
  const quebecNow = getQuebecNow();
  const startDate = quebecNow.dateKey;
  const showcaseBooked = buildShowcaseBookedIds(startDate);
  const days = [];

  const maxDays = priority === "express" ? 2 : 31;

  for (let index = 0; index < maxDays; index += 1) {
    const date = addDays(startDate, index);
    const weekdayIndex = getWeekdayIndex(date);
    if (priority === "standard" && weekdayIndex > 5) continue;

    const hours = getBookableHoursForDate(priority, date, startDate, quebecNow.hour);

    const slots = hours
      .map((hour) => {
        const slotId = buildSlotId(date, hour, priority);
        const actualBooking = db.bookings.find(
          (booking) => booking.date === date && booking.hour === hour && booking.priority === priority && booking.status === "confirmed"
        );
        const showcase = showcaseBooked.has(slotId);

        return {
          id: slotId,
          date,
          hour,
          priority,
          status: actualBooking || showcase ? "booked" : "available",
          source: actualBooking ? "real" : showcase ? "showcase" : "available",
        };
      });

    if (slots.length) {
      days.push({ date, slots });
    }
  }

  return {
    timeZone: QUEBEC_TIMEZONE,
    priority,
    days,
    window: {
      startDate,
      endDate: addDays(startDate, priority === "express" ? 1 : 30),
    },
    rules: {
      standardHours: STANDARD_HOURS,
      expressHours: EXPRESS_HOURS,
      lunchBreak: "12:00-13:00",
    },
  };
}

export function createBooking(input: {
  userId: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  country?: string | null;
  company?: string | null;
  notes?: string | null;
  locale: "en" | "fr" | "ar";
  paymentStatus?: BookingPaymentStatus;
  paymentProvider?: BookingRecord["paymentProvider"];
  paymentReference?: string | null;
}) {
  const db = loadDb();
  const quebecNow = getQuebecNow();
  const showcaseBooked = buildShowcaseBookedIds(quebecNow.dateKey);
  const hours =
    input.priority === "express"
      ? getHoursForPriority(input.priority)
      : getHoursForPriority(input.priority);
  const dateDiff =
    (parseDateKey(input.date).getTime() - parseDateKey(quebecNow.dateKey).getTime()) / (1000 * 60 * 60 * 24);

  if (input.priority === "express") {
    if (dateDiff < 0 || dateDiff > 1) {
      throw new Error("Express booking is available for today and tomorrow only.");
    }
  } else if (dateDiff < 0 || dateDiff > 30) {
    throw new Error("Selected slot must be within the next 30 days.");
  }

  if (!hours.includes(input.hour)) {
    throw new Error("Selected slot is outside bookable hours.");
  }

  if (input.date === quebecNow.dateKey && input.hour <= quebecNow.hour) {
    throw new Error("Selected slot is no longer available.");
  }

  const weekdayIndex = getWeekdayIndex(input.date);
  if (input.priority === "standard" && weekdayIndex > 5) {
    throw new Error("Bookings are available Monday to Friday only.");
  }

  if (input.priority === "express" && input.hour > 21) {
    throw new Error("Express booking is available until 9 PM Quebec time.");
  }

  const slotId = buildSlotId(input.date, input.hour, input.priority);
  const alreadyBooked = db.bookings.some(
    (booking) =>
      booking.date === input.date &&
      booking.hour === input.hour &&
      booking.priority === input.priority &&
      booking.status === "confirmed"
  );

  if (alreadyBooked || showcaseBooked.has(slotId)) {
    throw new Error("This slot has just been taken. Please choose another time.");
  }

  const booking: BookingRecord = {
    id: randomId(),
    userId: input.userId,
    serviceType: input.serviceType,
    priority: input.priority,
    date: input.date,
    hour: input.hour,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    country: input.country?.trim() || null,
    company: input.company?.trim() || null,
    notes: input.notes?.trim() || null,
    locale: input.locale,
    status: "confirmed",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    rescheduledFromBookingId: null,
    paymentStatus: input.paymentStatus ?? "unpaid",
    paymentProvider: input.paymentProvider ?? null,
    paymentReference: input.paymentReference ?? null,
    unitAmount: resolveBookingUnitAmount({
      serviceType: input.serviceType,
      priority: input.priority,
    }),
    refundStatus: "none",
    refundReference: null,
    refundAmount: 0,
    refundedAt: null,
  };

  db.bookings.push(booking);
  saveDb(db);
  return booking;
}

type StripeRefundSyncStatus = "pending" | "succeeded" | "failed" | "canceled";

export type StripeRefundSyncResult = {
  paymentReference: string;
  refundId: string;
  refundStatus: StripeRefundSyncStatus;
  refundAmount: number;
  currency: string | null;
  scope: "full" | "partial" | "manual" | "none";
  groupBookings: BookingRecord[];
  affectedBookings: BookingRecord[];
  customer: {
    email: string | null;
    name: string | null;
    locale: "en" | "fr" | "ar";
  } | null;
};

function getRefundableBookings(bookings: BookingRecord[]) {
  return bookings.filter((booking) => booking.paymentStatus !== "refunded");
}

function sortBookingsLatestFirst(bookings: BookingRecord[]) {
  return [...bookings].sort((a, b) => {
    const slotA = `${a.date}-${String(a.hour).padStart(2, "0")}`;
    const slotB = `${b.date}-${String(b.hour).padStart(2, "0")}`;
    return slotB.localeCompare(slotA);
  });
}

function selectBookingsForRefund(bookings: BookingRecord[], refundAmount: number) {
  const refundable = sortBookingsLatestFirst(getRefundableBookings(bookings));
  if (!refundable.length || refundAmount <= 0) {
    return { scope: "none" as const, affectedBookings: [] as BookingRecord[] };
  }

  const totalAmount = refundable.reduce((sum, booking) => sum + booking.unitAmount, 0);
  if (refundAmount >= totalAmount) {
    return { scope: "full" as const, affectedBookings: refundable };
  }

  const unitAmount = refundable[0]?.unitAmount || 0;
  const homogeneousUnitAmount = refundable.every((booking) => booking.unitAmount === unitAmount);
  if (!homogeneousUnitAmount || !unitAmount || refundAmount % unitAmount !== 0) {
    return { scope: "manual" as const, affectedBookings: [] as BookingRecord[] };
  }

  const slotCount = refundAmount / unitAmount;
  if (!Number.isInteger(slotCount) || slotCount <= 0) {
    return { scope: "manual" as const, affectedBookings: [] as BookingRecord[] };
  }

  return {
    scope: "partial" as const,
    affectedBookings: refundable.slice(0, slotCount),
  };
}

export function applyStripeRefundUpdate(input: {
  paymentReference: string;
  refundId: string;
  refundAmount: number;
  currency?: string | null;
  refundStatus: StripeRefundSyncStatus;
}) {
  const db = loadDb();
  const relatedBookings = sortBookings(
    db.bookings.filter((booking) => booking.paymentReference && booking.paymentReference === input.paymentReference)
  );

  if (!relatedBookings.length) {
    return null;
  }

  const { scope, affectedBookings } = selectBookingsForRefund(relatedBookings, input.refundAmount);
  const timestamp = nowIso();
  const normalizedRefundStatus: BookingRefundStatus =
    input.refundStatus === "failed"
      ? "failed"
      : input.refundStatus === "canceled"
        ? "canceled"
        : input.refundStatus === "succeeded"
          ? "succeeded"
          : "pending";

  if (input.refundStatus === "pending") {
    const pendingTargets = scope === "manual" ? relatedBookings : affectedBookings;
    for (const booking of pendingTargets) {
      booking.refundStatus = normalizedRefundStatus;
      booking.refundReference = input.refundId;
      booking.updatedAt = timestamp;
    }
  } else if (input.refundStatus === "succeeded") {
    if (scope === "manual") {
      for (const booking of relatedBookings) {
        if (booking.paymentStatus === "paid") {
          booking.paymentStatus = "partially_refunded";
        }
        booking.refundStatus = normalizedRefundStatus;
        booking.refundReference = input.refundId;
        booking.updatedAt = timestamp;
      }
    } else {
      for (const booking of affectedBookings) {
        booking.status = "cancelled";
        booking.paymentStatus = "refunded";
        booking.refundStatus = normalizedRefundStatus;
        booking.refundReference = input.refundId;
        booking.refundAmount = booking.unitAmount;
        booking.refundedAt = timestamp;
        booking.updatedAt = timestamp;
      }
    }
  } else {
    const failedTargets = relatedBookings.filter(
      (booking) => booking.refundReference === input.refundId || scope === "manual"
    );
    for (const booking of failedTargets) {
      booking.refundStatus = normalizedRefundStatus;
      booking.refundReference = input.refundId;
      booking.updatedAt = timestamp;
    }
  }

  saveDb(db);

  const customerBooking = relatedBookings[0] ?? null;
  return {
    paymentReference: input.paymentReference,
    refundId: input.refundId,
    refundStatus: input.refundStatus,
    refundAmount: input.refundAmount,
    currency: input.currency ?? null,
    scope,
    groupBookings: relatedBookings,
    affectedBookings,
    customer: customerBooking
      ? {
          email: customerBooking.email,
          name: customerBooking.name,
          locale: customerBooking.locale,
        }
      : null,
  } satisfies StripeRefundSyncResult;
}

export function rescheduleBooking(input: {
  bookingId: string;
  userId: string;
  date: string;
  hour: number;
}) {
  const db = loadDb();
  const booking = db.bookings.find((item) => item.id === input.bookingId && item.userId === input.userId);

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!canRescheduleBooking(booking)) {
    throw new Error("This booking can only be changed more than 12 hours before the appointment.");
  }

  const hours = getHoursForPriority(booking.priority);
  const quebecNow = getQuebecNow();
  const showcaseBooked = buildShowcaseBookedIds(quebecNow.dateKey);
  const dateDiff =
    (parseDateKey(input.date).getTime() - parseDateKey(quebecNow.dateKey).getTime()) / (1000 * 60 * 60 * 24);

  if (booking.priority === "express") {
    if (dateDiff < 0 || dateDiff > 1) {
      throw new Error("Express booking is available for today and tomorrow only.");
    }
  } else if (dateDiff < 0 || dateDiff > 30) {
    throw new Error("Selected slot must be within the next 30 days.");
  }

  if (!hours.includes(input.hour)) {
    throw new Error("Selected slot is outside bookable hours.");
  }

  if (input.date === quebecNow.dateKey && input.hour <= quebecNow.hour) {
    throw new Error("Selected slot is no longer available.");
  }

  const weekdayIndex = getWeekdayIndex(input.date);
  if (booking.priority === "standard" && weekdayIndex > 5) {
    throw new Error("Bookings are available Monday to Friday only.");
  }

  const slotId = buildSlotId(input.date, input.hour, booking.priority);
  const isTaken = db.bookings.some(
    (item) =>
      item.id !== booking.id &&
      item.date === input.date &&
      item.hour === input.hour &&
      item.priority === booking.priority &&
      item.status === "confirmed"
  );

  if (isTaken) {
    throw new Error("This slot has just been taken. Please choose another time.");
  }

  if (showcaseBooked.has(slotId)) {
    throw new Error("This slot has just been taken. Please choose another time.");
  }

  booking.date = input.date;
  booking.hour = input.hour;
  booking.updatedAt = nowIso();
  saveDb(db);
  return booking;
}

export function serializeCustomerBooking(booking: BookingRecord) {
  return {
    ...booking,
    canReschedule: canRescheduleBooking(booking),
  };
}
