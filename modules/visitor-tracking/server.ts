import crypto from "crypto";
import type {
  TrackInteractionPayload,
  TrackVisitPayload,
  VisitorInteraction,
  VisitorRecord,
} from "./contracts";

type MaybePromise<T> = T | Promise<T>;

export type VisitorTrackingStorage = {
  load(): MaybePromise<VisitorRecord[]>;
  save(records: VisitorRecord[]): MaybePromise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

function inferDeviceType(userAgent: string | null): VisitorRecord["deviceType"] {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|facebookexternalhit|whatsapp/.test(ua)) return "bot";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export function createVisitorId() {
  return crypto.randomBytes(18).toString("hex");
}

export function createVisitorTrackingStore(storage: VisitorTrackingStorage) {
  return {
    async getVisitorById(visitorId: string) {
      const records = await storage.load();
      return records.find((item) => item.id === visitorId) ?? null;
    },
    async getSnapshot() {
      const records = await storage.load();
      return records
        .slice()
        .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
    },
    async trackVisit(input: TrackVisitPayload) {
      const records = await storage.load();
      const timestamp = nowIso();
      const params = new URLSearchParams(String(input.search || "").replace(/^\?/, ""));
      let visitor = records.find((item) => item.id === input.visitorId);

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
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
          utmTerm: params.get("utm_term"),
          utmContent: params.get("utm_content"),
          gclid: params.get("gclid"),
          fbclid: params.get("fbclid"),
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
        records.push(visitor);
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

      await storage.save(records.slice(-2000));
      return visitor;
    },
    async trackInteraction(input: TrackInteractionPayload) {
      const records = await storage.load();
      const visitor = records.find((item) => item.id === input.visitorId);
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
      visitor.lastSeenAt = timestamp;

      if (input.type === "session_start") visitor.totalSessions += 1;
      if (input.type === "session_end") {
        visitor.lastSessionDurationMs = interaction.durationMs;
        visitor.lastSessionPageCount = interaction.pageCount;
        if (interaction.durationMs) visitor.totalDurationMs += interaction.durationMs;
      }
      if (input.type === "whatsapp_click") {
        visitor.whatsappClicks += 1;
        visitor.lastWhatsappClickAt = timestamp;
      }
      if (input.type === "email_click") {
        visitor.emailClicks += 1;
        visitor.lastEmailClickAt = timestamp;
      }
      if (input.type === "cta_click") visitor.ctaClicks += 1;
      if (input.type === "chat_open") {
        visitor.chatOpens += 1;
        visitor.lastChatAt = timestamp;
      }
      if (input.type === "chat_message") {
        visitor.chatMessages += 1;
        visitor.lastChatAt = timestamp;
      }

      await storage.save(records);
      return visitor;
    },
  };
}
