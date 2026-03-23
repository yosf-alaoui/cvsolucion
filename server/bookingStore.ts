import crypto from "crypto";
import fs from "fs";
import path from "path";

export type BookingPriority = "standard" | "express";
export type BookingServiceType = "consultation" | "support";

export type BookingRecord = {
  id: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  notes: string | null;
  locale: "en" | "fr" | "ar";
  status: "confirmed";
  createdAt: string;
};

type BookingDb = {
  bookings: BookingRecord[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "bookings-db.json");
const QUEBEC_TIMEZONE = "America/Toronto";
const STANDARD_HOURS = [8, 9, 10, 11, 13, 14, 15, 16, 17];
const EXPRESS_HOURS = [19, 20, 21];

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
  return { bookings: parsed.bookings ?? [] };
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

function startOfWeek(dateKey: string) {
  return addDays(dateKey, -(getWeekdayIndex(dateKey) - 1));
}

function getHoursForPriority(priority: BookingPriority) {
  return priority === "express" ? EXPRESS_HOURS : STANDARD_HOURS;
}

function buildSlotId(date: string, hour: number, priority: BookingPriority) {
  return `${date}:${String(hour).padStart(2, "0")}:${priority}`;
}

function buildShowcaseBookedIds(startDate: string, daysAhead = 31) {
  const booked = new Set<string>();
  const weeks = new Set<string>();

  for (let index = 0; index < daysAhead; index += 1) {
    weeks.add(startOfWeek(addDays(startDate, index)));
  }

  Array.from(weeks)
    .sort()
    .forEach((weekStart, index) => {
      const patterns =
        index % 2 === 0
          ? [
              { offset: 1, hour: 9 },
              { offset: 3, hour: 15 },
              { offset: 4, hour: 10 },
            ]
          : [
              { offset: 0, hour: 10 },
              { offset: 0, hour: 11 },
              { offset: 2, hour: 16 },
            ];

      patterns.forEach((pattern) => {
        const date = addDays(weekStart, pattern.offset);
        booked.add(buildSlotId(date, pattern.hour, "standard"));
      });

      booked.add(buildSlotId(addDays(weekStart, 1), 19, "express"));
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

export function listBookings() {
  const db = loadDb();
  return sortBookings(db.bookings);
}

export function getBookingAvailability(priority: BookingPriority) {
  const db = loadDb();
  const quebecNow = getQuebecNow();
  const startDate = quebecNow.dateKey;
  const showcaseBooked = buildShowcaseBookedIds(startDate);
  const hours = getHoursForPriority(priority);
  const days = [];

  for (let index = 0; index < 31; index += 1) {
    const date = addDays(startDate, index);
    const weekdayIndex = getWeekdayIndex(date);
    if (weekdayIndex > 5) continue;

    const slots = hours
      .filter((hour) => !(date === quebecNow.dateKey && hour <= quebecNow.hour))
      .map((hour) => {
        const slotId = buildSlotId(date, hour, priority);
        const actualBooking = db.bookings.find(
          (booking) => booking.date === date && booking.hour === hour && booking.priority === priority
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
      endDate: addDays(startDate, 30),
    },
    rules: {
      standardHours: STANDARD_HOURS,
      expressHours: EXPRESS_HOURS,
      lunchBreak: "12:00-13:00",
    },
  };
}

export function createBooking(input: {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  notes?: string | null;
  locale: "en" | "fr" | "ar";
}) {
  const db = loadDb();
  const quebecNow = getQuebecNow();
  const showcaseBooked = buildShowcaseBookedIds(quebecNow.dateKey);
  const hours = getHoursForPriority(input.priority);
  const dateDiff =
    (parseDateKey(input.date).getTime() - parseDateKey(quebecNow.dateKey).getTime()) / (1000 * 60 * 60 * 24);

  if (dateDiff < 0 || dateDiff > 30) {
    throw new Error("Selected slot must be within the next 30 days.");
  }

  if (!hours.includes(input.hour)) {
    throw new Error("Selected slot is outside bookable hours.");
  }

  if (input.date === quebecNow.dateKey && input.hour <= quebecNow.hour) {
    throw new Error("Selected slot is no longer available.");
  }

  const weekdayIndex = getWeekdayIndex(input.date);
  if (weekdayIndex > 5) {
    throw new Error("Bookings are available Monday to Friday only.");
  }

  const slotId = buildSlotId(input.date, input.hour, input.priority);
  const alreadyBooked = db.bookings.some(
    (booking) => booking.date === input.date && booking.hour === input.hour && booking.priority === input.priority
  );

  if (alreadyBooked || showcaseBooked.has(slotId)) {
    throw new Error("This slot has just been taken. Please choose another time.");
  }

  const booking: BookingRecord = {
    id: randomId(),
    serviceType: input.serviceType,
    priority: input.priority,
    date: input.date,
    hour: input.hour,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    company: input.company?.trim() || null,
    notes: input.notes?.trim() || null,
    locale: input.locale,
    status: "confirmed",
    createdAt: nowIso(),
  };

  db.bookings.push(booking);
  saveDb(db);
  return booking;
}
