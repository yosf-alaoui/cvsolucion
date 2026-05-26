import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type BookingScheduleSettings = {
  standardOpen: boolean;
  expressOpen: boolean;
  updatedAt: string;
};

type BookingSettingsDb = {
  schedule: BookingScheduleSettings;
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "booking-settings-db.json");

function nowIso() {
  return new Date().toISOString();
}

function getDefaultSchedule(): BookingScheduleSettings {
  return {
    standardOpen: true,
    expressOpen: true,
    updatedAt: nowIso(),
  };
}

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { schedule: getDefaultSchedule() });
}

function loadDb(): BookingSettingsDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<BookingSettingsDb>>(DB_PATH);
  const schedule = parsed.schedule;
  return {
    schedule: {
      standardOpen: typeof schedule?.standardOpen === "boolean" ? schedule.standardOpen : true,
      expressOpen: typeof schedule?.expressOpen === "boolean" ? schedule.expressOpen : true,
      updatedAt: typeof schedule?.updatedAt === "string" && schedule.updatedAt ? schedule.updatedAt : nowIso(),
    },
  };
}

function saveDb(db: BookingSettingsDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

export function getBookingScheduleSettings() {
  return loadDb().schedule;
}

export function isBookingScheduleOpen(priority: "standard" | "express") {
  const schedule = getBookingScheduleSettings();
  return priority === "express" ? schedule.expressOpen : schedule.standardOpen;
}

export function updateBookingScheduleSettings(input: {
  standardOpen?: boolean;
  expressOpen?: boolean;
}) {
  const db = loadDb();
  if (typeof input.standardOpen === "boolean") {
    db.schedule.standardOpen = input.standardOpen;
  }
  if (typeof input.expressOpen === "boolean") {
    db.schedule.expressOpen = input.expressOpen;
  }
  db.schedule.updatedAt = nowIso();
  saveDb(db);
  return db.schedule;
}
