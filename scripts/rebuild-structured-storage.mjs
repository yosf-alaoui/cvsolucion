import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import {
  ensureStructuredSchema,
  syncStructuredDocument,
} from "../server/structuredDatabase.ts";

dotenv.config({ quiet: true });

function resolvePath(configuredPath, fallbackPath) {
  if (!configuredPath) return fallbackPath;
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

const dataDir = resolvePath(
  process.env.APP_DATA_DIR,
  path.join(process.cwd(), "data"),
);
const databasePath = resolvePath(
  process.env.APP_DATABASE_PATH,
  path.join(dataDir, "cvsolucion.sqlite"),
);

if (!fs.existsSync(databasePath)) {
  console.error(`SQLite database not found: ${databasePath}`);
  process.exit(1);
}

const db = new Database(databasePath, { fileMustExist: true });
ensureStructuredSchema(db);

const rows = db.prepare("SELECT key, value FROM documents ORDER BY key").all();
let rebuiltCount = 0;

for (const row of rows) {
  const value = JSON.parse(String(row.value).replace(/^\uFEFF/, ""));
  syncStructuredDocument(db, row.key, value);
  rebuiltCount += 1;
}

console.log(`SQLite database: ${databasePath}`);
console.log(`Documents rebuilt: ${rebuiltCount}`);

db.close();
