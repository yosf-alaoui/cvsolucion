import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
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

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "contact-leads.json");

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { leads: [] });
}

function loadDb(): ContactDb {
  ensureDbFile();
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
