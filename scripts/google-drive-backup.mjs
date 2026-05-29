import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const DEFAULT_FOLDER_NAME = "CVsolucion production backups";
const DEFAULT_RETENTION_DAYS = 30;

function resolvePath(configuredPath, fallbackPath) {
  if (!configuredPath) return fallbackPath;
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(process.cwd(), configuredPath);
}

function findDefaultServiceAccountFile() {
  const root = process.cwd();
  const match = fs
    .readdirSync(root)
    .find((fileName) => /^backup-cvsolucion-website-.*\.json$/i.test(fileName));
  return match ? path.join(root, match) : null;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: DRIVE_SCOPE,
      aud: serviceAccount.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(serviceAccount.private_key);
  return `${unsigned}.${base64Url(signature)}`;
}

async function getAccessToken(serviceAccount) {
  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(serviceAccount),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Google OAuth response did not include an access token.");
  }
  return data.access_token;
}

async function driveRequest(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    const quotaHint = body.includes("storageQuotaExceeded")
      ? " Service accounts cannot own files in a personal Drive quota; use a Shared Drive folder or OAuth user backup."
      : "";
    throw new Error(`Google Drive request failed: ${response.status} ${body}${quotaHint}`);
  }
  return response.json();
}

function escapeDriveQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolderByName(token, folderName) {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    `name = '${escapeDriveQueryValue(folderName)}'`,
    "trashed = false",
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    pageSize: "10",
    corpora: "allDrives",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const result = await driveRequest(token, `${DRIVE_API}/files?${params}`);
  return result.files?.[0]?.id ?? null;
}

async function resolveBackupFolder(token, serviceAccount) {
  const configuredFolderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID?.trim();
  if (configuredFolderId) return configuredFolderId;

  const folderName = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_NAME?.trim() || DEFAULT_FOLDER_NAME;
  const folderId = await findFolderByName(token, folderName);
  if (folderId) return folderId;

  throw new Error(
    [
      `Google Drive backup folder not found: ${folderName}`,
      `Share the folder with ${serviceAccount.client_email} or set GOOGLE_DRIVE_BACKUP_FOLDER_ID.`,
      "Service accounts cannot create usable folders in a personal Drive quota.",
    ].join(" "),
  );
}

async function uploadFile(token, folderId, filePath, metadata) {
  const boundary = `cvsolucion-${crypto.randomBytes(12).toString("hex")}`;
  const fileBytes = fs.readFileSync(filePath);
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
        ...metadata,
        parents: [folderId],
      })}\r\n--${boundary}\r\ncontent-type: application/gzip\r\n\r\n`,
    ),
    fileBytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const result = await driveRequest(
    token,
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,size,webViewLink&supportsAllDrives=true`,
    {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return result;
}

function assertCommandSucceeded(result, command) {
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    throw new Error(`${command} failed${stderr ? `: ${stderr}` : ""}`);
  }
}

async function createArchive() {
  const dataDir = resolvePath(process.env.APP_DATA_DIR, path.join(process.cwd(), "data"));
  const databasePath = resolvePath(process.env.APP_DATABASE_PATH, path.join(dataDir, "cvsolucion.sqlite"));
  if (!fs.existsSync(databasePath)) {
    throw new Error(`SQLite database not found: ${databasePath}`);
  }

  const backupRoot = resolvePath(process.env.BACKUP_OUTPUT_DIR, path.join(dataDir, "backups"));
  fs.mkdirSync(backupRoot, { recursive: true, mode: 0o700 });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-drive-backup-"));
  const sqliteBackupPath = path.join(workDir, "cvsolucion.sqlite");
  const manifestPath = path.join(workDir, "manifest.json");
  const archivePath = path.join(backupRoot, `cvsolucion-backup-${timestamp}.tar.gz`);
  const includedFiles = ["cvsolucion.sqlite"];

  const db = new Database(databasePath, { fileMustExist: true, readonly: true });
  await db.backup(sqliteBackupPath);
  db.close();

  const uploadsPath = path.join(dataDir, "uploads");
  if (fs.existsSync(uploadsPath) && fs.statSync(uploadsPath).isDirectory()) {
    fs.cpSync(uploadsPath, path.join(workDir, "uploads"), {
      recursive: true,
      force: true,
      dereference: false,
    });
    includedFiles.push("uploads/");
  }

  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        sourceDatabase: databasePath,
        sourceUploads: fs.existsSync(uploadsPath) ? uploadsPath : null,
        hostname: os.hostname(),
        files: includedFiles,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );

  try {
    const result = spawnSync("tar", ["-czf", archivePath, "-C", workDir, "."], {
      encoding: "utf8",
    });
    assertCommandSucceeded(result, "tar");
    fs.chmodSync(archivePath, 0o600);
    return archivePath;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function pruneOldBackups(token, folderId) {
  const retentionDays = Number(process.env.GOOGLE_DRIVE_BACKUP_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return 0;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const query = [
    `'${folderId}' in parents`,
    "name contains 'cvsolucion-backup-'",
    `createdTime < '${cutoff}'`,
    "trashed = false",
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,createdTime)",
    pageSize: "100",
    supportsAllDrives: "true",
  });
  const result = await driveRequest(token, `${DRIVE_API}/files?${params}`);
  const files = result.files ?? [];
  for (const file of files) {
    await driveRequest(token, `${DRIVE_API}/files/${file.id}?supportsAllDrives=true`, { method: "DELETE" });
  }
  return files.length;
}

async function main() {
  const serviceAccountPath = resolvePath(
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE,
    findDefaultServiceAccountFile(),
  );
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error("GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE is required and must point to the Google service account JSON.");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  const token = await getAccessToken(serviceAccount);
  const folderId = await resolveBackupFolder(token, serviceAccount);
  const archivePath = await createArchive();
  const uploaded = await uploadFile(token, folderId, archivePath, {
    name: path.basename(archivePath),
    description: "CVsolucion production SQLite backup",
  });
  const pruned = await pruneOldBackups(token, folderId);

  console.log(`Archive: ${archivePath}`);
  console.log(`Uploaded: ${uploaded.name} (${uploaded.id})`);
  console.log(`Folder: ${folderId}`);
  console.log(`Pruned: ${pruned}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
