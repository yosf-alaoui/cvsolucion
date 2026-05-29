import path from "path";
import { getAppDataDir } from "./dataDir";
import {
  isSqliteStorageEnabled,
  withDocumentDatabase,
} from "./documentDatabase";
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

function hasStructuredProcessedStripeEvent(eventId: string) {
  if (!isSqliteStorageEnabled()) return null;

  return withDocumentDatabase((sqlite) => {
    const row = sqlite
      .prepare("SELECT id FROM stripe_events WHERE id = ?")
      .get(eventId) as { id: string } | undefined;
    if (row) return true;

    const countRow = sqlite
      .prepare("SELECT COUNT(*) AS count FROM stripe_events")
      .get() as { count: number };
    if (countRow.count > 0) return false;

    const document = sqlite
      .prepare("SELECT value FROM documents WHERE key = ?")
      .get("stripe-events-db.json") as { value: string } | undefined;
    if (!document) return false;

    const parsed = JSON.parse(document.value) as Partial<StripeEventDb>;
    return (parsed.processed?.length ?? 0) > 0 ? null : false;
  });
}

function nowIso() {
  return new Date().toISOString();
}

export function hasProcessedStripeEvent(eventId: string) {
  const structured = hasStructuredProcessedStripeEvent(eventId);
  if (structured !== null) return structured;

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
