import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

function resolvePath(value, fallback) {
  const resolved = value?.trim() || fallback;
  return path.isAbsolute(resolved) ? resolved : path.resolve(process.cwd(), resolved);
}

function chmodSafe(filePath, mode) {
  try {
    fs.chmodSync(filePath, mode);
  } catch {
    // chmod can be unavailable on some development filesystems.
  }
}

function findJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "uploads") continue;
      files.push(...findJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

const dataDir = resolvePath(process.env.APP_DATA_DIR, path.join(process.cwd(), "data"));
const databasePath = resolvePath(process.env.APP_DATABASE_PATH, path.join(dataDir, "cvsolucion.sqlite"));
const overwrite = ["1", "true", "yes"].includes((process.env.MIGRATE_SQLITE_OVERWRITE || "").trim().toLowerCase());

fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
chmodSafe(path.dirname(databasePath), 0o700);

const db = new Database(databasePath);
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

const insert = db.prepare(`
  INSERT INTO documents (key, value, created_at, updated_at)
  VALUES (@key, @value, @now, @now)
  ON CONFLICT(key) DO NOTHING
`);

const upsert = db.prepare(`
  INSERT INTO documents (key, value, created_at, updated_at)
  VALUES (@key, @value, @now, @now)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at
`);

const migrate = db.transaction((files) => {
  const now = new Date().toISOString();
  const results = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    JSON.parse(raw);
    const key = path.relative(dataDir, filePath).split(path.sep).join("/");
    const statement = overwrite ? upsert : insert;
    const result = statement.run({ key, value: raw, now });
    results.push({ key, bytes: Buffer.byteLength(raw, "utf8"), changed: result.changes > 0 });
  }

  return results;
});

const files = findJsonFiles(dataDir);
const results = migrate(files);

chmodSafe(databasePath, 0o600);
chmodSafe(`${databasePath}-wal`, 0o600);
chmodSafe(`${databasePath}-shm`, 0o600);

console.log(`SQLite database: ${databasePath}`);
console.log(`JSON files scanned: ${files.length}`);
console.log(`Documents changed: ${results.filter((item) => item.changed).length}`);
for (const item of results) {
  console.log(`${item.changed ? "migrated" : "kept"} ${item.key} ${item.bytes} bytes`);
}

db.close();
