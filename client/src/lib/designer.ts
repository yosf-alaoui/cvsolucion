import type { AuthUser } from "@/lib/auth";
import type { BookingRecord } from "@/lib/bookings";
import type { AdminDesignerTask, AdminDesignerProfile, AdminDesignerTaskStatus } from "@/lib/admin";
import { withCsrfHeaders } from "@/lib/csrf";

export type DesignerDashboardResponse = {
  user: AuthUser;
  profile: AdminDesignerProfile;
  bookings: BookingRecord[];
  tasks: AdminDesignerTask[];
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: withCsrfHeaders(init, {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Designer request failed.");
  }
  return data;
}

export function getDesignerDashboard() {
  return request<DesignerDashboardResponse>("/api/designer/dashboard", { method: "GET" });
}

export function updateDesignerTaskStatus(taskId: string, status: AdminDesignerTaskStatus) {
  return request<{ ok: true; task: AdminDesignerTask }>(`/api/designer/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
