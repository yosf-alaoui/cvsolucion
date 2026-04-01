import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";

export type CustomerProfileRecord = {
  userId: string;
  email: string;
  name: string | null;
  country: string | null;
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

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ profiles: [] }, null, 2), "utf8");
  }
}

function loadDb(): CustomerProfileDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<CustomerProfileDb>;
  return {
    profiles: parsed.profiles ?? [],
  };
}

function saveDb(db: CustomerProfileDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function getCustomerProfile(userId: string) {
  const db = loadDb();
  return db.profiles.find((profile) => profile.userId === userId) ?? null;
}

export function upsertCustomerProfile(input: {
  userId: string;
  email: string;
  name?: string | null;
  country?: string | null;
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
  phone: string;
  company?: string | null;
}) {
  return upsertCustomerProfile(input);
}
