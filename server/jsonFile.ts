import fs from "fs";
import path from "path";

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

export function ensureJsonFile<T>(filePath: string, initialValue: T) {
  if (!fs.existsSync(filePath)) {
    writeJsonFileAtomic(filePath, initialValue);
  }
}

export function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFileAtomic(filePath: string, data: unknown) {
  writeFileAtomic(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeBufferFileAtomic(filePath: string, data: Buffer) {
  writeFileAtomic(filePath, data);
}
