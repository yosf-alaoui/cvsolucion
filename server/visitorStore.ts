import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
import {
  isSqliteStorageEnabled,
  withDocumentDatabase,
} from "./documentDatabase";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type VisitorPageView = {
  path: string;
  locale: string;
  title: string | null;
  referrer: string | null;
  occurredAt: string;
  sessionId: string | null;
};

export type VisitorInteractionType =
  | "session_start"
  | "session_end"
  | "whatsapp_click"
  | "email_click"
  | "cta_click"
  | "chat_open"
  | "chat_message";

export type VisitorInteraction = {
  type: VisitorInteractionType;
  path: string;
  label: string | null;
  href: string | null;
  sessionId: string | null;
  durationMs: number | null;
  pageCount: number | null;
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
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  totalSessions: number;
  totalPageViews: number;
  totalDurationMs: number;
  lastSessionDurationMs: number | null;
  lastSessionPageCount: number | null;
  whatsappClicks: number;
  emailClicks: number;
  ctaClicks: number;
  chatOpens: number;
  chatMessages: number;
  lastWhatsappClickAt: string | null;
  lastEmailClickAt: string | null;
  lastChatAt: string | null;
  pageViews: VisitorPageView[];
  interactions: VisitorInteraction[];
};

type VisitorDb = {
  visitors: VisitorRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "visitors-db.json");

