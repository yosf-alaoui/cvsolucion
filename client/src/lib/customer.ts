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
  bookingId: string | null;
  invoiceNumber: string | null;
  status: "requested" | "issued";
  requestedAt: string;
  issuedAt: string | null;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  serviceType: BookingRecord["serviceType"] | null;
  priority: BookingRecord["priority"] | null;
  date: string | null;
  hour: number | null;
  customerName: string;
  company: string | null;
  serviceDescription: string;
  downloadUrl: string | null;
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

export function requestCustomerInvoice(payload: {
  bookingId?: string | null;
  customerType: "individual" | "company";
  customerName: string;
  phone?: string | null;
  country: string;
  countryCode?: string | null;
  company?: string | null;
  billingAddress: string;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  serviceDescription?: string | null;
  notes?: string | null;
}) {
  return request<{ ok: true; invoice: CustomerInvoice }>("/api/customer/invoices/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
