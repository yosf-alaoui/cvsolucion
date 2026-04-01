import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";

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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ schedule: getDefaultSchedule() }, null, 2), "utf8");
  }
}

function loadDb(): BookingSettingsDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<BookingSettingsDb>;
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
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
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
