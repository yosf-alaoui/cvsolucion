export type AdminDashboardStats = {
  totalUsers: number;
  verifiedUsers: number;
  activeSessions: number;
  pendingTokens: number;
  totalEvents: number;
};

export type AdminDashboardUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardSession = {
  id: string;
  userId: string;
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

export type AdminDashboardResponse = {
  admin: { email: string };
  stats: AdminDashboardStats;
  users: AdminDashboardUser[];
  sessions: AdminDashboardSession[];
  events: AdminDashboardEvent[];
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
