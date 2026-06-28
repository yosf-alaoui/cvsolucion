import crypto from "crypto";
import path from "path";
import { getAppDataDir } from "./dataDir";
import {
  isSqliteStorageEnabled,
  withDocumentDatabase,
} from "./documentDatabase";
import { isAutomatedUserAgent } from "./botGuard";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type VisitorPageView = {
  path: string;
  locale: string;
  title: string | null;
  referrer: string | null;
  navigationType: string | null;
  secFetchSite: string | null;
  occurredAt: string;
  sessionId: string | null;
};

export type VisitorTrafficSource = {
  category: string;
  source: string;
  medium: string;
  confidence: "high" | "medium" | "low";
  detail: string;
  referrerHost: string | null;
  clickIdType: string | null;
  clickId: string | null;
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
  msclkid: string | null;
  ttclid: string | null;
  liFatId: string | null;
  wbraid: string | null;
  gbraid: string | null;
  navigationType: string | null;
  secFetchSite: string | null;
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
            navigation_type AS navigationType,
            sec_fetch_site AS secFetchSite,
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
        navigationType: textOrNull(row.navigationType),
        secFetchSite: textOrNull(row.secFetchSite),
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
              msclkid,
              ttclid,
              li_fat_id AS liFatId,
              wbraid,
              gbraid,
              navigation_type AS navigationType,
              sec_fetch_site AS secFetchSite,
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
        msclkid: textOrNull(visitor.msclkid),
        ttclid: textOrNull(visitor.ttclid),
        liFatId: textOrNull(visitor.liFatId),
        wbraid: textOrNull(visitor.wbraid),
        gbraid: textOrNull(visitor.gbraid),
        navigationType: textOrNull(visitor.navigationType),
        secFetchSite: textOrNull(visitor.secFetchSite),
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
  if (isAutomatedUserAgent(ua)) return "bot";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

function queryFromPath(pathValue: string) {
  const questionIndex = pathValue.indexOf("?");
  if (questionIndex === -1) return "";
  const hashIndex = pathValue.indexOf("#", questionIndex);
  return pathValue.slice(
    questionIndex + 1,
    hashIndex === -1 ? undefined : hashIndex,
  );
}

function getTrackingParams(
  search: string | null | undefined,
  pathValue: string,
) {
  const rawSearch =
    String(search || "").replace(/^\?/, "") || queryFromPath(pathValue);
  return new URLSearchParams(rawSearch);
}

function getHost(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isInternalHost(host: string | null) {
  return Boolean(
    host && (host === "cvsolucion.com" || host.endsWith(".cvsolucion.com")),
  );
}

function isSearchHost(host: string) {
  return (
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "bing.com" ||
    host.endsWith(".bing.com") ||
    host === "duckduckgo.com" ||
    host === "yahoo.com" ||
    host.endsWith(".yahoo.com") ||
    host === "ecosia.org" ||
    host === "baidu.com" ||
    host.endsWith(".baidu.com") ||
    host === "yandex.com" ||
    host.endsWith(".yandex.com")
  );
}

function socialSourceFromHost(host: string) {
  if (/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)messenger\.com$/.test(host))
    return "Facebook";
  if (/(^|\.)instagram\.com$/.test(host)) return "Instagram";
  if (/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/.test(host)) return "LinkedIn";
  if (host === "t.co" || /(^|\.)twitter\.com$|(^|\.)x\.com$/.test(host))
    return "X / Twitter";
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host)) return "YouTube";
  if (/(^|\.)pinterest\.com$/.test(host)) return "Pinterest";
  if (/(^|\.)reddit\.com$/.test(host)) return "Reddit";
  if (/(^|\.)whatsapp\.com$|(^|\.)wa\.me$/.test(host)) return "WhatsApp";
  if (/(^|\.)tiktok\.com$/.test(host)) return "TikTok";
  return null;
}

