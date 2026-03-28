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

export type TrackVisitPayload = {
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
};

export type TrackInteractionPayload = {
  visitorId: string;
  type: VisitorInteractionType;
  path: string;
  label?: string | null;
  href?: string | null;
  sessionId?: string | null;
  durationMs?: number | null;
  pageCount?: number | null;
};
