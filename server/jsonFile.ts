import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureDocument, isSqliteStorageEnabled, readDocument, writeDocument } from "./documentDatabase";

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
}

function writeFileAtomic(filePath: string, data: string | Buffer) {
  ensureParentDir(filePath);
  const tempPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tempPath, data, { mode: 0o600 });
  fs.renameSync(tempPath, filePath);
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // chmod can be unavailable on some development filesystems.
  }
}

function parseJsonText<T>(content: string) {
  return JSON.parse(content.replace(/^\uFEFF/, "")) as T;
}

export function ensureJsonFile<T>(filePath: string, initialValue: T) {
  if (isSqliteStorageEnabled()) {
    ensureDocument(documentKeyForPath(filePath), initialValue, () => {
      if (!fs.existsSync(filePath)) return initialValue;
      return parseJsonText<T>(fs.readFileSync(filePath, "utf8"));
    });
    return;
  }

  if (!fs.existsSync(filePath)) {
    writeJsonFileAtomic(filePath, initialValue);
  }
}

export function readJsonFile<T>(filePath: string) {
  if (isSqliteStorageEnabled()) {
    return readDocument<T>(documentKeyForPath(filePath));
  }

  return parseJsonText<T>(fs.readFileSync(filePath, "utf8"));
}

export function writeJsonFileAtomic(filePath: string, data: unknown) {
  if (isSqliteStorageEnabled()) {
    writeDocument(documentKeyForPath(filePath), data);
    if (shouldMirrorSqliteJson()) {
      writeFileAtomic(filePath, `${JSON.stringify(data, null, 2)}\n`);
    }
    return;
  }

  writeFileAtomic(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeBufferFileAtomic(filePath: string, data: Buffer) {
  writeFileAtomic(filePath, data);
}

function documentKeyForPath(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  const dataDir = path.resolve(getAppDataDir());
  const relativePath = path.relative(dataDir, resolvedPath);

  if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    return relativePath.split(path.sep).join("/");
  }

  return resolvedPath;
}

function shouldMirrorSqliteJson() {
  const configured = process.env.APP_SQLITE_JSON_MIRROR?.trim().toLowerCase();
  return configured !== "0" && configured !== "false" && configured !== "no";
}
