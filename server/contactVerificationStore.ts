import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type PendingContactLead = {
  id: string;
  tokenHash: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  interest: string | null;
  message: string;
  locale: "en" | "fr" | "ar";
  sourceType: "contact" | "career_evaluation";
  source: string;
  tracking: Record<string, string>;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
};

type PendingContactDb = {
  pendingLeads: PendingContactLead[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "pending-contact-leads.json");

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { pendingLeads: [] });
}

function loadDb(): PendingContactDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<PendingContactDb>>(DB_PATH);
  return { pendingLeads: parsed.pendingLeads ?? [] };
}

function saveDb(db: PendingContactDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function nowIso() {
  return new Date().toISOString();
}

function addMs(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeNullable(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function prune(db: PendingContactDb) {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
  const now = Date.now();
  db.pendingLeads = db.pendingLeads.filter((lead) => {
    const expiresAt = new Date(lead.expiresAt).getTime();
    const createdAt = new Date(lead.createdAt).getTime();
    if (lead.confirmedAt && createdAt <= cutoff) return false;
    return expiresAt > now || Boolean(lead.confirmedAt);
  });
}

export function createPendingContactLead(
  input: Omit<
    PendingContactLead,
    "id" | "tokenHash" | "createdAt" | "expiresAt" | "confirmedAt"
  >,
  maxAgeMs: number,
) {
  const db = loadDb();
  prune(db);
  const rawToken = randomToken(24);
  const timestamp = nowIso();
  const pendingLead: PendingContactLead = {
    id: randomToken(12),
    tokenHash: sha256(rawToken),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: normalizeNullable(input.company),
    phone: normalizeNullable(input.phone),
    interest: normalizeNullable(input.interest),
    message: input.message.trim(),
    locale: input.locale,
    sourceType: input.sourceType,
    source: input.source.trim(),
    tracking: input.tracking,
    createdAt: timestamp,
    expiresAt: addMs(maxAgeMs),
    confirmedAt: null,
  };

  db.pendingLeads.unshift(pendingLead);
  saveDb(db);
  return { pendingLead, rawToken };
}

export function getPendingContactLeadByToken(rawToken: string) {
  const db = loadDb();
  prune(db);
  const tokenHash = sha256(rawToken);
  const pendingLead =
    db.pendingLeads.find(
      (lead) =>
        lead.tokenHash === tokenHash &&
        !lead.confirmedAt &&
        new Date(lead.expiresAt).getTime() > Date.now(),
    ) ?? null;
  saveDb(db);
  return pendingLead;
}

export function markPendingContactLeadConfirmed(id: string) {
  const db = loadDb();
  const pendingLead = db.pendingLeads.find((lead) => lead.id === id);
  if (!pendingLead) return null;
  pendingLead.confirmedAt = pendingLead.confirmedAt ?? nowIso();
  saveDb(db);
  return pendingLead;
}
