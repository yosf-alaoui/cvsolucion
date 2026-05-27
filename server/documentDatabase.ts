import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";

let database: Database.Database | null = null;
let databasePath: string | null = null;

function chmodSafe(filePath: string, mode: number) {
  try {
    fs.chmodSync(filePath, mode);
  } catch {
    // chmod can be unavailable on some development filesystems.
  }
}

function ensureSecureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSafe(dir, 0o700);
}

function chmodDatabaseFiles(filePath: string) {
  chmodSafe(filePath, 0o600);
  chmodSafe(`${filePath}-wal`, 0o600);
  chmodSafe(`${filePath}-shm`, 0o600);
}

export function isSqliteStorageEnabled() {
  const driver = process.env.APP_STORAGE_DRIVER?.trim().toLowerCase();
  return driver === "sqlite" || Boolean(process.env.APP_DATABASE_PATH?.trim());
}

export function getDocumentDatabasePath() {
  const configured = process.env.APP_DATABASE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }

  return path.join(getAppDataDir(), "cvsolucion.sqlite");
}

function openDocumentDatabase() {
  const filePath = getDocumentDatabasePath();
  ensureSecureParentDir(filePath);

  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  chmodDatabaseFiles(filePath);
  return db;
}

function getDocumentDatabase() {
  const nextPath = getDocumentDatabasePath();
  if (!database || databasePath !== nextPath) {
    database?.close();
    database = openDocumentDatabase();
    databasePath = nextPath;
  }

  return database;
}

export function ensureDocument<T>(key: string, initialValue: T, legacyLoader?: () => T) {
  const db = getDocumentDatabase();
  const existing = db.prepare("SELECT key FROM documents WHERE key = ?").get(key);
  if (existing) return;

  const value = legacyLoader ? legacyLoader() : initialValue;
  writeDocument(key, value);
}

export function readDocument<T>(key: string) {
  const row = getDocumentDatabase().prepare("SELECT value FROM documents WHERE key = ?").get(key) as
    | { value: string }
    | undefined;

  if (!row) {
    throw new Error(`Storage document not found: ${key}`);
  }

  return JSON.parse(row.value) as T;
}

export function writeDocument(key: string, data: unknown) {
  const db = getDocumentDatabase();
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO documents (key, value, created_at, updated_at)
      VALUES (@key, @value, @now, @now)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `
  ).run({
    key,
    value: JSON.stringify(data),
    now,
  });
  chmodDatabaseFiles(getDocumentDatabasePath());
}
