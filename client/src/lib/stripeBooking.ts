import type { BookingPriority, BookingServiceType } from "@/lib/bookings";

export type StripeConfigResponse = {
  enabled: boolean;
  publishableKey: string | null;
  currency: string;
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

export function getStripeBookingConfig() {
  return request<StripeConfigResponse>("/api/stripe/config", { method: "GET" });
}

export function createBookingPaymentIntent(payload: {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  slots: Array<{ date: string; hour: number }>;
  locale: string;
}) {
  return request<{ ok: true; clientSecret: string; paymentIntentId: string }>("/api/stripe/booking-payment-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
