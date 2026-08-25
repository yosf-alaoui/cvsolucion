import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";
import type { BookingRecord } from "./bookingStore";

export type InvoiceStatus = "requested" | "issued";
export type InvoiceCustomerType = "individual" | "company";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string | null;
  bookingId: string | null;
  userId: string;
  status: InvoiceStatus;
  requestedAt: string;
  issuedAt: string | null;
  updatedAt: string;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxLabel: string | null;
  taxRate: number | null;
  customerType: InvoiceCustomerType;
  customerName: string;
  email: string;
  phone: string | null;
  country: string;
  countryCode: string | null;
  company: string | null;
  billingAddress: string;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  taxId: string | null;
  serviceDescription: string;
  notes: string | null;
  adminNotes: string | null;
  sellerName: string;
  sellerEmail: string | null;
  sellerPhone: string | null;
  sellerAddress: string | null;
  sellerTaxId: string | null;
  sellerWebsite: string | null;
  paymentTerms: string | null;
  dueDate: string | null;
  paymentReference: string | null;
  paymentReferences: string[];
  paymentProvider: BookingRecord["paymentProvider"] | null;
  serviceType: BookingRecord["serviceType"] | null;
  priority: BookingRecord["priority"] | null;
  date: string | null;
  hour: number | null;
  locale: BookingRecord["locale"] | "en";
  lineItems: InvoiceLineItem[];
};

type InvoiceDb = {
  lastSequence: number;
  invoices: InvoiceRecord[];
};

type InvoiceRequestInput = {
  userId: string;
  email: string;
  booking?: BookingRecord | null;
  customerType: InvoiceCustomerType;
  customerName: string;
  phone?: string | null;
  country: string;
  countryCode?: string | null;
  company?: string | null;
  billingAddress: string;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  serviceDescription?: string | null;
  notes?: string | null;
};

type PaidInvoiceRequestInput = {
  userId: string;
  email: string;
  customerType?: InvoiceCustomerType | null;
  customerName?: string | null;
  phone?: string | null;
  country?: string | null;
  countryCode?: string | null;
  company?: string | null;
  billingAddress?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  serviceDescription: string;
  notes?: string | null;
  adminNotes?: string | null;
  currency: string;
  subtotalAmount: number;
  taxAmount?: number | null;
  taxLabel?: string | null;
  taxRate?: number | null;
  paymentReference: string;
  paymentProvider: BookingRecord["paymentProvider"];
  serviceType?: BookingRecord["serviceType"] | null;
  priority?: BookingRecord["priority"] | null;
  locale?: BookingRecord["locale"] | "en";
  lineItems?: InvoiceLineItem[];
};

export type AdminInvoiceUpdateInput = {
  invoiceId: string;
  customerType?: InvoiceCustomerType;
  customerName?: string;
  email?: string;
  phone?: string | null;
  country?: string;
  countryCode?: string | null;
  company?: string | null;
  billingAddress?: string;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  serviceDescription?: string;
  notes?: string | null;
  adminNotes?: string | null;
  sellerName?: string;
  sellerEmail?: string | null;
  sellerPhone?: string | null;
  sellerAddress?: string | null;
  sellerTaxId?: string | null;
  sellerWebsite?: string | null;
  paymentTerms?: string | null;
  dueDate?: string | null;
  currency?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  taxLabel?: string | null;
  taxRate?: number | null;
  lineItems?: InvoiceLineItem[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "invoices-db.json");

function nowIso() {
  return new Date().toISOString();
}

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { lastSequence: 0, invoices: [] });
}

