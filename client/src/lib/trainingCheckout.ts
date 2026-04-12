import type { CatalogTrainingPrices } from "@/lib/catalog";

export type TrainingPriceKey = keyof CatalogTrainingPrices;

export type TrainingPricingResponse = {
  enabled: boolean;
  publishableKey: string | null;
  currency: string;
  prices: CatalogTrainingPrices;
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
    throw new Error(data.error || "Training checkout request failed.");
  }
  return data;
}

export function getTrainingPricing() {
  return request<TrainingPricingResponse>("/api/training/pricing", { method: "GET" });
}

export function createTrainingPaymentIntent(payload: {
  level: TrainingPriceKey;
  locale: string;
}) {
  return request<{ ok: true; clientSecret: string; paymentIntentId: string }>("/api/stripe/training-payment-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordTrainingPurchase(payload: {
  level: TrainingPriceKey;
  paymentIntentId: string;
  locale: string;
}) {
  return request<{ ok: true }>("/api/training/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
