import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";
import type { BookingRecord } from "./bookingStore";
import { getBookingInvoiceStatus } from "./bookingStore";

export type InvoiceStatus = "issued";

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  userId: string;
  status: InvoiceStatus;
  issuedAt: string;
  updatedAt: string;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  serviceType: BookingRecord["serviceType"];
  priority: BookingRecord["priority"];
  date: string;
  hour: number;
  locale: BookingRecord["locale"];
  name: string;
  email: string;
  phone: string;
  country: string | null;
  company: string | null;
  paymentReference: string | null;
  paymentProvider: BookingRecord["paymentProvider"];
};

type InvoiceDb = {
  lastSequence: number;
  invoices: InvoiceRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "invoices-db.json");

function nowIso() {
  return new Date().toISOString();
}

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { lastSequence: 0, invoices: [] });
}

function loadDb(): InvoiceDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<InvoiceDb>>(DB_PATH);
  return {
    lastSequence: Number.isInteger(parsed.lastSequence) ? Number(parsed.lastSequence) : 0,
    invoices: (parsed.invoices ?? []).map((invoice) => ({
      ...invoice,
      currency: typeof invoice.currency === "string" && invoice.currency.trim() ? invoice.currency.trim().toLowerCase() : "cad",
    })),
  };
}

function saveDb(db: InvoiceDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function randomId() {
  return `inv_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function nextInvoiceNumber(db: InvoiceDb) {
  db.lastSequence += 1;
  const date = new Date();
  const dateKey = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
  const sequence = String(db.lastSequence).padStart(4, "0");
  return `CV-INV-${dateKey}-${sequence}`;
}

function canIssueInvoice(booking: BookingRecord) {
  return (
    getBookingInvoiceStatus(booking) === "ready" &&
    booking.status === "confirmed" &&
    (booking.paymentStatus === "paid" || booking.paymentStatus === "partially_refunded") &&
    booking.paymentProvider === "stripe" &&
    !!booking.paymentReference
  );
}

function createInvoiceRecord(db: InvoiceDb, booking: BookingRecord) {
  const timestamp = nowIso();
  const invoice: InvoiceRecord = {
    id: randomId(),
    invoiceNumber: nextInvoiceNumber(db),
    bookingId: booking.id,
    userId: booking.userId,
    status: "issued",
    issuedAt: timestamp,
    updatedAt: timestamp,
    currency: booking.currency || "cad",
    subtotalAmount: booking.unitAmount,
    taxAmount: 0,
    totalAmount: booking.unitAmount,
    serviceType: booking.serviceType,
    priority: booking.priority,
    date: booking.date,
    hour: booking.hour,
    locale: booking.locale,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    country: booking.country ?? null,
    company: booking.company ?? null,
    paymentReference: booking.paymentReference,
    paymentProvider: booking.paymentProvider,
  };
  db.invoices.push(invoice);
  return invoice;
}

export function getInvoiceById(invoiceId: string) {
  const db = loadDb();
  return db.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
}

export function getInvoiceByBookingId(bookingId: string) {
  const db = loadDb();
  return db.invoices.find((invoice) => invoice.bookingId === bookingId) ?? null;
}

export function issueInvoiceForBooking(booking: BookingRecord) {
  if (!canIssueInvoice(booking)) {
    return null;
  }

  const db = loadDb();
  const existing = db.invoices.find((invoice) => invoice.bookingId === booking.id);
  if (existing) {
    return existing;
  }

  const invoice = createInvoiceRecord(db, booking);
  saveDb(db);
  return invoice;
}

export function issueInvoicesForBookings(bookings: BookingRecord[]) {
  const db = loadDb();
  let changed = false;

  for (const booking of bookings) {
    if (!canIssueInvoice(booking)) continue;
    const existing = db.invoices.find((invoice) => invoice.bookingId === booking.id);
    if (existing) continue;
    createInvoiceRecord(db, booking);
    changed = true;
  }

  if (changed) {
    saveDb(db);
  }

  return db.invoices.filter((invoice) => bookings.some((booking) => booking.id === invoice.bookingId));
}

export function listInvoicesForUser(userId: string, email?: string | null) {
  const db = loadDb();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  return [...db.invoices]
    .filter((invoice) => invoice.userId === userId || (!!normalizedEmail && invoice.email === normalizedEmail))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}
