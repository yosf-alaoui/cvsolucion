import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

type StripeEventRecord = {
  id: string;
  type: string;
  createdAt: string;
};

type StripeEventDb = {
  processed: StripeEventRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "stripe-events-db.json");
const MAX_STORED_EVENTS = 2000;

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { processed: [] });
}

function loadDb(): StripeEventDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<StripeEventDb>>(DB_PATH);
  return {
    processed: parsed.processed ?? [],
  };
}

function saveDb(db: StripeEventDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function nowIso() {
  return new Date().toISOString();
}

export function hasProcessedStripeEvent(eventId: string) {
  const db = loadDb();
  return db.processed.some((event) => event.id === eventId);
}

export function markStripeEventProcessed(eventId: string, type: string) {
  const db = loadDb();
  if (db.processed.some((event) => event.id === eventId)) {
    return false;
  }

  db.processed.push({
    id: eventId,
    type,
    createdAt: nowIso(),
  });

  if (db.processed.length > MAX_STORED_EVENTS) {
    db.processed = db.processed.slice(-MAX_STORED_EVENTS);
  }

  saveDb(db);
  return true;
}