function saveDb(db: InvoiceDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function randomId(prefix = "inv") {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeRequiredText(value: unknown, fallback: string) {
  return normalizeText(value) || fallback;
}

function normalizeCurrency(value: unknown) {
  const currency = String(value || "").trim().toLowerCase();
  return /^[a-z]{3}$/.test(currency) ? currency : "cad";
}

function normalizeCountryCode(value: unknown) {
  const countryCode = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function normalizeAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

function normalizeTaxRate(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const rate = Number(value);
  return Number.isFinite(rate) ? Math.max(0, rate) : null;
}

function uniqueTexts(values: Array<unknown>) {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const text = normalizeText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    normalized.push(text);
  }
  return normalized;
}

function normalizePaymentReferences(raw: any) {
  return uniqueTexts([
    raw.paymentReference,
    ...(Array.isArray(raw.paymentReferences) ? raw.paymentReferences : []),
  ]);
}

function invoicePaymentReferences(invoice: Pick<InvoiceRecord, "paymentReference" | "paymentReferences">) {
  return uniqueTexts([
    invoice.paymentReference,
    ...(Array.isArray(invoice.paymentReferences) ? invoice.paymentReferences : []),
  ]);
}

function defaultSellerEmail() {
  return normalizeText(process.env.CONTACT_EMAIL) || "contact@cvsolucion.com";
}

function defaultSellerName() {
  return normalizeText(process.env.INVOICE_SELLER_NAME) || "Namdaja Service CVsolucion";
}

function defaultSellerPhone() {
  const configuredPhone = normalizeText(process.env.INVOICE_SELLER_PHONE) || "";
  const configuredDigits = configuredPhone.replace(/[^\d]/g, "");
  return !configuredPhone || configuredDigits === "14388078747"
    ? "+1 514 963 8719"
    : configuredPhone;
}

function defaultSellerAddress() {
  return normalizeText(process.env.INVOICE_SELLER_ADDRESS) || "377 Rue st pierre Rimouski, QC Canada";
}

function defaultSellerTaxId() {
  return normalizeText(process.env.INVOICE_SELLER_TAX_ID) || "Not registered for GST/QST";
}

function defaultSellerWebsite() {
  return "https://cvsolucion.com";
}

function normalizeSellerName(value: unknown) {
  const sellerName = normalizeText(value);
  if (!sellerName || sellerName.toLowerCase() === "cvsolucion") return defaultSellerName();
  return sellerName;
}

function defaultServiceDescription(booking?: BookingRecord | null) {
  if (!booking) return "Professional Cabinet Vision services";
  const service = booking.serviceType === "support" ? "Cabinet Vision support" : "Cabinet Vision consultation";
  const priority = booking.priority === "express" ? "Express" : "Standard";
  return `${service} - ${priority}`;
}

function normalizeLineItems(input: unknown, fallbackDescription: string, subtotalAmount: number) {
  const items = Array.isArray(input) ? input : [];
  const normalized = items
    .map((item) => {
      const record = item as Partial<InvoiceLineItem>;
      const quantity = Number(record.quantity);
      const unitAmount = normalizeAmount(record.unitAmount);
      const amount = normalizeAmount(record.amount || Math.round((Number.isFinite(quantity) ? quantity : 1) * unitAmount));
      const description = normalizeText(record.description);
      if (!description || amount <= 0) return null;
      return {
        id: normalizeText(record.id) || randomId("line"),
        description,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unitAmount: unitAmount || amount,
        amount,
      };
    })
    .filter(Boolean) as InvoiceLineItem[];

  if (normalized.length) return normalized;

  return [
    {
      id: randomId("line"),
      description: fallbackDescription,
      quantity: 1,
      unitAmount: subtotalAmount,
      amount: subtotalAmount,
    },
  ];
}

function nextInvoiceNumber(db: InvoiceDb) {
  db.lastSequence += 1;
  const date = new Date();
  const dateKey = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
  const sequence = String(db.lastSequence).padStart(4, "0");
  return `CV-INV-${dateKey}-${sequence}`;
}

function normalizeLegacyInvoice(raw: any): InvoiceRecord {
  const serviceDescription =
    normalizeText(raw.serviceDescription) ||
    defaultServiceDescription(raw.serviceType ? (raw as BookingRecord) : null);
  const subtotalAmount = normalizeAmount(raw.subtotalAmount ?? raw.totalAmount);
  const taxAmount = normalizeAmount(raw.taxAmount);
  const totalAmount = normalizeAmount(raw.totalAmount || subtotalAmount + taxAmount);
  const issuedAt = normalizeText(raw.issuedAt);
  const requestedAt = normalizeText(raw.requestedAt) || issuedAt || normalizeText(raw.createdAt) || nowIso();

  return {
    id: normalizeRequiredText(raw.id, randomId()),
    invoiceNumber: normalizeText(raw.invoiceNumber),
    bookingId: normalizeText(raw.bookingId),
    userId: normalizeRequiredText(raw.userId, ""),
    status: raw.status === "requested" ? "requested" : "issued",
    requestedAt,
    issuedAt,
    updatedAt: normalizeRequiredText(raw.updatedAt, requestedAt),
    currency: normalizeCurrency(raw.currency),
    subtotalAmount,
    taxAmount,
    totalAmount,
    taxLabel: normalizeText(raw.taxLabel),
    taxRate: normalizeTaxRate(raw.taxRate),
    customerType: raw.customerType === "company" ? "company" : "individual",
    customerName: normalizeRequiredText(raw.customerName || raw.name, "Customer"),
    email: normalizeRequiredText(raw.email, ""),
    phone: normalizeText(raw.phone),
    country: normalizeRequiredText(raw.country, "-"),
    countryCode: normalizeCountryCode(raw.countryCode),
    company: normalizeText(raw.company),
    billingAddress: normalizeRequiredText(raw.billingAddress, "-"),
    city: normalizeText(raw.city),
    region: normalizeText(raw.region),
    postalCode: normalizeText(raw.postalCode),
    taxId: normalizeText(raw.taxId),
    serviceDescription,
    notes: normalizeText(raw.notes),
    adminNotes: normalizeText(raw.adminNotes),
    sellerName: normalizeSellerName(raw.sellerName),
    sellerEmail: normalizeText(raw.sellerEmail) || defaultSellerEmail(),
    sellerPhone: normalizeText(raw.sellerPhone) || defaultSellerPhone(),
    sellerAddress: normalizeText(raw.sellerAddress) || defaultSellerAddress(),
    sellerTaxId: normalizeText(raw.sellerTaxId) || defaultSellerTaxId(),
    sellerWebsite: normalizeText(raw.sellerWebsite) || defaultSellerWebsite(),
    paymentTerms: normalizeText(raw.paymentTerms) || "Due on receipt",
    dueDate: normalizeText(raw.dueDate),
    paymentReference: normalizeText(raw.paymentReference),
    paymentReferences: normalizePaymentReferences(raw),
    paymentProvider: raw.paymentProvider || null,
    serviceType: raw.serviceType || null,
    priority: raw.priority || null,
    date: normalizeText(raw.date),
    hour: typeof raw.hour === "number" ? raw.hour : null,
    locale: raw.locale || "en",
    lineItems: normalizeLineItems(raw.lineItems, serviceDescription, subtotalAmount),
  };
}

function loadDb(): InvoiceDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<InvoiceDb>>(DB_PATH);
  return {
    lastSequence: Number.isInteger(parsed.lastSequence) ? Number(parsed.lastSequence) : 0,
    invoices: (parsed.invoices ?? []).map(normalizeLegacyInvoice),
  };
}

function sortInvoices(invoices: InvoiceRecord[]) {
  return [...invoices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getInvoiceById(invoiceId: string) {
  const db = loadDb();
  return db.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
}

export function getInvoiceByBookingId(bookingId: string) {
  const db = loadDb();
  return db.invoices.find((invoice) => invoice.bookingId === bookingId) ?? null;
}

export function listInvoicesForUser(userId: string, email?: string | null) {
  const db = loadDb();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  return sortInvoices(
    db.invoices.filter((invoice) => invoice.userId === userId || (!!normalizedEmail && invoice.email === normalizedEmail)),
  );
}

export function listInvoicesForAdmin() {
  return sortInvoices(loadDb().invoices);
}

export function createInvoiceRequest(input: InvoiceRequestInput) {
  const db = loadDb();
  const timestamp = nowIso();
  const bookingId = input.booking?.id || null;
  const existing = bookingId
    ? db.invoices.find((invoice) => invoice.userId === input.userId && invoice.bookingId === bookingId)
    : null;
  if (existing) return existing;

  const serviceDescription = input.serviceDescription?.trim() || defaultServiceDescription(input.booking);
  const subtotalAmount = input.booking?.unitAmount ?? 0;
  const invoice: InvoiceRecord = {
    id: randomId(),
    invoiceNumber: null,
    bookingId,
    userId: input.userId,
    status: "requested",
    requestedAt: timestamp,
    issuedAt: null,
    updatedAt: timestamp,
    currency: input.booking?.currency || "cad",
    subtotalAmount,
    taxAmount: 0,
    totalAmount: subtotalAmount,
    taxLabel: null,
    taxRate: null,
    customerType: input.customerType,
    customerName: input.customerName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    country: input.country.trim(),
    countryCode: normalizeCountryCode(input.countryCode),
    company: input.company?.trim() || null,
    billingAddress: input.billingAddress.trim(),
    city: input.city?.trim() || null,
    region: input.region?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    taxId: input.taxId?.trim() || null,
    serviceDescription,
    notes: input.notes?.trim() || null,
    adminNotes: null,
    sellerName: defaultSellerName(),
    sellerEmail: defaultSellerEmail(),
    sellerPhone: defaultSellerPhone(),
    sellerAddress: defaultSellerAddress(),
    sellerTaxId: defaultSellerTaxId(),
    sellerWebsite: defaultSellerWebsite(),
    paymentTerms: "Due on receipt",
    dueDate: null,
    paymentReference: input.booking?.paymentReference || null,
    paymentReferences: input.booking?.paymentReference ? [input.booking.paymentReference] : [],
    paymentProvider: input.booking?.paymentProvider || null,
    serviceType: input.booking?.serviceType || null,
    priority: input.booking?.priority || null,
    date: input.booking?.date || null,
    hour: typeof input.booking?.hour === "number" ? input.booking.hour : null,
    locale: input.booking?.locale || "en",
    lineItems: normalizeLineItems(null, serviceDescription, subtotalAmount),
  };

  db.invoices.push(invoice);
  saveDb(db);
  return invoice;
}

export function upsertInvoiceRequestFromPayment(input: PaidInvoiceRequestInput) {
  const db = loadDb();
  const paymentReference = normalizeRequiredText(input.paymentReference, "");
  const existing = db.invoices.find(
    (invoice) =>
      invoicePaymentReferences(invoice).includes(paymentReference) &&
      invoice.paymentProvider === input.paymentProvider,
  );
  if (existing) return existing;

  const timestamp = nowIso();
  const serviceDescription = normalizeRequiredText(
    input.serviceDescription,
    "Professional Cabinet Vision services",
  );
  const subtotalAmount = normalizeAmount(input.subtotalAmount);
  const taxAmount = normalizeAmount(input.taxAmount);
  const totalAmount = subtotalAmount + taxAmount;
  const email = normalizeRequiredText(input.email, "").toLowerCase();
  const customerName =
    normalizeText(input.customerName) ||
    (email ? email.split("@")[0] : null) ||
    "Customer";
  const customerType: InvoiceCustomerType =
    input.customerType === "company" || normalizeText(input.company)
      ? "company"
      : "individual";

  const invoice: InvoiceRecord = {
    id: randomId(),
    invoiceNumber: null,
    bookingId: null,
    userId: normalizeRequiredText(input.userId, ""),
    status: "requested",
    requestedAt: timestamp,
    issuedAt: null,
    updatedAt: timestamp,
    currency: normalizeCurrency(input.currency),
    subtotalAmount,
    taxAmount,
    totalAmount,
    taxLabel: normalizeText(input.taxLabel),
    taxRate: normalizeTaxRate(input.taxRate),
    customerType,
    customerName,
    email,
    phone: normalizeText(input.phone),
    country: normalizeRequiredText(input.country || input.countryCode, "-"),
    countryCode: normalizeCountryCode(input.countryCode),
    company: normalizeText(input.company),
    billingAddress: normalizeRequiredText(
      input.billingAddress,
      "Pending billing details",
    ),
    city: normalizeText(input.city),
    region: normalizeText(input.region),
    postalCode: normalizeText(input.postalCode),
    taxId: normalizeText(input.taxId),
    serviceDescription,
    notes:
      normalizeText(input.notes) ||
      "Paid through Stripe. Please verify billing details before issuing.",
    adminNotes:
      normalizeText(input.adminNotes) ||
      `Auto-created from Stripe payment ${paymentReference}.`,
    sellerName: defaultSellerName(),
    sellerEmail: defaultSellerEmail(),
    sellerPhone: defaultSellerPhone(),
    sellerAddress: defaultSellerAddress(),
    sellerTaxId: defaultSellerTaxId(),
    sellerWebsite: defaultSellerWebsite(),
    paymentTerms: "Paid by Stripe",
    dueDate: null,
    paymentReference,
    paymentReferences: paymentReference ? [paymentReference] : [],
    paymentProvider: input.paymentProvider,
    serviceType: input.serviceType || null,
    priority: input.priority || null,
    date: null,
    hour: null,
    locale: input.locale || "en",
    lineItems: normalizeLineItems(
      input.lineItems,
      serviceDescription,
      subtotalAmount,
    ),
  };

  db.invoices.push(invoice);
  saveDb(db);
  return invoice;
}

export function mergeInvoicesByAdmin(input: {
  targetInvoiceId: string;
  sourceInvoiceIds: string[];
}) {
  const db = loadDb();
  const targetInvoiceId = normalizeRequiredText(input.targetInvoiceId, "");
  const sourceIds = uniqueTexts(input.sourceInvoiceIds).filter((id) => id !== targetInvoiceId);
  if (!targetInvoiceId || !sourceIds.length) {
    throw new Error("Choose at least one invoice to merge.");
  }

  const target = db.invoices.find((invoice) => invoice.id === targetInvoiceId);
  if (!target) throw new Error("Target invoice not found.");

  const sources = sourceIds.map((sourceId) => {
    const source = db.invoices.find((invoice) => invoice.id === sourceId);
    if (!source) throw new Error("One of the selected invoices was not found.");
    return source;
  });

  const targetEmail = target.email.trim().toLowerCase();
  const targetCurrency = target.currency.trim().toLowerCase();
  for (const source of sources) {
    if (source.email.trim().toLowerCase() !== targetEmail) {
      throw new Error("Only invoices for the same customer email can be merged.");
    }
    if (source.currency.trim().toLowerCase() !== targetCurrency) {
      throw new Error("Only invoices with the same currency can be merged.");
    }
  }

  const timestamp = nowIso();
  const existingLineIds = new Set(target.lineItems.map((line) => line.id));
  const lineItems: InvoiceLineItem[] = [...target.lineItems];
  let taxAmount = normalizeAmount(target.taxAmount);
  const mergedReferences = new Set(invoicePaymentReferences(target));
  const mergedNotes: string[] = [];

  for (const source of sources) {
    for (const reference of invoicePaymentReferences(source)) {
      mergedReferences.add(reference);
    }
    for (const sourceLine of source.lineItems) {
      let lineId = sourceLine.id || randomId("line");
      if (existingLineIds.has(lineId)) {
        lineId = `${lineId}_${source.id}`;
      }
      existingLineIds.add(lineId);
      lineItems.push({
        ...sourceLine,
        id: lineId,
      });
    }
    taxAmount += normalizeAmount(source.taxAmount);
    mergedNotes.push(
      `Merged invoice ${source.invoiceNumber || source.id} (${source.paymentReference || "no payment reference"}).`,
    );
  }

  target.lineItems = normalizeLineItems(lineItems, target.serviceDescription, target.subtotalAmount);
  target.subtotalAmount = target.lineItems.reduce((total, line) => total + normalizeAmount(line.amount), 0);
  target.taxAmount = taxAmount;
  target.totalAmount = target.subtotalAmount + target.taxAmount;
  target.paymentReferences = Array.from(mergedReferences);
  target.paymentReference = target.paymentReference || target.paymentReferences[0] || null;
  target.adminNotes = uniqueTexts([target.adminNotes, ...mergedNotes]).join("\n") || null;
  target.updatedAt = timestamp;

  db.invoices = db.invoices.filter((invoice) => !sourceIds.includes(invoice.id));
  saveDb(db);

  return {
    invoice: target,
    removedInvoiceIds: sourceIds,
  };
}

function applyAdminUpdate(invoice: InvoiceRecord, input: AdminInvoiceUpdateInput) {
  if (input.customerType === "individual" || input.customerType === "company") invoice.customerType = input.customerType;
  if (typeof input.customerName === "string") invoice.customerName = input.customerName.trim();
  if (typeof input.email === "string") invoice.email = input.email.trim().toLowerCase();
  if (typeof input.phone !== "undefined") invoice.phone = normalizeText(input.phone);
  if (typeof input.country === "string") invoice.country = input.country.trim();
  if (typeof input.countryCode !== "undefined") invoice.countryCode = normalizeCountryCode(input.countryCode);
  if (typeof input.company !== "undefined") invoice.company = normalizeText(input.company);
  if (typeof input.billingAddress === "string") invoice.billingAddress = input.billingAddress.trim();
  if (typeof input.city !== "undefined") invoice.city = normalizeText(input.city);
  if (typeof input.region !== "undefined") invoice.region = normalizeText(input.region);
  if (typeof input.postalCode !== "undefined") invoice.postalCode = normalizeText(input.postalCode);
  if (typeof input.taxId !== "undefined") invoice.taxId = normalizeText(input.taxId);
  if (typeof input.serviceDescription === "string") invoice.serviceDescription = input.serviceDescription.trim();
  if (typeof input.notes !== "undefined") invoice.notes = normalizeText(input.notes);
  if (typeof input.adminNotes !== "undefined") invoice.adminNotes = normalizeText(input.adminNotes);
  if (typeof input.sellerName === "string") invoice.sellerName = normalizeSellerName(input.sellerName);
  if (typeof input.sellerEmail !== "undefined") invoice.sellerEmail = normalizeText(input.sellerEmail) || defaultSellerEmail();
  if (typeof input.sellerPhone !== "undefined") invoice.sellerPhone = normalizeText(input.sellerPhone) || defaultSellerPhone();
  if (typeof input.sellerAddress !== "undefined") invoice.sellerAddress = normalizeText(input.sellerAddress) || defaultSellerAddress();
  if (typeof input.sellerTaxId !== "undefined") invoice.sellerTaxId = normalizeText(input.sellerTaxId) || defaultSellerTaxId();
  if (typeof input.sellerWebsite !== "undefined") invoice.sellerWebsite = normalizeText(input.sellerWebsite) || defaultSellerWebsite();
  if (typeof input.paymentTerms !== "undefined") invoice.paymentTerms = normalizeText(input.paymentTerms);
  if (typeof input.dueDate !== "undefined") invoice.dueDate = normalizeText(input.dueDate);
  if (typeof input.currency === "string") invoice.currency = normalizeCurrency(input.currency);
  if (typeof input.subtotalAmount === "number") invoice.subtotalAmount = normalizeAmount(input.subtotalAmount);
  if (typeof input.taxAmount === "number") invoice.taxAmount = normalizeAmount(input.taxAmount);
  if (typeof input.taxLabel !== "undefined") invoice.taxLabel = normalizeText(input.taxLabel);
  if (typeof input.taxRate !== "undefined") invoice.taxRate = normalizeTaxRate(input.taxRate);
  invoice.totalAmount = invoice.subtotalAmount + invoice.taxAmount;
  if (typeof input.lineItems !== "undefined") {
    invoice.lineItems = normalizeLineItems(input.lineItems, invoice.serviceDescription, invoice.subtotalAmount);
  }
  invoice.updatedAt = nowIso();
}

export function updateInvoiceByAdmin(input: AdminInvoiceUpdateInput) {
  const db = loadDb();
  const invoice = db.invoices.find((item) => item.id === input.invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  applyAdminUpdate(invoice, input);
  saveDb(db);
  return invoice;
}

export function issueInvoiceByAdmin(input: AdminInvoiceUpdateInput) {
  const db = loadDb();
  const invoice = db.invoices.find((item) => item.id === input.invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  applyAdminUpdate(invoice, input);
  if (!invoice.customerName || !invoice.email || !invoice.country || !invoice.billingAddress) {
    throw new Error("Customer name, email, country, and billing address are required before issuing an invoice.");
  }
  if (!invoice.sellerName) {
    throw new Error("Seller name is required before issuing an invoice.");
  }
  if (!invoice.lineItems.length || invoice.subtotalAmount <= 0) {
    throw new Error("Add at least one billable line item before issuing an invoice.");
  }
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = nextInvoiceNumber(db);
  }
  invoice.status = "issued";
  invoice.issuedAt = invoice.issuedAt || nowIso();
  invoice.updatedAt = nowIso();
  saveDb(db);
  return invoice;
}

export function issueInvoiceForBooking(_booking: BookingRecord) {
  return null;
}

export function issueInvoicesForBookings(bookings: BookingRecord[]) {
  const bookingIds = new Set(bookings.map((booking) => booking.id));
  return listInvoicesForAdmin().filter((invoice) => invoice.bookingId && bookingIds.has(invoice.bookingId));
}
