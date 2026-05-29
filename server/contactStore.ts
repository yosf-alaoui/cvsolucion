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

type ContactDb = {
  leads: ContactLead[];
};

type SqliteDatabase = Database.Database;

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "contact-leads.json");

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { leads: [] });
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
    };
  });
}

function loadDb(): ContactDb {
  ensureDbFile();
  const structured = loadStructuredDb();
  if (structured) return structured;

  const parsed = readJsonFile<Partial<ContactDb>>(DB_PATH);
  return { leads: parsed.leads ?? [] };
}

function saveDb(db: ContactDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

export function storeContactLead(input: {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  interest?: string | null;
  message: string;
}) {
  const db = loadDb();
  const lead: ContactLead = {
    id: crypto.randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company?.trim() || null,
    phone: input.phone?.trim() || null,
    interest: input.interest?.trim() || null,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };

  db.leads.unshift(lead);
  saveDb(db);
  return lead;
}

export function listContactLeads() {
  const db = loadDb();
  return [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
