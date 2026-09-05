import type Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
import {
  isSqliteStorageEnabled,
  withDocumentDatabase,
} from "./documentDatabase";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type ContactLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  interest: string | null;
  message: string;
  createdAt: string;
};

export type ContactNotificationKind =
  | "admin_email"
  | "whatsapp_template"
  | "career_start_email";

export type ContactNotificationJob = {
  id: string;
  leadId: string;
  kind: ContactNotificationKind;
  sourceType: "contact" | "career_evaluation";
  locale: string;
  source: string;
  tracking: Record<string, string>;
  status: "queued" | "processing" | "sent" | "failed";
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

type ContactDb = {
  leads: ContactLead[];
  notifications: ContactNotificationJob[];
};

type SqliteDatabase = Database.Database;

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "contact-leads.json");

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { leads: [], notifications: [] });
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function shouldFallbackToDocument(
  sqlite: SqliteDatabase,
  rowsLength: number,
  documentKey: string,
) {
  if (rowsLength > 0) return false;
  const document = sqlite
    .prepare("SELECT value FROM documents WHERE key = ?")
    .get(documentKey) as { value: string } | undefined;
  if (!document) return false;
  const parsed = JSON.parse(document.value) as Partial<ContactDb>;
  return (parsed.leads?.length ?? 0) > 0;
}

function loadStructuredDb(): ContactDb | null {
  if (!isSqliteStorageEnabled()) return null;

  return withDocumentDatabase((sqlite) => {
    const document = sqlite
      .prepare("SELECT value FROM documents WHERE key = ?")
      .get("contact-leads.json") as { value: string } | undefined;
    const documentDb = document
      ? (JSON.parse(document.value) as Partial<ContactDb>)
      : {};
    const rows = sqlite
      .prepare(
        `
          SELECT
            id,
            name,
            email,
            company,
            phone,
            source AS interest,
            message,
            created_at AS createdAt
          FROM contact_leads
          ORDER BY created_at DESC
        `,
      )
      .all() as Array<Record<string, unknown>>;

    if (shouldFallbackToDocument(sqlite, rows.length, "contact-leads.json")) {
      return null;
    }

    return {
      leads: rows.map((row) => ({
        id: text(row.id),
        name: text(row.name),
        email: text(row.email).toLowerCase(),
        company: nullableText(row.company),
        phone: nullableText(row.phone),
        interest: nullableText(row.interest),
        message: text(row.message),
        createdAt: text(row.createdAt),
      })),
      notifications: documentDb.notifications ?? [],
    };
  });
}

function loadDb(): ContactDb {
  ensureDbFile();
  const structured = loadStructuredDb();
  if (structured) return structured;

  const parsed = readJsonFile<Partial<ContactDb>>(DB_PATH);
  return {
    leads: parsed.leads ?? [],
    notifications: parsed.notifications ?? [],
  };
}

function saveDb(db: ContactDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

type ContactLeadInput = {
  id?: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  interest?: string | null;
  message: string;
};

function buildContactLead(input: ContactLeadInput): ContactLead {
  return {
    id: input.id?.trim() || crypto.randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company?.trim() || null,
    phone: input.phone?.trim() || null,
    interest: input.interest?.trim() || null,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function storeContactLead(input: ContactLeadInput) {
  const db = loadDb();
  const lead = buildContactLead(input);

  db.leads.unshift(lead);
  saveDb(db);
  return lead;
}

export function storeContactLeadWithNotifications(
  input: ContactLeadInput,
  context: {
    sourceType: "contact" | "career_evaluation";
    locale: string;
    source: string;
    tracking?: Record<string, string> | null;
  },
) {
  const db = loadDb();
  const lead = buildContactLead(input);
  const existingLead = db.leads.find((candidate) => candidate.id === lead.id);
  if (existingLead) {
    return {
      lead: existingLead,
      notifications: db.notifications.filter((job) => job.leadId === lead.id),
    };
  }
  const timestamp = lead.createdAt;
  const kinds: ContactNotificationKind[] = ["admin_email", "whatsapp_template"];
  if (context.sourceType === "career_evaluation") kinds.push("career_start_email");

  const notifications = kinds.map<ContactNotificationJob>((kind) => ({
    id: `contact-notification:${lead.id}:${kind}`,
    leadId: lead.id,
    kind,
    sourceType: context.sourceType,
    locale: context.locale,
    source: context.source,
    tracking: context.tracking || {},
    status: "queued",
    attempts: 0,
    nextAttemptAt: timestamp,
    lastError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  db.leads.unshift(lead);
  db.notifications.push(...notifications);
  saveDb(db);
  return { lead, notifications };
}

export function claimDueContactNotification(now = new Date()) {
  const db = loadDb();
  const nowMs = now.getTime();
  const staleProcessingBefore = nowMs - 10 * 60_000;
  const job = db.notifications.find((candidate) => {
    const due = new Date(candidate.nextAttemptAt).getTime() <= nowMs;
    const stale =
      candidate.status === "processing" &&
      new Date(candidate.updatedAt).getTime() <= staleProcessingBefore;
    return (candidate.status === "queued" && due) || stale;
  });
  if (!job) return null;

  job.status = "processing";
  job.attempts += 1;
  job.updatedAt = now.toISOString();
  saveDb(db);
  return { ...job };
}

export function markContactNotificationSent(jobId: string) {
  const db = loadDb();
  const job = db.notifications.find((candidate) => candidate.id === jobId);
  if (!job) return null;
  job.status = "sent";
  job.lastError = null;
  job.updatedAt = new Date().toISOString();
  saveDb(db);
  return { ...job };
}

export function markContactNotificationFailed(jobId: string, error: unknown) {
  const db = loadDb();
  const job = db.notifications.find((candidate) => candidate.id === jobId);
  if (!job) return null;
  const now = Date.now();
  const retryDelay = Math.min(30_000 * 2 ** Math.max(0, job.attempts - 1), 30 * 60_000);
  job.status = job.attempts >= 6 ? "failed" : "queued";
  job.nextAttemptAt = new Date(now + retryDelay).toISOString();
  job.lastError = String(error instanceof Error ? error.message : error).slice(0, 500);
  job.updatedAt = new Date(now).toISOString();
  saveDb(db);
  return { ...job };
}

export function retryContactNotification(jobId: string) {
  const db = loadDb();
  const job = db.notifications.find((candidate) => candidate.id === jobId);
  if (!job) return null;
  job.status = "queued";
  job.attempts = 0;
  job.nextAttemptAt = new Date().toISOString();
  job.lastError = null;
  job.updatedAt = job.nextAttemptAt;
  saveDb(db);
  return { ...job };
}

export function listContactNotifications() {
  return [...loadDb().notifications].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function listContactLeads() {
  const db = loadDb();
  return [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
