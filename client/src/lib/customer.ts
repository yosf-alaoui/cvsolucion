import type { BookingRecord } from "@/lib/bookings";
import { withCsrfHeaders } from "@/lib/csrf";

export type CustomerProfile = {
  userId: string;
  email: string;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDashboardResponse = {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  profile: CustomerProfile;
  bookings: BookingRecord[];
  invoices: CustomerInvoice[];
};

export type CustomerInvoice = {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  status: "issued";
  issuedAt: string;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  serviceType: BookingRecord["serviceType"];
  priority: BookingRecord["priority"];
  date: string;
  hour: number;
  downloadUrl: string;
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
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export function getCustomerDashboard() {
  return request<CustomerDashboardResponse>("/api/customer/dashboard", { method: "GET" });
}

export function updateCustomerProfile(payload: {
  name: string;
  country: string;
  countryCode?: string | null;
  phone: string;
  company: string;
}) {
  return request<{ ok: true; profile: CustomerProfile }>("/api/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
