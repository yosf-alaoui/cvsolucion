import path from "path";

export function getAppDataDir() {
  const configured = process.env.APP_DATA_DIR?.trim();
  if (!configured) {
    return path.resolve(process.cwd(), "data");
  }

  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

export function resolveAppDataPath(...segments: string[]) {
  return path.join(getAppDataDir(), ...segments);
}
