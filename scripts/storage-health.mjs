import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { ensureStructuredSchema, structuredTableNames } from "../server/structuredDatabase.ts";

dotenv.config({ quiet: true });

function resolvePath(value, fallback) {
  const resolved = value?.trim() || fallback;
  return path.isAbsolute(resolved) ? resolved : path.resolve(process.cwd(), resolved);
}

const dataDir = resolvePath(process.env.APP_DATA_DIR, path.join(process.cwd(), "data"));
const databasePath = resolvePath(process.env.APP_DATABASE_PATH, path.join(dataDir, "cvsolucion.sqlite"));

if (!fs.existsSync(databasePath)) {
  console.error(`SQLite database not found: ${databasePath}`);
  process.exit(1);
}

const db = new Database(databasePath, { fileMustExist: true });
ensureStructuredSchema(db);
const rows = db
  .prepare("SELECT key, value, updated_at FROM documents ORDER BY key")
  .all();

for (const row of rows) {
  JSON.parse(row.value);
}

console.log(`SQLite database: ${databasePath}`);
console.log(`Documents: ${rows.length}`);
for (const row of rows) {
  console.log(`${row.key} ${Buffer.byteLength(row.value, "utf8")} bytes ${row.updated_at}`);
}

console.log("Structured tables:");
for (const tableName of structuredTableNames) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  console.log(`${tableName} ${row.count} rows`);
}

db.close();
