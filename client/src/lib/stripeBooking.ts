import type { BookingPriority, BookingServiceType } from "@/lib/bookings";

export type StripeConfigResponse = {
  enabled: boolean;
  publishableKey: string | null;
  currency: string;
  cardPaymentFeeCents: number;
  appliedCountryCode?: string | null;
  prices: Record<string, number>;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
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
    throw new Error(data.error || "Stripe request failed.");
  }
  return data;
}

export function getStripeBookingConfig(countryCode?: string | null) {
  const params = new URLSearchParams();
  if (countryCode) params.set("countryCode", countryCode);
  const query = params.toString();
  return request<StripeConfigResponse>(`/api/stripe/config${query ? `?${query}` : ""}`, { method: "GET" });
}

export function createBookingPaymentIntent(payload: {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  countryCode?: string | null;
  slots: Array<{ date: string; hour: number }>;
  locale: string;
}) {
  return request<{ ok: true; clientSecret: string; paymentIntentId: string }>("/api/stripe/booking-payment-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
