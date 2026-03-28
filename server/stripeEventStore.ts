import fs from "fs";
import path from "path";

type StripeEventRecord = {
  id: string;
  type: string;
  createdAt: string;
};

type StripeEventDb = {
  processed: StripeEventRecord[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "stripe-events-db.json");
const MAX_STORED_EVENTS = 2000;

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ processed: [] }, null, 2), "utf8");
  }
}

function loadDb(): StripeEventDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<StripeEventDb>;
  return {
    processed: parsed.processed ?? [],
  };
}

function saveDb(db: StripeEventDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
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
