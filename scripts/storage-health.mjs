import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

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

const db = new Database(databasePath, { readonly: true, fileMustExist: true });
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

db.close();
