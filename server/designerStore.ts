import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type DesignerTaskStatus = "todo" | "in_progress" | "done";
export type DesignerTaskPriority = "low" | "normal" | "high";

export type DesignerProfileRecord = {
  userId: string;
  email: string;
  displayName: string | null;
  title: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DesignerTaskRecord = {
  id: string;
  designerUserId: string;
  title: string;
  description: string | null;
  status: DesignerTaskStatus;
  priority: DesignerTaskPriority;
  dueAt: string | null;
  bookingId: string | null;
  createdByUserId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DesignerDb = {
  profiles: DesignerProfileRecord[];
  tasks: DesignerTaskRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "designers-db.json");

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 16) {
  return crypto.randomBytes(size).toString("hex");
}

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { profiles: [], tasks: [] });
}

function normalizeTaskStatus(status: unknown): DesignerTaskStatus {
  return status === "in_progress" || status === "done" ? status : "todo";
}

function normalizeTaskPriority(priority: unknown): DesignerTaskPriority {
  return priority === "low" || priority === "high" ? priority : "normal";
}

function loadDb(): DesignerDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<DesignerDb>>(DB_PATH);
  return {
    profiles: (parsed.profiles ?? []).map((profile) => ({
      ...profile,
      displayName: typeof profile.displayName === "string" && profile.displayName.trim() ? profile.displayName.trim() : null,
      title: typeof profile.title === "string" && profile.title.trim() ? profile.title.trim() : null,
      notes: typeof profile.notes === "string" && profile.notes.trim() ? profile.notes.trim() : null,
      active: profile.active !== false,
      createdAt: profile.createdAt || nowIso(),
      updatedAt: profile.updatedAt || profile.createdAt || nowIso(),
    })),
    tasks: (parsed.tasks ?? []).map((task) => ({
      ...task,
      description: typeof task.description === "string" && task.description.trim() ? task.description.trim() : null,
      status: normalizeTaskStatus(task.status),
      priority: normalizeTaskPriority(task.priority),
      dueAt: task.dueAt ?? null,
      bookingId: typeof task.bookingId === "string" && task.bookingId.trim() ? task.bookingId.trim() : null,
      createdByUserId:
        typeof task.createdByUserId === "string" && task.createdByUserId.trim() ? task.createdByUserId.trim() : null,
      completedAt: task.completedAt ?? null,
      createdAt: task.createdAt || nowIso(),
      updatedAt: task.updatedAt || task.createdAt || nowIso(),
    })),
  };
}

function saveDb(db: DesignerDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

export function getDesignerProfile(userId: string) {
  const db = loadDb();
  return db.profiles.find((profile) => profile.userId === userId) ?? null;
}

export function listDesignerProfiles() {
  const db = loadDb();
  return [...db.profiles].sort((a, b) => {
    const left = (a.displayName || a.email).toLowerCase();
    const right = (b.displayName || b.email).toLowerCase();
    return left.localeCompare(right);
  });
}

export function upsertDesignerProfile(input: {
  userId: string;
  email: string;
  displayName?: string | null;
  title?: string | null;
  notes?: string | null;
  active?: boolean;
}) {
  const db = loadDb();
  const existing = db.profiles.find((profile) => profile.userId === input.userId);
  const timestamp = nowIso();

  if (existing) {
    existing.email = input.email.trim().toLowerCase();
    existing.displayName = input.displayName?.trim() || null;
    existing.title = input.title?.trim() || null;
    existing.notes = input.notes?.trim() || null;
    if (typeof input.active === "boolean") {
      existing.active = input.active;
    }
    existing.updatedAt = timestamp;
    saveDb(db);
    return existing;
  }

  const profile: DesignerProfileRecord = {
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName?.trim() || null,
    title: input.title?.trim() || null,
    notes: input.notes?.trim() || null,
    active: input.active !== false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.profiles.push(profile);
  saveDb(db);
  return profile;
}

export function deleteDesignerProfile(userId: string) {
  const db = loadDb();
  db.profiles = db.profiles.filter((profile) => profile.userId !== userId);
  db.tasks = db.tasks.filter((task) => task.designerUserId !== userId);
  saveDb(db);
}

export function listDesignerTasks(designerUserId?: string | null) {
  const db = loadDb();
  const filtered = designerUserId
    ? db.tasks.filter((task) => task.designerUserId === designerUserId)
    : db.tasks;

  return [...filtered].sort((a, b) => {
    const left = a.dueAt || a.createdAt;
    const right = b.dueAt || b.createdAt;
    return left.localeCompare(right);
  });
}

export function createDesignerTask(input: {
  designerUserId: string;
  title: string;
  description?: string | null;
  status?: DesignerTaskStatus;
  priority?: DesignerTaskPriority;
  dueAt?: string | null;
  bookingId?: string | null;
  createdByUserId?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const task: DesignerTaskRecord = {
    id: randomId(),
    designerUserId: input.designerUserId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: normalizeTaskStatus(input.status),
    priority: normalizeTaskPriority(input.priority),
    dueAt: input.dueAt || null,
    bookingId: input.bookingId?.trim() || null,
    createdByUserId: input.createdByUserId?.trim() || null,
    completedAt: input.status === "done" ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.tasks.push(task);
  saveDb(db);
  return task;
}

export function updateDesignerTask(input: {
  taskId: string;
  designerUserId?: string;
  title?: string;
  description?: string | null;
  status?: DesignerTaskStatus;
  priority?: DesignerTaskPriority;
  dueAt?: string | null;
  bookingId?: string | null;
}) {
  const db = loadDb();
  const task = db.tasks.find((item) => item.id === input.taskId);
  if (!task) {
    throw new Error("Task not found.");
  }

  if (typeof input.designerUserId === "string" && input.designerUserId.trim()) {
    task.designerUserId = input.designerUserId.trim();
  }
  if (typeof input.title === "string" && input.title.trim()) {
    task.title = input.title.trim();
  }
  if (typeof input.description === "string" || input.description === null) {
    task.description = input.description?.trim() || null;
  }
  if (input.status) {
    task.status = normalizeTaskStatus(input.status);
    task.completedAt = task.status === "done" ? task.completedAt || nowIso() : null;
  }
  if (input.priority) {
    task.priority = normalizeTaskPriority(input.priority);
  }
  if (typeof input.dueAt === "string" || input.dueAt === null) {
    task.dueAt = input.dueAt || null;
  }
  if (typeof input.bookingId === "string" || input.bookingId === null) {
    task.bookingId = input.bookingId?.trim() || null;
  }
  task.updatedAt = nowIso();
  saveDb(db);
  return task;
}

export function deleteDesignerTask(taskId: string) {
  const db = loadDb();
  const before = db.tasks.length;
  db.tasks = db.tasks.filter((task) => task.id !== taskId);
  saveDb(db);
  return before !== db.tasks.length;
}