function inferTrafficSource(input: {
  path?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  ttclid?: string | null;
  liFatId?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  navigationType?: string | null;
  secFetchSite?: string | null;
}): VisitorTrafficSource {
  const pathValue = input.path || "";
  const params = getTrackingParams(null, pathValue);
  const utmSource = input.utmSource || params.get("utm_source");
  const utmMedium = input.utmMedium || params.get("utm_medium");
  const utmCampaign = input.utmCampaign || params.get("utm_campaign");
  const gclid = input.gclid || params.get("gclid");
  const fbclid = input.fbclid || params.get("fbclid");
  const msclkid = input.msclkid || params.get("msclkid");
  const ttclid = input.ttclid || params.get("ttclid");
  const liFatId = input.liFatId || params.get("li_fat_id");
  const wbraid = input.wbraid || params.get("wbraid");
  const gbraid = input.gbraid || params.get("gbraid");
  const referrerHost = getHost(input.referrer);
  const userAgent = (input.userAgent || "").toLowerCase();
  const navigationType = input.navigationType || null;
  const secFetchSite = input.secFetchSite || null;

  if (isAutomatedUserAgent(userAgent)) {
    return {
      category: "Bot / crawler",
      source: referrerHost || "Bot",
      medium: "bot",
      confidence: "medium",
      detail:
        "User agent looks like a crawler, preview bot, or link unfurl bot.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (utmSource || utmMedium || utmCampaign) {
    return {
      category: "Campaign",
      source: utmSource || "utm campaign",
      medium: utmMedium || "unknown",
      confidence: "high",
      detail: utmCampaign
        ? `UTM campaign: ${utmCampaign}`
        : "Source came from UTM parameters.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  const clickSources: Array<[string, string | null, string, string, string]> = [
    [
      "gclid",
      gclid,
      "Google Ads",
      "paid search",
      "Google Ads click id was present.",
    ],
    [
      "wbraid",
      wbraid,
      "Google Ads",
      "paid search",
      "Google Ads web-to-app click id was present.",
    ],
    [
      "gbraid",
      gbraid,
      "Google Ads",
      "paid search",
      "Google Ads app-to-web click id was present.",
    ],
    [
      "fbclid",
      fbclid,
      "Facebook / Instagram",
      "paid social",
      "Meta click id was present.",
    ],
    [
      "msclkid",
      msclkid,
      "Microsoft Ads",
      "paid search",
      "Microsoft Ads click id was present.",
    ],
    ["ttclid", ttclid, "TikTok", "paid social", "TikTok click id was present."],
    [
      "li_fat_id",
      liFatId,
      "LinkedIn",
      "paid social",
      "LinkedIn click id was present.",
    ],
  ];
  const clickSource = clickSources.find(([, value]) => Boolean(value));
  if (clickSource) {
    const [clickIdType, clickId, source, medium, detail] = clickSource;
    return {
      category: medium.includes("social") ? "Paid social" : "Paid search",
      source,
      medium,
      confidence: "high",
      detail,
      referrerHost,
      clickIdType,
      clickId,
    };
  }

  if (/whatsapp/.test(userAgent)) {
    return {
      category: "Social",
      source: "WhatsApp",
      medium: "social",
      confidence: "medium",
      detail:
        "No referrer was sent, but the user agent looks like a WhatsApp in-app browser.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (/instagram/.test(userAgent)) {
    return {
      category: "Social",
      source: "Instagram",
      medium: "social",
      confidence: "medium",
      detail:
        "No referrer was sent, but the user agent looks like an Instagram in-app browser.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (/fban|fbav|fbios|facebook/.test(userAgent)) {
    return {
      category: "Social",
      source: "Facebook",
      medium: "social",
      confidence: "medium",
      detail:
        "No referrer was sent, but the user agent looks like a Facebook in-app browser.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (referrerHost && isInternalHost(referrerHost)) {
    return {
      category: "Internal",
      source: referrerHost,
      medium: "internal",
      confidence: "high",
      detail: "The referrer is another page on cvsolucion.com.",
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (referrerHost) {
    const socialSource = socialSourceFromHost(referrerHost);
    if (socialSource) {
      return {
        category: "Social",
        source: socialSource,
        medium: "social",
        confidence: "high",
        detail: `External social referrer: ${referrerHost}`,
        referrerHost,
        clickIdType: null,
        clickId: null,
      };
    }

    if (isSearchHost(referrerHost)) {
      return {
        category: "Organic search",
        source: referrerHost,
        medium: "organic",
        confidence: "high",
        detail: `Search referrer: ${referrerHost}`,
        referrerHost,
        clickIdType: null,
        clickId: null,
      };
    }

    return {
      category: "Referral",
      source: referrerHost,
      medium: "referral",
      confidence: "high",
      detail: `External referrer: ${referrerHost}`,
      referrerHost,
      clickIdType: null,
      clickId: null,
    };
  }

  if (pathValue.includes("gtm_debug=")) {
    return {
      category: "Testing",
      source: "Google Tag Assistant",
      medium: "debug",
      confidence: "high",
      detail:
        "The landing URL contains gtm_debug, so this is a GTM preview visit.",
      referrerHost: null,
      clickIdType: null,
      clickId: null,
    };
  }

  if (secFetchSite === "cross-site") {
    return {
      category: "Hidden referrer",
      source: "Cross-site without referrer",
      medium: "unknown",
      confidence: "medium",
      detail:
        "Browser indicated a cross-site navigation, but no referrer was sent. This often comes from privacy settings, apps, or referrer policy.",
      referrerHost: null,
      clickIdType: null,
      clickId: null,
    };
  }

  if (navigationType === "reload" || navigationType === "back_forward") {
    return {
      category: "Direct / browser navigation",
      source: navigationType === "reload" ? "Reload" : "Back/forward",
      medium: "direct",
      confidence: "medium",
      detail: `No referrer was sent and browser navigation type was ${navigationType}.`,
      referrerHost: null,
      clickIdType: null,
      clickId: null,
    };
  }

  return {
    category: "Direct / unknown",
    source: "Direct or hidden",
    medium: "direct",
    confidence: "low",
    detail:
      "No referrer, UTM, or ad click id was sent. The source cannot be recovered; common causes are typed URL, bookmark, app/webview, email app, or privacy/referrer policy.",
    referrerHost: null,
    clickIdType: null,
    clickId: null,
  };
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
  msclkid?: string | null;
  ttclid?: string | null;
  liFatId?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  navigationType?: string | null;
  secFetchSite?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const params = getTrackingParams(input.search, input.path);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmTerm = params.get("utm_term");
  const utmContent = params.get("utm_content");
  const gclid = params.get("gclid");
  const fbclid = params.get("fbclid");
  const msclkid = input.msclkid || params.get("msclkid");
  const ttclid = input.ttclid || params.get("ttclid");
  const liFatId = input.liFatId || params.get("li_fat_id");
  const wbraid = input.wbraid || params.get("wbraid");
  const gbraid = input.gbraid || params.get("gbraid");
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
      msclkid,
      ttclid,
      liFatId,
      wbraid,
      gbraid,
      navigationType: input.navigationType || null,
      secFetchSite: input.secFetchSite || null,
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
  visitor.msclkid = visitor.msclkid || msclkid;
  visitor.ttclid = visitor.ttclid || ttclid;
  visitor.liFatId = visitor.liFatId || liFatId;
  visitor.wbraid = visitor.wbraid || wbraid;
  visitor.gbraid = visitor.gbraid || gbraid;
  visitor.navigationType =
    input.navigationType || visitor.navigationType || null;
  visitor.secFetchSite = input.secFetchSite || visitor.secFetchSite || null;
  visitor.chatOpens = visitor.chatOpens ?? 0;
  visitor.chatMessages = visitor.chatMessages ?? 0;
  visitor.lastChatAt = visitor.lastChatAt ?? null;
  visitor.totalPageViews += 1;
  visitor.pageViews.push({
    path: input.path,
    locale: input.locale || visitor.locale,
    title: input.title || null,
    referrer: input.referrer || null,
    navigationType: input.navigationType || null,
    secFetchSite: input.secFetchSite || null,
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
    .filter(
      (visitor) =>
        visitor.deviceType !== "bot" &&
        !isAutomatedUserAgent(visitor.userAgent),
    )
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
    )
    .map((visitor) => ({
      ...visitor,
      msclkid: visitor.msclkid || null,
      ttclid: visitor.ttclid || null,
      liFatId: visitor.liFatId || null,
      wbraid: visitor.wbraid || null,
      gbraid: visitor.gbraid || null,
      navigationType: visitor.navigationType || null,
      secFetchSite: visitor.secFetchSite || null,
      trafficSource: inferTrafficSource(visitor),
      pageViews: visitor.pageViews
        .slice()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        )
        .slice(0, 20)
        .map((pageView) => ({
          ...pageView,
          navigationType: pageView.navigationType || null,
          secFetchSite: pageView.secFetchSite || null,
          trafficSource: inferTrafficSource({
            ...visitor,
            path: pageView.path,
            referrer: pageView.referrer,
            navigationType: pageView.navigationType || visitor.navigationType,
            secFetchSite: pageView.secFetchSite || visitor.secFetchSite,
          }),
        })),
      interactions: visitor.interactions
        .slice()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        )
        .slice(0, 30),
    }));
}
