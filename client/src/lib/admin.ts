export type AdminDashboardStats = {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeSessions: number;
  pendingTokens: number;
  totalEvents: number;
  usersLast7Days: number;
  usersLast30Days: number;
  loginsLast7Days: number;
  resetRequestsLast30Days: number;
  verificationRate: number;
};

export type AdminDashboardUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
  pendingTokens: number;
  eventCount: number;
  lastSeenAt: string | null;
  lastEventType: string | null;
  signupLocale: string | null;
};

export type AdminDashboardSession = {
  id: string;
  userId: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
};

export type AdminDashboardEvent = {
  id: string;
  type: string;
  userId: string | null;
  email: string | null;
  locale: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminDashboardInsights = {
  localeBreakdown: Array<{ locale: string; count: number }>;
  eventBreakdown: Array<{ type: string; count: number }>;
  tokenBreakdown: Array<{ type: string; count: number }>;
  stalePendingUsers: AdminDashboardUser[];
};

export type AdminDashboardVisitorPageView = {
  path: string;
  locale: string;
  title: string | null;
  referrer: string | null;
  occurredAt: string;
  sessionId: string | null;
};

export type AdminDashboardVisitorInteraction = {
  type:
    | "session_start"
    | "session_end"
    | "whatsapp_click"
    | "email_click"
    | "cta_click"
    | "chat_open"
    | "chat_message";
  path: string;
  label: string | null;
  href: string | null;
  sessionId: string | null;
  durationMs: number | null;
  pageCount: number | null;
  occurredAt: string;
};

export type AdminDashboardVisitor = {
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
  pageViews: AdminDashboardVisitorPageView[];
  interactions: AdminDashboardVisitorInteraction[];
};

export type AdminDashboardConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AdminDashboardConversation = {
  id: string;
  visitorId: string;
  userId: string | null;
  email: string | null;
  locale: "en" | "fr" | "ar";
  status: "open" | "waiting_client" | "needs_human";
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastPath: string | null;
  latestResponseId: string | null;
  messageCount: number;
  leadScore: number;
  supportFormRequired: boolean;
  supportIntake: {
    name: string;
    country: string;
    phone: string;
    email: string;
    submittedAt: string;
  } | null;
  messages: AdminDashboardConversationMessage[];
  visitor: {
    id: string;
    email: string | null;
    isRegistered: boolean;
    ip: string | null;
    deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
    locale: string;
    landingPath: string;
    lastPath: string;
    browserLanguage: string | null;
    timezone: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    gclid: string | null;
    fbclid: string | null;
    totalSessions: number;
    totalPageViews: number;
    whatsappClicks: number;
    emailClicks: number;
    ctaClicks: number;
    lastSeenAt: string;
  } | null;
};

export type AdminDashboardGa4 = {
  enabled: boolean;
  propertyId: string | null;
  fetchedAt: string | null;
  error: string | null;
  overview: {
    activeUsers1d: number;
    activeUsers7d: number;
    sessions7d: number;
    pageViews7d: number;
    avgSessionDuration7d: number;
  };
  events7d: {
    pageViews: number;
    whatsappClicks: number;
    emailClicks: number;
    ctaClicks: number;
  };
  topPages: Array<{ pagePath: string; views: number }>;
  trafficSources: Array<{ sourceMedium: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
  devices: Array<{ deviceCategory: string; users: number }>;
};

export type AdminDashboardResponse = {
  admin: { email: string };
  stats: AdminDashboardStats;
  users: AdminDashboardUser[];
  sessions: AdminDashboardSession[];
  events: AdminDashboardEvent[];
  insights: AdminDashboardInsights;
  visitors: AdminDashboardVisitor[];
  conversations: AdminDashboardConversation[];
  ga4: AdminDashboardGa4;
  chat: {
    enabled: boolean;
  };
};

async function adminRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Admin request failed.");
  }
  return data;
}

export async function getAdminDashboard() {
  return adminRequest<AdminDashboardResponse>("/api/admin/dashboard", { method: "GET" });
}

export function updateAdminUser(
  userId: string,
  payload: { email: string; password?: string; emailVerified: boolean }
) {
  return adminRequest<{ ok: true }>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(userId: string) {
  return adminRequest<{ ok: true }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export function resendAdminVerification(userId: string, locale: string) {
  return adminRequest<{ ok: true }>(`/api/admin/users/${userId}/send-verification`, {
    method: "POST",
    body: JSON.stringify({ locale }),
  });
}

export function revokeAdminSession(sessionId: string) {
  return adminRequest<{ ok: true }>(`/api/admin/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function revokeAdminUserSessions(userId: string) {
  return adminRequest<{ ok: true; revoked: number }>(`/api/admin/users/${userId}/sessions`, {
    method: "DELETE",
  });
}
