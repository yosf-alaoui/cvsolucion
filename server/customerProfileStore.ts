import path from "path";
import { getAppDataDir } from "./dataDir";
import {
  isSqliteStorageEnabled,
  withDocumentDatabase,
} from "./documentDatabase";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type CustomerProfileRecord = {
  userId: string;
  email: string;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

type CustomerProfileDb = {
  profiles: CustomerProfileRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "customer-profiles-db.json");

function nowIso() {
  return new Date().toISOString();
}

function normalizeCountryCode(value: string | null | undefined) {
  const countryCode = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { profiles: [] });
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function loadStructuredDb(): CustomerProfileDb | null {
  if (!isSqliteStorageEnabled()) return null;

  return withDocumentDatabase((sqlite) => {
    const rows = sqlite
      .prepare(
        `
          SELECT
            user_id AS userId,
            email,
            display_name AS name,
            country,
            country_code AS countryCode,
            phone,
            company,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM customer_profiles
          ORDER BY updated_at DESC
        `,
      )
      .all() as Array<Record<string, unknown>>;

    if (!rows.length) {
      const document = sqlite
        .prepare("SELECT value FROM documents WHERE key = ?")
        .get("customer-profiles-db.json") as { value: string } | undefined;
      if (document) {
        const parsed = JSON.parse(document.value) as Partial<CustomerProfileDb>;
        if ((parsed.profiles?.length ?? 0) > 0) return null;
      }
    }

    return {
      profiles: rows.map((row) => ({
        userId: String(row.userId || ""),
        email: String(row.email || "").toLowerCase(),
        name: nullableText(row.name),
        country: nullableText(row.country),
        countryCode: normalizeCountryCode(nullableText(row.countryCode)),
        phone: nullableText(row.phone),
        company: nullableText(row.company),
        createdAt: String(row.createdAt || nowIso()),
        updatedAt: String(row.updatedAt || row.createdAt || nowIso()),
      })),
    };
  });
}

function loadDb(): CustomerProfileDb {
  ensureDbFile();
  const structured = loadStructuredDb();
  if (structured) return structured;

  const parsed = readJsonFile<Partial<CustomerProfileDb>>(DB_PATH);
  return {
    profiles: parsed.profiles ?? [],
  };
}

function saveDb(db: CustomerProfileDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

export function getCustomerProfile(userId: string) {
  const db = loadDb();
  const profile = db.profiles.find((item) => item.userId === userId) ?? null;
  if (!profile) return null;
  return {
    ...profile,
    countryCode: normalizeCountryCode(profile.countryCode) || null,
  };
}

export function upsertCustomerProfile(input: {
  userId: string;
  email: string;
  name?: string | null;
  country?: string | null;
  countryCode?: string | null;
  phone?: string | null;
  company?: string | null;
}) {
  const db = loadDb();
  const existing = db.profiles.find((profile) => profile.userId === input.userId);
  const timestamp = nowIso();

  if (existing) {
    existing.email = input.email.trim().toLowerCase();
    existing.name = input.name?.trim() || existing.name || null;
    existing.country = input.country?.trim() || existing.country || null;
    existing.countryCode = normalizeCountryCode(input.countryCode) || existing.countryCode || null;
    existing.phone = input.phone?.trim() || existing.phone || null;
    existing.company = input.company?.trim() || existing.company || null;
    existing.updatedAt = timestamp;
    saveDb(db);
    return existing;
  }

  const profile: CustomerProfileRecord = {
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    country: input.country?.trim() || null,
    countryCode: normalizeCountryCode(input.countryCode),
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.profiles.push(profile);
  saveDb(db);
  return profile;
}

export function updateCustomerProfile(input: {
  userId: string;
  email: string;
  name: string;
  country: string;
  countryCode?: string | null;
  phone: string;
  company?: string | null;
}) {
  return upsertCustomerProfile(input);
}
