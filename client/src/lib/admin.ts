import type {
  BookingPriority,
  BookingRecord,
  BookingStatus,
  BookingPaymentStatus,
} from "@/lib/bookings";
import { withCsrfHeaders } from "@/lib/csrf";

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
  role: "customer" | "designer" | "trainer" | "admin";
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
  navigationType: string | null;
  secFetchSite: string | null;
  trafficSource: AdminDashboardVisitorTrafficSource;
  occurredAt: string;
  sessionId: string | null;
};

export type AdminDashboardVisitorTrafficSource = {
  category: string;
  source: string;
  medium: string;
  confidence: "high" | "medium" | "low";
  detail: string;
  referrerHost: string | null;
  clickIdType: string | null;
  clickId: string | null;
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
  msclkid: string | null;
  ttclid: string | null;
  liFatId: string | null;
  wbraid: string | null;
  gbraid: string | null;
  navigationType: string | null;
  secFetchSite: string | null;
  trafficSource: AdminDashboardVisitorTrafficSource;
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

export type AdminContactLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  interest: string | null;
  message: string;
  createdAt: string;
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
  bookings: BookingRecord[];
  bookingSchedule: {
    standardOpen: boolean;
    expressOpen: boolean;
    updatedAt: string;
  };
  leads: AdminContactLead[];
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

export type AdminCatalogPackageTranslation = {
  title: string;
  subtitle: string;
  duration: string;
  priceLabel: string;
  bullets: string[];
};

export type AdminCatalogPackage = {
  id: string;
  active: boolean;
  highlight: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  translations: {
    en: AdminCatalogPackageTranslation;
    fr: AdminCatalogPackageTranslation;
    ar: AdminCatalogPackageTranslation;
  };
};

export type AdminCatalogResponse = {
  bookingPrices: {
    standardConsultation: number;
    standardSupport: number;
    expressConsultation: number;
    expressSupport: number;
  };
  servicePackages: AdminCatalogPackage[];
};

export type AdminBookingSlotView = {
  id: string;
  date: string;
  hour: number;
  utcStart: string;
  priority: BookingPriority;
  status: "booked" | "available";
  source: "real" | "blocked" | "available";
  booking: {
    id: string;
    name: string;
    email: string;
    status: BookingStatus;
    paymentStatus: BookingPaymentStatus;
  } | null;
  block: {
    id: string;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type AdminBookingSlotsResponse = {
  ok: true;
  date: string;
  priority: BookingPriority;
  slots: AdminBookingSlotView[];
};

export type AdminDesignerTaskStatus = "todo" | "in_progress" | "done";
export type AdminDesignerTaskPriority = "low" | "normal" | "high";

export type AdminDesignerProfile = {
  userId: string;
  email: string;
  displayName: string | null;
  title: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDesignerSummary = {
  user: AdminDashboardUser & {
    displayName: string;
  };
  profile: AdminDesignerProfile;
  stats: {
    assignedBookings: number;
    upcomingBookings: number;
    openTasks: number;
    completedTasks: number;
  };
};

export type AdminDesignerTask = {
  id: string;
  designerUserId: string;
  title: string;
  description: string | null;
  status: AdminDesignerTaskStatus;
  priority: AdminDesignerTaskPriority;
  dueAt: string | null;
  bookingId: string | null;
  createdByUserId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: BookingRecord | null;
  designer: {
    userId: string;
    email: string;
    displayName: string;
  } | null;
};

export type AdminDesignersResponse = {
  designers: AdminDesignerSummary[];
  candidateUsers: Array<{
    id: string;
    email: string;
    role: "customer" | "designer" | "trainer" | "admin";
    emailVerifiedAt: string | null;
  }>;
  bookings: BookingRecord[];
  tasks: AdminDesignerTask[];
};

async function adminRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: withCsrfHeaders(init, {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) {
    throw new Error(data.error || "Admin request failed.");
  }
  return data;
}

export async function getAdminDashboard() {
  return adminRequest<AdminDashboardResponse>("/api/admin/dashboard", {
    method: "GET",
  });
}

export async function getAdminCatalog() {
  return adminRequest<AdminCatalogResponse>("/api/admin/catalog", {
    method: "GET",
  });
}

export function updateAdminCatalogPricing(
  payload: AdminCatalogResponse["bookingPrices"],
) {
  return adminRequest<{
    ok: true;
    bookingPrices: AdminCatalogResponse["bookingPrices"];
  }>("/api/admin/catalog/pricing", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createAdminCatalogPackage(payload: {
  active?: boolean;
  highlight?: boolean;
  order?: number;
  translations: AdminCatalogPackage["translations"];
}) {
  return adminRequest<{ ok: true; package: AdminCatalogPackage }>(
    "/api/admin/catalog/packages",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAdminCatalogPackage(
  packageId: string,
  payload: {
    active?: boolean;
    highlight?: boolean;
    order?: number;
    translations?: Partial<AdminCatalogPackage["translations"]>;
  },
) {
  return adminRequest<{ ok: true; package: AdminCatalogPackage }>(
    `/api/admin/catalog/packages/${packageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminCatalogPackage(packageId: string) {
  return adminRequest<{ ok: true }>(
    `/api/admin/catalog/packages/${packageId}`,
    {
      method: "DELETE",
    },
  );
}

export function updateAdminUser(
  userId: string,
  payload: {
    email: string;
    password?: string;
    emailVerified: boolean;
    role?: "customer" | "designer" | "trainer" | "admin";
    displayName?: string;
    title?: string;
    notes?: string;
    active?: boolean;
  },
) {
  return adminRequest<{ ok: true }>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminDesigners() {
  return adminRequest<AdminDesignersResponse>("/api/admin/designers", {
    method: "GET",
  });
}

export function assignAdminBookingDesigner(
  bookingId: string,
  designerUserId: string | null,
) {
  return adminRequest<{ ok: true; booking: BookingRecord }>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/assign-designer`,
    {
      method: "POST",
      body: JSON.stringify({ designerUserId }),
    },
  );
}

export function createAdminDesignerTask(payload: {
  designerUserId: string;
  title: string;
  description?: string | null;
  status?: AdminDesignerTaskStatus;
  priority?: AdminDesignerTaskPriority;
  dueAt?: string | null;
  bookingId?: string | null;
}) {
  return adminRequest<{ ok: true; task: AdminDesignerTask }>(
    "/api/admin/designer-tasks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAdminDesignerTask(
  taskId: string,
  payload: {
    designerUserId?: string;
    title?: string;
    description?: string | null;
    status?: AdminDesignerTaskStatus;
    priority?: AdminDesignerTaskPriority;
    dueAt?: string | null;
    bookingId?: string | null;
  },
) {
  return adminRequest<{ ok: true; task: AdminDesignerTask }>(
    `/api/admin/designer-tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminDesignerTask(taskId: string) {
  return adminRequest<{ ok: true }>(
    `/api/admin/designer-tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
    },
  );
}

export function deleteAdminUser(userId: string) {
  return adminRequest<{ ok: true }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export function resendAdminVerification(userId: string, locale: string) {
  return adminRequest<{ ok: true }>(
    `/api/admin/users/${userId}/send-verification`,
    {
      method: "POST",
      body: JSON.stringify({ locale }),
    },
  );
}

export function revokeAdminSession(sessionId: string) {
  return adminRequest<{ ok: true }>(`/api/admin/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function revokeAdminUserSessions(userId: string) {
  return adminRequest<{ ok: true; revoked: number }>(
    `/api/admin/users/${userId}/sessions`,
    {
      method: "DELETE",
    },
  );
}

export function cancelAdminBooking(bookingId: string) {
  return adminRequest<{ ok: true; booking: BookingRecord }>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "POST",
    },
  );
}

export function refundAdminBooking(bookingId: string) {
  return adminRequest<{
    ok: true;
    booking: BookingRecord;
    refund: {
      id: string;
      status: string | null;
      amount: number;
      currency: string | null;
    };
  }>(`/api/admin/bookings/${encodeURIComponent(bookingId)}/refund`, {
    method: "POST",
  });
}

export function updateAdminBookingSchedule(payload: {
  standardOpen?: boolean;
  expressOpen?: boolean;
}) {
  return adminRequest<{
    ok: true;
    schedule: {
      standardOpen: boolean;
      expressOpen: boolean;
      updatedAt: string;
    };
  }>("/api/admin/bookings/schedule", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminBookingSlots(payload: {
  date: string;
  priority: BookingPriority;
}) {
  const params = new URLSearchParams({
    date: payload.date,
    priority: payload.priority,
  });

  return adminRequest<AdminBookingSlotsResponse>(
    `/api/admin/bookings/slots?${params.toString()}`,
    {
      method: "GET",
    },
  );
}

export function blockAdminBookingSlot(payload: {
  date: string;
  hour: number;
  priority: BookingPriority;
  reason?: string | null;
}) {
  return adminRequest<AdminBookingSlotsResponse & { slot: { id: string } }>(
    "/api/admin/bookings/slots/block",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function unblockAdminBookingSlot(payload: {
  date: string;
  hour: number;
  priority: BookingPriority;
}) {
  return adminRequest<AdminBookingSlotsResponse & { slot: { id: string } }>(
    "/api/admin/bookings/slots/unblock",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
