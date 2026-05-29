import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DEFAULT_RETENTION_DAYS = 30;

function resolvePath(configuredPath, fallbackPath) {
  if (!configuredPath) return fallbackPath;
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function assertCommandSucceeded(result, command) {
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    const stdout = String(result.stdout || "").trim();
    throw new Error(
      `${command} failed${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`,
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
  });
  assertCommandSucceeded(result, `${command} ${args.join(" ")}`);
  return result;
}

async function createArchive() {
  const dataDir = resolvePath(process.env.APP_DATA_DIR, path.join(process.cwd(), "data"));
  const databasePath = resolvePath(
    process.env.APP_DATABASE_PATH,
    path.join(dataDir, "cvsolucion.sqlite"),
  );
  if (!fs.existsSync(databasePath)) {
    throw new Error(`SQLite database not found: ${databasePath}`);
  }

  const backupRoot = resolvePath(process.env.BACKUP_OUTPUT_DIR, path.join(dataDir, "backups"));
  fs.mkdirSync(backupRoot, { recursive: true, mode: 0o700 });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-rclone-backup-"));
  const sqliteBackupPath = path.join(workDir, "cvsolucion.sqlite");
  const manifestPath = path.join(workDir, "manifest.json");
  const archivePath = path.join(backupRoot, `cvsolucion-backup-${timestamp}.tar.gz`);

  const db = new Database(databasePath, { fileMustExist: true, readonly: true });
  await db.backup(sqliteBackupPath);
  db.close();

  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        sourceDatabase: databasePath,
        hostname: os.hostname(),
        files: ["cvsolucion.sqlite"],
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );

  try {
    run("tar", ["-czf", archivePath, "-C", workDir, "."]);
    fs.chmodSync(archivePath, 0o600);
    return archivePath;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function rcloneArgs() {
  const args = [];
  const configPath = process.env.RCLONE_CONFIG?.trim();
  if (configPath) args.push("--config", configPath);
  return args;
}

function normalizeRemote(remote) {
  return remote.replace(/\/+$/, "");
}

function assertRcloneExists() {
  const result = spawnSync("rclone", ["version"], {
    encoding: "utf8",
  });
  assertCommandSucceeded(result, "rclone version");
}

async function main() {
  assertRcloneExists();

  const remote = normalizeRemote(process.env.RCLONE_BACKUP_REMOTE || "");
  if (!remote) {
    throw new Error("RCLONE_BACKUP_REMOTE is required, for example: cvsolucion-drive:cvsolucion-backups");
  }

  const archivePath = await createArchive();
  const retentionDays = Number(process.env.RCLONE_BACKUP_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
  const baseArgs = rcloneArgs();

  run("rclone", [
    ...baseArgs,
    "mkdir",
    remote,
  ]);
  run("rclone", [
    ...baseArgs,
    "copy",
    archivePath,
    remote,
    "--checksum",
    "--transfers",
    "1",
  ]);

  let pruned = "disabled";
  if (Number.isFinite(retentionDays) && retentionDays > 0) {
    run("rclone", [
      ...baseArgs,
      "delete",
      remote,
      "--include",
      "cvsolucion-backup-*.tar.gz",
      "--min-age",
      `${retentionDays}d`,
    ]);
    run("rclone", [...baseArgs, "rmdirs", remote, "--leave-root"]);
    pruned = `${retentionDays}d`;
  }

  console.log(`Archive: ${archivePath}`);
  console.log(`Uploaded to: ${remote}/${path.basename(archivePath)}`);
  console.log(`Retention: ${pruned}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
