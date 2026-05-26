import crypto from "crypto";
import path from "path";
import { TRAINING_BLUEPRINT, TRAINING_LEVELS, type TrainingBlueprintLevelKey } from "../shared/trainingBlueprint";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type TrainerProfileRecord = {
  userId: string;
  email: string;
  displayName: string | null;
  title: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainingEnrollmentStatus = "pending" | "active" | "completed" | "paused" | "cancelled";
export type TrainingSessionProgressStatus = "pending" | "completed" | "repeat_required";

export type TrainingEnrollmentRecord = {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string | null;
  company: string | null;
  country: string | null;
  countryCode: string | null;
  curriculumKey: string;
  programKey: string;
  programId: string | null;
  source: "payment" | "admin";
  paymentIntentId: string | null;
  purchaseAmount: number | null;
  currency: string | null;
  trainerUserId: string | null;
  trainerAssignedAt: string | null;
  trainerAssignedByUserId: string | null;
  status: TrainingEnrollmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainingSessionProgressRecord = {
  id: string;
  enrollmentId: string;
  sessionCode: string;
  levelKey: TrainingBlueprintLevelKey;
  order: number;
  status: TrainingSessionProgressStatus;
  score: number | null;
  passed: boolean | null;
  trainerNotes: string | null;
  traineeNotes: string | null;
  evidence: string | null;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TrainingDb = {
  trainers: TrainerProfileRecord[];
  enrollments: TrainingEnrollmentRecord[];
  sessionProgress: TrainingSessionProgressRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "training-db.json");

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 16) {
  return crypto.randomBytes(size).toString("hex");
}

function normalizeCountryCode(value: unknown) {
  const countryCode = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function normalizeEnrollmentStatus(value: unknown): TrainingEnrollmentStatus {
  return value === "active" || value === "completed" || value === "paused" || value === "cancelled" ? value : "pending";
}

function normalizeSessionStatus(value: unknown): TrainingSessionProgressStatus {
  return value === "completed" || value === "repeat_required" ? value : "pending";
}

function normalizeSessionScore(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function ensureDbFile() {
  const emptyDb: TrainingDb = { trainers: [], enrollments: [], sessionProgress: [] };
  ensureJsonFile(DB_PATH, emptyDb);
}

function loadDb(): TrainingDb {
  ensureDbFile();
  const parsed = readJsonFile<Partial<TrainingDb>>(DB_PATH);
  return {
    trainers: (parsed.trainers ?? []).map((trainer) => ({
      ...trainer,
      email: String(trainer.email || "").trim().toLowerCase(),
      displayName: typeof trainer.displayName === "string" && trainer.displayName.trim() ? trainer.displayName.trim() : null,
      title: typeof trainer.title === "string" && trainer.title.trim() ? trainer.title.trim() : null,
      notes: typeof trainer.notes === "string" && trainer.notes.trim() ? trainer.notes.trim() : null,
      active: trainer.active !== false,
      createdAt: trainer.createdAt || nowIso(),
      updatedAt: trainer.updatedAt || trainer.createdAt || nowIso(),
    })),
    enrollments: (parsed.enrollments ?? []).map((enrollment) => ({
      ...enrollment,
      userEmail: String(enrollment.userEmail || "").trim().toLowerCase(),
      customerName: typeof enrollment.customerName === "string" && enrollment.customerName.trim() ? enrollment.customerName.trim() : null,
      company: typeof enrollment.company === "string" && enrollment.company.trim() ? enrollment.company.trim() : null,
      country: typeof enrollment.country === "string" && enrollment.country.trim() ? enrollment.country.trim() : null,
      countryCode: normalizeCountryCode(enrollment.countryCode),
      programId: typeof enrollment.programId === "string" && enrollment.programId.trim() ? enrollment.programId.trim() : null,
      paymentIntentId: typeof enrollment.paymentIntentId === "string" && enrollment.paymentIntentId.trim() ? enrollment.paymentIntentId.trim() : null,
      purchaseAmount: Number.isInteger(enrollment.purchaseAmount) ? enrollment.purchaseAmount : null,
      currency: typeof enrollment.currency === "string" && enrollment.currency.trim() ? enrollment.currency.trim().toLowerCase() : null,
      trainerUserId: typeof enrollment.trainerUserId === "string" && enrollment.trainerUserId.trim() ? enrollment.trainerUserId.trim() : null,
      trainerAssignedAt: enrollment.trainerAssignedAt || null,
      trainerAssignedByUserId:
        typeof enrollment.trainerAssignedByUserId === "string" && enrollment.trainerAssignedByUserId.trim()
          ? enrollment.trainerAssignedByUserId.trim()
          : null,
      status: normalizeEnrollmentStatus(enrollment.status),
      startedAt: enrollment.startedAt || null,
      completedAt: enrollment.completedAt || null,
      notes: typeof enrollment.notes === "string" && enrollment.notes.trim() ? enrollment.notes.trim() : null,
      internalNotes: typeof enrollment.internalNotes === "string" && enrollment.internalNotes.trim() ? enrollment.internalNotes.trim() : null,
      createdAt: enrollment.createdAt || nowIso(),
      updatedAt: enrollment.updatedAt || enrollment.createdAt || nowIso(),
    })),
    sessionProgress: (parsed.sessionProgress ?? []).map((session) => ({
      ...session,
      levelKey:
        session.levelKey === "beginner" || session.levelKey === "intermediate" || session.levelKey === "advanced" || session.levelKey === "final"
          ? session.levelKey
          : "beginner",
      status: normalizeSessionStatus(session.status),
      score: normalizeSessionScore(session.score),
      passed: typeof session.passed === "boolean" ? session.passed : null,
      trainerNotes: typeof session.trainerNotes === "string" && session.trainerNotes.trim() ? session.trainerNotes.trim() : null,
      traineeNotes: typeof session.traineeNotes === "string" && session.traineeNotes.trim() ? session.traineeNotes.trim() : null,
      evidence: typeof session.evidence === "string" && session.evidence.trim() ? session.evidence.trim() : null,
      confirmedByUserId:
        typeof session.confirmedByUserId === "string" && session.confirmedByUserId.trim() ? session.confirmedByUserId.trim() : null,
      confirmedAt: session.confirmedAt || null,
      createdAt: session.createdAt || nowIso(),
      updatedAt: session.updatedAt || session.createdAt || nowIso(),
    })),
  };
}

function saveDb(db: TrainingDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function sortEnrollments(enrollments: TrainingEnrollmentRecord[]) {
  return [...enrollments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortSessionProgress(records: TrainingSessionProgressRecord[]) {
  return [...records].sort((a, b) => a.order - b.order || a.sessionCode.localeCompare(b.sessionCode));
}

function sessionDefaults(enrollmentId: string) {
  const timestamp = nowIso();
  return TRAINING_BLUEPRINT.sessions.map<TrainingSessionProgressRecord>((session) => ({
    id: randomId(12),
    enrollmentId,
    sessionCode: session.sessionCode,
    levelKey: session.levelKey,
    order: session.order,
    status: "pending",
    score: null,
    passed: null,
    trainerNotes: null,
    traineeNotes: null,
    evidence: null,
    confirmedByUserId: null,
    confirmedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function recomputeEnrollmentState(db: TrainingDb, enrollmentId: string) {
  const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
  if (!enrollment) return null;

  const sessions = sortSessionProgress(db.sessionProgress.filter((item) => item.enrollmentId === enrollmentId));
  const hasStarted = sessions.some((session) => session.status !== "pending");
  const allDone = sessions.every((session) => session.status === "completed");
  const hasRepeat = sessions.some((session) => session.status === "repeat_required");
  const timestamp = nowIso();

  if (enrollment.status !== "cancelled") {
    if (allDone && !hasRepeat) {
      enrollment.status = "completed";
      enrollment.completedAt = enrollment.completedAt || timestamp;
      enrollment.startedAt = enrollment.startedAt || timestamp;
    } else if (hasStarted && enrollment.status === "pending") {
      enrollment.status = "active";
      enrollment.startedAt = enrollment.startedAt || timestamp;
      enrollment.completedAt = null;
    } else if (!hasStarted && enrollment.status === "completed") {
      enrollment.status = "pending";
      enrollment.startedAt = null;
      enrollment.completedAt = null;
    } else if (hasRepeat && enrollment.status === "completed") {
      enrollment.status = "active";
      enrollment.completedAt = null;
    }
  }

  enrollment.updatedAt = timestamp;
  return enrollment;
}

export function getTrainerProfile(userId: string) {
  const db = loadDb();
  return db.trainers.find((trainer) => trainer.userId === userId) || null;
}

export function listTrainerProfiles() {
  const db = loadDb();
  return [...db.trainers].sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
}

export function upsertTrainerProfile(input: {
  userId: string;
  email: string;
  displayName?: string | null;
  title?: string | null;
  notes?: string | null;
  active?: boolean;
}) {
  const db = loadDb();
  const existing = db.trainers.find((trainer) => trainer.userId === input.userId);
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

  const trainer: TrainerProfileRecord = {
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName?.trim() || null,
    title: input.title?.trim() || null,
    notes: input.notes?.trim() || null,
    active: input.active !== false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.trainers.push(trainer);
  saveDb(db);
  return trainer;
}

export function deactivateTrainerProfile(userId: string) {
  const db = loadDb();
  const trainer = db.trainers.find((item) => item.userId === userId);
  if (!trainer) return null;
  trainer.active = false;
  trainer.updatedAt = nowIso();
  saveDb(db);
  return trainer;
}

export function unassignTrainerFromEnrollments(trainerUserId: string) {
  const db = loadDb();
  let changed = false;
  for (const enrollment of db.enrollments) {
    if (enrollment.trainerUserId === trainerUserId) {
      enrollment.trainerUserId = null;
      enrollment.trainerAssignedAt = null;
      enrollment.trainerAssignedByUserId = null;
      enrollment.updatedAt = nowIso();
      changed = true;
    }
  }
  if (changed) saveDb(db);
  return changed;
}

export function createTrainingEnrollment(input: {
  userId: string;
  userEmail: string;
  customerName?: string | null;
  company?: string | null;
  country?: string | null;
  countryCode?: string | null;
  programKey: string;
  programId?: string | null;
  source?: "payment" | "admin";
  paymentIntentId?: string | null;
  purchaseAmount?: number | null;
  currency?: string | null;
  trainerUserId?: string | null;
  trainerAssignedByUserId?: string | null;
  status?: TrainingEnrollmentStatus;
  notes?: string | null;
  internalNotes?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const enrollmentId = randomId();
  const enrollment: TrainingEnrollmentRecord = {
    id: enrollmentId,
    userId: input.userId,
    userEmail: input.userEmail.trim().toLowerCase(),
    customerName: input.customerName?.trim() || null,
    company: input.company?.trim() || null,
    country: input.country?.trim() || null,
    countryCode: normalizeCountryCode(input.countryCode),
    curriculumKey: TRAINING_BLUEPRINT.key,
    programKey: String(input.programKey || "").trim(),
    programId: input.programId?.trim() || null,
    source: input.source || "admin",
    paymentIntentId: input.paymentIntentId?.trim() || null,
    purchaseAmount: typeof input.purchaseAmount === "number" && Number.isInteger(input.purchaseAmount) ? input.purchaseAmount : null,
    currency: input.currency?.trim().toLowerCase() || null,
    trainerUserId: input.trainerUserId?.trim() || null,
    trainerAssignedAt: input.trainerUserId ? timestamp : null,
    trainerAssignedByUserId: input.trainerUserId ? input.trainerAssignedByUserId?.trim() || null : null,
    status: normalizeEnrollmentStatus(input.status),
    startedAt: input.status === "active" || input.status === "completed" ? timestamp : null,
    completedAt: input.status === "completed" ? timestamp : null,
    notes: input.notes?.trim() || null,
    internalNotes: input.internalNotes?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.enrollments.push(enrollment);
  db.sessionProgress.push(...sessionDefaults(enrollmentId));
  recomputeEnrollmentState(db, enrollmentId);
  saveDb(db);
  return enrollment;
}

export function ensureTrainingEnrollmentFromPurchase(input: {
  userId: string;
  userEmail: string;
  customerName?: string | null;
  company?: string | null;
  country?: string | null;
  countryCode?: string | null;
  programKey: string;
  programId?: string | null;
  paymentIntentId: string;
  purchaseAmount: number;
  currency: string;
}) {
  const db = loadDb();
  const normalizedPaymentIntentId = String(input.paymentIntentId || "").trim();
  const existing = db.enrollments.find((item) => item.paymentIntentId === normalizedPaymentIntentId);
  if (existing) {
    return existing;
  }

  return createTrainingEnrollment({
    ...input,
    source: "payment",
  });
}

export function getTrainingEnrollment(enrollmentId: string) {
  const db = loadDb();
  const enrollment = db.enrollments.find((item) => item.id === enrollmentId) || null;
  return enrollment;
}

export function listTrainingEnrollments() {
  const db = loadDb();
  return sortEnrollments(db.enrollments);
}

export function listTrainingEnrollmentsForUser(userId: string) {
  const db = loadDb();
  return sortEnrollments(db.enrollments.filter((item) => item.userId === userId));
}

export function listTrainingEnrollmentsForTrainer(trainerUserId: string) {
  const db = loadDb();
  return sortEnrollments(db.enrollments.filter((item) => item.trainerUserId === trainerUserId));
}

export function listTrainingSessionProgress(enrollmentId: string) {
  const db = loadDb();
  return sortSessionProgress(db.sessionProgress.filter((item) => item.enrollmentId === enrollmentId));
}

export function updateTrainingEnrollment(input: {
  enrollmentId: string;
  trainerUserId?: string | null;
  trainerAssignedByUserId?: string | null;
  status?: TrainingEnrollmentStatus;
  notes?: string | null;
  internalNotes?: string | null;
}) {
  const db = loadDb();
  const enrollment = db.enrollments.find((item) => item.id === input.enrollmentId);
  if (!enrollment) {
    throw new Error("Training enrollment not found.");
  }

  if (typeof input.trainerUserId === "string" || input.trainerUserId === null) {
    const nextTrainerId = input.trainerUserId?.trim() || null;
    enrollment.trainerUserId = nextTrainerId;
    enrollment.trainerAssignedAt = nextTrainerId ? nowIso() : null;
    enrollment.trainerAssignedByUserId = nextTrainerId ? input.trainerAssignedByUserId?.trim() || null : null;
  }
  if (input.status) {
    enrollment.status = normalizeEnrollmentStatus(input.status);
    if (enrollment.status === "active") {
      enrollment.startedAt = enrollment.startedAt || nowIso();
      enrollment.completedAt = null;
    }
    if (enrollment.status === "completed") {
      enrollment.startedAt = enrollment.startedAt || nowIso();
      enrollment.completedAt = nowIso();
    }
    if (enrollment.status === "pending") {
      enrollment.startedAt = null;
      enrollment.completedAt = null;
    }
    if (enrollment.status === "cancelled" || enrollment.status === "paused") {
      enrollment.completedAt = null;
    }
  }
  if (typeof input.notes === "string" || input.notes === null) {
    enrollment.notes = input.notes?.trim() || null;
  }
  if (typeof input.internalNotes === "string" || input.internalNotes === null) {
    enrollment.internalNotes = input.internalNotes?.trim() || null;
  }

  enrollment.updatedAt = nowIso();
  recomputeEnrollmentState(db, enrollment.id);
  saveDb(db);
  return enrollment;
}

export function updateTrainingSessionProgress(input: {
  enrollmentId: string;
  sessionCode: string;
  updatedByUserId: string;
  status?: TrainingSessionProgressStatus;
  score?: number | null;
  trainerNotes?: string | null;
  traineeNotes?: string | null;
  evidence?: string | null;
}) {
  const db = loadDb();
  const enrollment = db.enrollments.find((item) => item.id === input.enrollmentId);
  if (!enrollment) {
    throw new Error("Training enrollment not found.");
  }

  const session = db.sessionProgress.find(
    (item) => item.enrollmentId === input.enrollmentId && item.sessionCode === input.sessionCode
  );
  if (!session) {
    throw new Error("Training session not found.");
  }

  const template = TRAINING_BLUEPRINT.sessions.find((item) => item.sessionCode === session.sessionCode);
  const nextStatus = input.status ? normalizeSessionStatus(input.status) : session.status;
  const nextScore = normalizeSessionScore(typeof input.score === "undefined" ? session.score : input.score);

  if (template?.kind !== "validation" && nextStatus === "completed") {
    if (nextScore === null) {
      throw new Error("A score out of 10 is required before confirming the session.");
    }
    if (nextScore < TRAINING_BLUEPRINT.passThreshold) {
      throw new Error("A completed session must reach the pass threshold of 7/10.");
    }
  }

  if (nextStatus === "repeat_required" && template?.kind !== "validation" && nextScore !== null && nextScore >= TRAINING_BLUEPRINT.passThreshold) {
    throw new Error("Use completed status when the score reaches the pass threshold.");
  }

  session.status = nextStatus;
  session.score = nextScore;
  session.passed = nextStatus === "completed" ? true : nextStatus === "repeat_required" ? false : null;
  if (typeof input.trainerNotes === "string" || input.trainerNotes === null) {
    session.trainerNotes = input.trainerNotes?.trim() || null;
  }
  if (typeof input.traineeNotes === "string" || input.traineeNotes === null) {
    session.traineeNotes = input.traineeNotes?.trim() || null;
  }
  if (typeof input.evidence === "string" || input.evidence === null) {
    session.evidence = input.evidence?.trim() || null;
  }
  session.confirmedByUserId = input.updatedByUserId;
  session.confirmedAt = nextStatus === "pending" ? null : nowIso();
  session.updatedAt = nowIso();

  recomputeEnrollmentState(db, input.enrollmentId);
  saveDb(db);
  return session;
}

export function buildTrainingEnrollmentView(enrollmentId: string) {
  const db = loadDb();
  const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
  if (!enrollment) return null;

  const sessions = sortSessionProgress(db.sessionProgress.filter((item) => item.enrollmentId === enrollmentId)).map((progress) => {
    const template = TRAINING_BLUEPRINT.sessions.find((item) => item.sessionCode === progress.sessionCode);
    return {
      ...progress,
      template: template || null,
    };
  });

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((session) => session.status === "completed").length;
  const repeatRequiredSessions = sessions.filter((session) => session.status === "repeat_required").length;
  const percent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const nextSession = sessions.find((session) => session.status !== "completed") || null;
  const finalValidation = sessions.find((session) => session.sessionCode === "Final Validation") || null;

  const levels = TRAINING_LEVELS.map((level) => {
    const levelSessions = sessions.filter((session) => session.levelKey === level.key);
    const levelCompleted = levelSessions.filter((session) => session.status === "completed").length;
    const levelRepeat = levelSessions.filter((session) => session.status === "repeat_required").length;
    return {
      key: level.key,
      label: level.label,
      hours: level.hours,
      totalSessions: levelSessions.length,
      completedSessions: levelCompleted,
      repeatRequiredSessions: levelRepeat,
      percent: levelSessions.length > 0 ? Math.round((levelCompleted / levelSessions.length) * 100) : 0,
    };
  });

  return {
    ...enrollment,
    sessions,
    progress: {
      totalSessions,
      completedSessions,
      repeatRequiredSessions,
      percent,
      nextSessionCode: nextSession?.sessionCode || null,
      nextSessionTopic: nextSession?.template?.topic || null,
      finalValidationCompleted: finalValidation?.status === "completed",
    },
    levels,
  };
}