function ensureDbFile() {
  ensureJsonFile(DB_PATH, { visitors: [] });
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrZero(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function normalizeDeviceType(value: unknown): VisitorRecord["deviceType"] {
  return value === "desktop" ||
    value === "mobile" ||
    value === "tablet" ||
    value === "bot" ||
    value === "unknown"
    ? value
    : "unknown";
}

function normalizeInteractionType(value: unknown): VisitorInteractionType {
  return value === "session_end" ||
    value === "whatsapp_click" ||
    value === "email_click" ||
    value === "cta_click" ||
    value === "chat_open" ||
    value === "chat_message"
    ? value
    : "session_start";
}

function loadStructuredDb(): VisitorDb | null {
  if (!isSqliteStorageEnabled()) return null;

  return withDocumentDatabase((sqlite) => {
    const pageViewsByVisitor = new Map<string, VisitorPageView[]>();
    const interactionsByVisitor = new Map<string, VisitorInteraction[]>();

    const pageViewRows = sqlite
      .prepare(
        `
          SELECT
            visitor_id AS visitorId,
            path,
            locale,
            title,
            referrer,
            occurred_at AS occurredAt,
            session_id AS sessionId
          FROM visitor_page_views
          ORDER BY visitor_id ASC, sort_index ASC
        `,
      )
      .all() as Array<Record<string, unknown>>;

    for (const row of pageViewRows) {
      const visitorId = String(row.visitorId || "");
      const pageViews = pageViewsByVisitor.get(visitorId) ?? [];
      pageViews.push({
        path: String(row.path || ""),
        locale: String(row.locale || "en"),
        title: textOrNull(row.title),
        referrer: textOrNull(row.referrer),
        occurredAt: String(row.occurredAt || nowIso()),
        sessionId: textOrNull(row.sessionId),
      });
      pageViewsByVisitor.set(visitorId, pageViews);
    }

    const interactionRows = sqlite
      .prepare(
        `
          SELECT
            visitor_id AS visitorId,
            type,
            path,
            label,
            href,
            session_id AS sessionId,
            duration_ms AS durationMs,
            page_count AS pageCount,
            occurred_at AS occurredAt
          FROM visitor_interactions
          ORDER BY visitor_id ASC, sort_index ASC
        `,
      )
      .all() as Array<Record<string, unknown>>;

    for (const row of interactionRows) {
      const visitorId = String(row.visitorId || "");
      const interactions = interactionsByVisitor.get(visitorId) ?? [];
      interactions.push({
        type: normalizeInteractionType(row.type),
        path: String(row.path || ""),
        label: textOrNull(row.label),
        href: textOrNull(row.href),
        sessionId: textOrNull(row.sessionId),
        durationMs: numberOrNull(row.durationMs),
        pageCount: numberOrNull(row.pageCount),
        occurredAt: String(row.occurredAt || nowIso()),
      });
      interactionsByVisitor.set(visitorId, interactions);
    }

    const visitorRows = sqlite
      .prepare(
        `
            SELECT
              id,
              first_seen_at AS firstSeenAt,
              last_seen_at AS lastSeenAt,
              visit_count AS visitCount,
              landing_path AS landingPath,
              last_path AS lastPath,
              locale,
              referrer,
              ip,
              user_agent AS userAgent,
              browser_language AS browserLanguage,
              timezone,
              screen,
              device_type AS deviceType,
              is_registered AS isRegistered,
              user_id AS userId,
              email,
              utm_source AS utmSource,
              utm_medium AS utmMedium,
              utm_campaign AS utmCampaign,
              utm_term AS utmTerm,
              utm_content AS utmContent,
              gclid,
              fbclid,
              total_sessions AS totalSessions,
              total_page_views AS totalPageViews,
              total_duration_ms AS totalDurationMs,
              last_session_duration_ms AS lastSessionDurationMs,
              last_session_page_count AS lastSessionPageCount,
              whatsapp_clicks AS whatsappClicks,
              email_clicks AS emailClicks,
              cta_clicks AS ctaClicks,
              chat_opens AS chatOpens,
              chat_messages AS chatMessages,
              last_whatsapp_click_at AS lastWhatsappClickAt,
              last_email_click_at AS lastEmailClickAt,
              last_chat_at AS lastChatAt
            FROM visitors
            ORDER BY last_seen_at DESC
            LIMIT 2000
          `,
      )
      .all() as Array<Record<string, unknown>>;

    if (!visitorRows.length) {
      const document = sqlite
        .prepare("SELECT value FROM documents WHERE key = ?")
        .get("visitors-db.json") as { value: string } | undefined;
      if (document) {
        const parsed = JSON.parse(document.value) as Partial<VisitorDb>;
        if ((parsed.visitors?.length ?? 0) > 0) {
          return null;
        }
      }
    }

    const visitors = visitorRows.map((visitor): VisitorRecord => {
      const id = String(visitor.id || "");
      const userAgent = textOrNull(visitor.userAgent);
      const deviceType = normalizeDeviceType(visitor.deviceType);
      return {
        id,
        firstSeenAt: String(visitor.firstSeenAt || nowIso()),
        lastSeenAt: String(
          visitor.lastSeenAt || visitor.firstSeenAt || nowIso(),
        ),
        visitCount: numberOrZero(visitor.visitCount),
        landingPath: String(visitor.landingPath || ""),
        lastPath: String(visitor.lastPath || ""),
        locale: String(visitor.locale || "en"),
        referrer: textOrNull(visitor.referrer),
        ip: textOrNull(visitor.ip),
        userAgent,
        browserLanguage: textOrNull(visitor.browserLanguage),
        timezone: textOrNull(visitor.timezone),
        screen: textOrNull(visitor.screen),
        deviceType:
          deviceType === "unknown" && userAgent
            ? inferDeviceType(userAgent)
            : deviceType,
        isRegistered: Boolean(visitor.isRegistered),
        userId: textOrNull(visitor.userId),
        email: textOrNull(visitor.email),
        utmSource: textOrNull(visitor.utmSource),
        utmMedium: textOrNull(visitor.utmMedium),
        utmCampaign: textOrNull(visitor.utmCampaign),
        utmTerm: textOrNull(visitor.utmTerm),
        utmContent: textOrNull(visitor.utmContent),
        gclid: textOrNull(visitor.gclid),
        fbclid: textOrNull(visitor.fbclid),
        totalSessions: numberOrZero(visitor.totalSessions),
        totalPageViews: numberOrZero(visitor.totalPageViews),
        totalDurationMs: numberOrZero(visitor.totalDurationMs),
        lastSessionDurationMs: numberOrNull(visitor.lastSessionDurationMs),
        lastSessionPageCount: numberOrNull(visitor.lastSessionPageCount),
        whatsappClicks: numberOrZero(visitor.whatsappClicks),
        emailClicks: numberOrZero(visitor.emailClicks),
        ctaClicks: numberOrZero(visitor.ctaClicks),
        chatOpens: numberOrZero(visitor.chatOpens),
        chatMessages: numberOrZero(visitor.chatMessages),
        lastWhatsappClickAt: textOrNull(visitor.lastWhatsappClickAt),
        lastEmailClickAt: textOrNull(visitor.lastEmailClickAt),
        lastChatAt: textOrNull(visitor.lastChatAt),
        pageViews: pageViewsByVisitor.get(id) ?? [],
        interactions: interactionsByVisitor.get(id) ?? [],
      };
    });

    return { visitors };
  });
}

function loadDb(): VisitorDb {
  ensureDbFile();
  const structured = loadStructuredDb();
  if (structured) return structured;

  const parsed = readJsonFile<Partial<VisitorDb>>(DB_PATH);
  return { visitors: parsed.visitors ?? [] };
}

function saveDb(db: VisitorDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function nowIso() {
  return new Date().toISOString();
}

export function createVisitorId() {
  return crypto.randomBytes(18).toString("hex");
}

function inferDeviceType(
  userAgent: string | null,
): VisitorRecord["deviceType"] {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|facebookexternalhit|whatsapp/.test(ua))
    return "bot";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export function trackVisitor(input: {
  visitorId: string;
  path: string;
  search?: string | null;
  sessionId?: string | null;
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
  const params = new URLSearchParams(
    String(input.search || "").replace(/^\?/, ""),
  );
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmTerm = params.get("utm_term");
  const utmContent = params.get("utm_content");
  const gclid = params.get("gclid");
  const fbclid = params.get("fbclid");
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
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      gclid,
      fbclid,
      totalSessions: 0,
      totalPageViews: 0,
      totalDurationMs: 0,
      lastSessionDurationMs: null,
      lastSessionPageCount: null,
      whatsappClicks: 0,
      emailClicks: 0,
      ctaClicks: 0,
      chatOpens: 0,
      chatMessages: 0,
      lastWhatsappClickAt: null,
      lastEmailClickAt: null,
      lastChatAt: null,
      pageViews: [],
      interactions: [],
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
  visitor.utmSource = visitor.utmSource || utmSource;
  visitor.utmMedium = visitor.utmMedium || utmMedium;
  visitor.utmCampaign = visitor.utmCampaign || utmCampaign;
  visitor.utmTerm = visitor.utmTerm || utmTerm;
  visitor.utmContent = visitor.utmContent || utmContent;
  visitor.gclid = visitor.gclid || gclid;
  visitor.fbclid = visitor.fbclid || fbclid;
  visitor.chatOpens = visitor.chatOpens ?? 0;
  visitor.chatMessages = visitor.chatMessages ?? 0;
  visitor.lastChatAt = visitor.lastChatAt ?? null;
  visitor.totalPageViews += 1;
  visitor.pageViews.push({
    path: input.path,
    locale: input.locale || visitor.locale,
    title: input.title || null,
    referrer: input.referrer || null,
    occurredAt: timestamp,
    sessionId: input.sessionId || null,
  });
  visitor.pageViews = visitor.pageViews.slice(-50);

  db.visitors = db.visitors
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
    )
    .slice(0, 2000);
  saveDb(db);
  return visitor;
}

export function trackVisitorInteraction(input: {
  visitorId: string;
  type: VisitorInteractionType;
  path: string;
  label?: string | null;
  href?: string | null;
  sessionId?: string | null;
  durationMs?: number | null;
  pageCount?: number | null;
}) {
  const db = loadDb();
  const visitor = db.visitors.find((item) => item.id === input.visitorId);
  if (!visitor) return null;

  const timestamp = nowIso();
  const interaction: VisitorInteraction = {
    type: input.type,
    path: input.path,
    label: input.label || null,
    href: input.href || null,
    sessionId: input.sessionId || null,
    durationMs: typeof input.durationMs === "number" ? input.durationMs : null,
    pageCount: typeof input.pageCount === "number" ? input.pageCount : null,
    occurredAt: timestamp,
  };

  visitor.interactions.push(interaction);
  visitor.interactions = visitor.interactions.slice(-80);

  if (input.type === "session_start") {
    visitor.totalSessions += 1;
  }
  if (input.type === "session_end") {
    visitor.lastSessionDurationMs = interaction.durationMs;
    visitor.lastSessionPageCount = interaction.pageCount;
    if (interaction.durationMs) {
      visitor.totalDurationMs += interaction.durationMs;
    }
  }
  if (input.type === "whatsapp_click") {
    visitor.whatsappClicks += 1;
    visitor.lastWhatsappClickAt = timestamp;
  }
  if (input.type === "email_click") {
    visitor.emailClicks += 1;
    visitor.lastEmailClickAt = timestamp;
  }
  if (input.type === "cta_click") {
    visitor.ctaClicks += 1;
  }
  if (input.type === "chat_open") {
    visitor.chatOpens += 1;
    visitor.lastChatAt = timestamp;
  }
  if (input.type === "chat_message") {
    visitor.chatMessages += 1;
    visitor.lastChatAt = timestamp;
  }

  visitor.lastSeenAt = timestamp;
  saveDb(db);
  return visitor;
}

export function getVisitorById(visitorId: string) {
  const db = loadDb();
  return db.visitors.find((item) => item.id === visitorId) ?? null;
}

export function getVisitorsSnapshot() {
  const db = loadDb();
  return db.visitors
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
    )
    .map((visitor) => ({
      ...visitor,
      pageViews: visitor.pageViews
        .slice()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        )
        .slice(0, 20),
      interactions: visitor.interactions
        .slice()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        )
        .slice(0, 30),
    }));
}
