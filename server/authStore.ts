import crypto from "crypto";
import fs from "fs";
import path from "path";

export type AuthUser = {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type AuthTokenType = "verify_email" | "magic_link" | "reset_password";

export type AuthTokenRecord = {
  id: string;
  userId: string;
  type: AuthTokenType;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

export type AuthEventType =
  | "signup"
  | "login"
  | "logout"
  | "magic_link_requested"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verified"
  | "magic_login_completed"
  | "admin_user_updated"
  | "admin_user_deleted";

export type AuthEvent = {
  id: string;
  type: AuthEventType;
  userId: string | null;
  email: string | null;
  locale: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuthDb = {
  users: AuthUser[];
  sessions: AuthSession[];
  tokens: AuthTokenRecord[];
  events: AuthEvent[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "auth-db.json");

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const emptyDb: AuthDb = { users: [], sessions: [], tokens: [], events: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2), "utf8");
  }
}

function loadDb(): AuthDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<AuthDb>;
  return {
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? [],
    tokens: parsed.tokens ?? [],
    events: parsed.events ?? [],
  };
}

function saveDb(db: AuthDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function addMs(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password: string, salt = randomToken(16)) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { passwordSalt: salt, passwordHash };
}

export function verifyPassword(password: string, user: AuthUser) {
  const calculated = crypto.scryptSync(password, user.passwordSalt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(user.passwordHash, "hex"));
}

export function getUserByEmail(email: string) {
  const db = loadDb();
  return db.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getUserById(id: string) {
  const db = loadDb();
  return db.users.find((item) => item.id === id) ?? null;
}

export function createUser(email: string, password: string) {
  const db = loadDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.users.find((item) => item.email === normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const { passwordSalt, passwordHash } = hashPassword(password);
  const timestamp = nowIso();
  const user: AuthUser = {
    id: randomToken(16),
    email: normalizedEmail,
    passwordSalt,
    passwordHash,
    emailVerifiedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.users.push(user);
  saveDb(db);
  return user;
}

export function updateUserPassword(userId: string, password: string) {
  const db = loadDb();
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  const { passwordSalt, passwordHash } = hashPassword(password);
  user.passwordSalt = passwordSalt;
  user.passwordHash = passwordHash;
  user.updatedAt = nowIso();
  saveDb(db);
  return user;
}

export function markUserEmailVerified(userId: string) {
  const db = loadDb();
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  user.emailVerifiedAt = user.emailVerifiedAt ?? nowIso();
  user.updatedAt = nowIso();
  saveDb(db);
  return user;
}

export function createSession(userId: string, maxAgeMs: number) {
  const db = loadDb();
  const session: AuthSession = {
    id: randomToken(24),
    userId,
    createdAt: nowIso(),
    expiresAt: addMs(maxAgeMs),
  };
  db.sessions.push(session);
  saveDb(db);
  return session;
}

export function getSession(sessionId: string) {
  const db = loadDb();
  const session = db.sessions.find((item) => item.id === sessionId) ?? null;
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((item) => item.id !== sessionId);
    saveDb(db);
    return null;
  }
  return session;
}

export function deleteSession(sessionId: string) {
  const db = loadDb();
  db.sessions = db.sessions.filter((item) => item.id !== sessionId);
  saveDb(db);
}

export function createToken(userId: string, type: AuthTokenType, maxAgeMs: number) {
  const db = loadDb();
  const rawToken = randomToken(24);
  const token: AuthTokenRecord = {
    id: randomToken(12),
    userId,
    type,
    tokenHash: sha256(rawToken),
    createdAt: nowIso(),
    expiresAt: addMs(maxAgeMs),
    usedAt: null,
  };

  db.tokens = db.tokens.filter((item) => !(item.userId === userId && item.type === type && !item.usedAt));
  db.tokens.push(token);
  saveDb(db);

  return { rawToken, token };
}

export function consumeToken(rawToken: string, type: AuthTokenType) {
  const db = loadDb();
  const tokenHash = sha256(rawToken);
  const token = db.tokens.find((item) => item.tokenHash === tokenHash && item.type === type) ?? null;
  if (!token) return null;
  if (token.usedAt) return null;
  if (new Date(token.expiresAt).getTime() <= Date.now()) return null;

  token.usedAt = nowIso();
  saveDb(db);
  return token;
}

export function serializePublicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

export function updateAdminUser(input: {
  userId: string;
  email?: string;
  password?: string;
  emailVerified?: boolean;
}) {
  const db = loadDb();
  const user = db.users.find((item) => item.id === input.userId);
  if (!user) {
    throw new Error("User not found.");
  }

  if (typeof input.email === "string") {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Email is required.");
    }
    const existing = db.users.find((item) => item.email === normalizedEmail && item.id !== input.userId);
    if (existing) {
      throw new Error("Another account already uses this email.");
    }
    user.email = normalizedEmail;
  }

  if (typeof input.password === "string" && input.password.length > 0) {
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const { passwordSalt, passwordHash } = hashPassword(input.password);
    user.passwordSalt = passwordSalt;
    user.passwordHash = passwordHash;
  }

  if (typeof input.emailVerified === "boolean") {
    user.emailVerifiedAt = input.emailVerified ? user.emailVerifiedAt ?? nowIso() : null;
  }

  user.updatedAt = nowIso();
  saveDb(db);
  return user;
}

export function deleteUserById(userId: string) {
  const db = loadDb();
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  db.users = db.users.filter((item) => item.id !== userId);
  db.sessions = db.sessions.filter((item) => item.userId !== userId);
  db.tokens = db.tokens.filter((item) => item.userId !== userId);
  db.events = db.events.filter((item) => item.userId !== userId);
  saveDb(db);
  return user;
}

export function recordEvent(input: Omit<AuthEvent, "id" | "createdAt">) {
  const db = loadDb();
  const event: AuthEvent = {
    id: randomToken(12),
    createdAt: nowIso(),
    ...input,
  };
  db.events.push(event);
  db.events = db.events.slice(-1000);
  saveDb(db);
  return event;
}

export function getAdminSnapshot() {
  const db = loadDb();
  const now = Date.now();

  const activeSessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
  const recentEvents = [...db.events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
  const users = [...db.users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((user) => ({
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

  return {
    stats: {
      totalUsers: db.users.length,
      verifiedUsers: db.users.filter((user) => Boolean(user.emailVerifiedAt)).length,
      activeSessions: activeSessions.length,
      pendingTokens: db.tokens.filter((token) => !token.usedAt && new Date(token.expiresAt).getTime() > now).length,
      totalEvents: db.events.length,
    },
    users,
    sessions: activeSessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((session) => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
    events: recentEvents,
  };
}
