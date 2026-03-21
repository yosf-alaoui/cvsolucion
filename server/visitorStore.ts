import crypto from "crypto";
import fs from "fs";
import path from "path";

export type VisitorPageView = {
  path: string;
  locale: string;
  title: string | null;
  referrer: string | null;
  occurredAt: string;
};

export type VisitorRecord = {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  landingPath: string;
  lastPath: string;
  locale: string;
  referrer: string | null;
  ip: string | null;
  userAgent: string | null;
  browserLanguage: string | null;
  timezone: string | null;
  screen: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  isRegistered: boolean;
  userId: string | null;
  email: string | null;
  pageViews: VisitorPageView[];
};

type VisitorDb = {
  visitors: VisitorRecord[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "visitors-db.json");

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ visitors: [] }, null, 2), "utf8");
  }
}

function loadDb(): VisitorDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<VisitorDb>;
  return { visitors: parsed.visitors ?? [] };
}

function saveDb(db: VisitorDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

export function createVisitorId() {
  return crypto.randomBytes(18).toString("hex");
}

function inferDeviceType(userAgent: string | null): VisitorRecord["deviceType"] {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|facebookexternalhit|whatsapp/.test(ua)) return "bot";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export function trackVisitor(input: {
  visitorId: string;
  path: string;
  locale: string;
  title?: string | null;
  referrer?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  browserLanguage?: string | null;
  timezone?: string | null;
  screen?: string | null;
  userId?: string | null;
  email?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  let visitor = db.visitors.find((item) => item.id === input.visitorId);

  if (!visitor) {
    visitor = {
      id: input.visitorId,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      visitCount: 0,
      landingPath: input.path,
      lastPath: input.path,
      locale: input.locale || "en",
      referrer: input.referrer || null,
      ip: input.ip || null,
      userAgent: input.userAgent || null,
      browserLanguage: input.browserLanguage || null,
      timezone: input.timezone || null,
      screen: input.screen || null,
      deviceType: inferDeviceType(input.userAgent || null),
      isRegistered: Boolean(input.userId),
      userId: input.userId || null,
      email: input.email || null,
      pageViews: [],
    };
    db.visitors.push(visitor);
  }

  visitor.lastSeenAt = timestamp;
  visitor.visitCount += 1;
  visitor.lastPath = input.path;
  visitor.locale = input.locale || visitor.locale;
  visitor.referrer = input.referrer || visitor.referrer;
  visitor.ip = input.ip || visitor.ip;
  visitor.userAgent = input.userAgent || visitor.userAgent;
  visitor.browserLanguage = input.browserLanguage || visitor.browserLanguage;
  visitor.timezone = input.timezone || visitor.timezone;
  visitor.screen = input.screen || visitor.screen;
  visitor.deviceType = inferDeviceType(input.userAgent || visitor.userAgent);
  visitor.isRegistered = visitor.isRegistered || Boolean(input.userId);
  visitor.userId = input.userId || visitor.userId;
  visitor.email = input.email || visitor.email;
  visitor.pageViews.push({
    path: input.path,
    locale: input.locale || visitor.locale,
    title: input.title || null,
    referrer: input.referrer || null,
    occurredAt: timestamp,
  });
  visitor.pageViews = visitor.pageViews.slice(-50);

  db.visitors = db.visitors
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
    .slice(0, 2000);
  saveDb(db);
  return visitor;
}

export function getVisitorsSnapshot() {
  const db = loadDb();
  return db.visitors
    .slice()
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
    .map((visitor) => ({
      ...visitor,
      pageViews: visitor.pageViews
        .slice()
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 20),
    }));
}
