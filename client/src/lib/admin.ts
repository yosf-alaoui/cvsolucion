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

export type AdminDashboardResponse = {
  admin: { email: string };
  stats: AdminDashboardStats;
  users: AdminDashboardUser[];
  sessions: AdminDashboardSession[];
  events: AdminDashboardEvent[];
  insights: AdminDashboardInsights;
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
