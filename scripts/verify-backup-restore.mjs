import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed: ${String(result.stderr || result.stdout || "unknown error").trim()}`,
    );
  }
}

function latestArchive(directory) {
  if (!fs.existsSync(directory)) return null;
  return fs
    .readdirSync(directory)
    .filter((name) => /^cvsolucion-backup-.*\.tar\.gz(?:\.enc)?$/.test(name))
    .map((name) => path.join(directory, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
}

function backupRoot() {
  const configured = process.env.BACKUP_OUTPUT_DIR?.trim();
  if (configured) return path.resolve(configured);
  const dataDir = process.env.APP_DATA_DIR?.trim()
    ? path.resolve(process.env.APP_DATA_DIR)
    : path.resolve(process.cwd(), "data");
  return path.join(dataDir, "backups");
}

function resolveArchive() {
  const requested = process.argv[2]?.trim();
  const archive = requested ? path.resolve(requested) : latestArchive(backupRoot());
  if (!archive || !fs.existsSync(archive)) {
    throw new Error("Backup archive not found. Pass its path or create a local backup first.");
  }
  return archive;
}

function verifyDatabase(databasePath) {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const check = db.pragma("quick_check", { simple: true });
    if (check !== "ok") throw new Error(`SQLite quick_check failed: ${String(check)}`);
    const documents = db
      .prepare("SELECT COUNT(*) AS count FROM documents")
      .get();
    return Number(documents?.count || 0);
  } finally {
    db.close();
  }
}

function main() {
  const sourceArchive = resolveArchive();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-restore-test-"));
  const archivePath = path.join(workDir, "backup.tar.gz");
  const extractDir = path.join(workDir, "restored");
  fs.mkdirSync(extractDir, { mode: 0o700 });

  try {
    if (sourceArchive.endsWith(".enc")) {
      const passphrase = process.env.BACKUP_ENCRYPTION_PASSPHRASE || "";
      if (!passphrase) {
        throw new Error("BACKUP_ENCRYPTION_PASSPHRASE is required to verify this encrypted backup.");
      }
      run(
        "openssl",
        [
          "enc",
          "-d",
          "-aes-256-cbc",
          "-pbkdf2",
          "-iter",
          "200000",
          "-in",
          sourceArchive,
          "-out",
          archivePath,
          "-pass",
          "env:BACKUP_ENCRYPTION_PASSPHRASE",
        ],
        { env: { ...process.env, BACKUP_ENCRYPTION_PASSPHRASE: passphrase } },
      );
    } else {
      fs.copyFileSync(sourceArchive, archivePath);
    }

    run("tar", ["-xzf", archivePath, "-C", extractDir]);
    const manifestPath = path.join(extractDir, "manifest.json");
    const databasePath = path.join(extractDir, "cvsolucion.sqlite");
    if (!fs.existsSync(manifestPath) || !fs.existsSync(databasePath)) {
      throw new Error("Backup is missing manifest.json or cvsolucion.sqlite.");
    }
    JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const documentCount = verifyDatabase(databasePath);
    console.log(`Restore verification passed: ${path.basename(sourceArchive)}`);
    console.log(`SQLite documents: ${documentCount}`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
