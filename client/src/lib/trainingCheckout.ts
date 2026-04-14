import type { CatalogTrainingPrices, CatalogTrainingProgramRecord } from "@/lib/catalog";

export type TrainingPriceKey = string;

export type PublicTrainingProgram = Omit<CatalogTrainingProgramRecord, "priceCents" | "createdAt" | "updatedAt">;

export type TrainingPricingResponse = {
  enabled: boolean;
  publishableKey: string | null;
  currency: string;
  cardPaymentFeeCents: number;
  appliedCountryCode?: string | null;
  prices: CatalogTrainingPrices;
  programs: Array<PublicTrainingProgram & { priceCents: number }>;
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

export function getTrainingPrograms() {
  return request<{ programs: PublicTrainingProgram[] }>("/api/training/programs", { method: "GET" });
}

export function createTrainingPaymentIntent(payload: {
  programId: TrainingPriceKey;
  locale: string;
}) {
  return request<{ ok: true; clientSecret: string; paymentIntentId: string }>("/api/stripe/training-payment-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordTrainingPurchase(payload: {
  programId: TrainingPriceKey;
  paymentIntentId: string;
  locale: string;
}) {
  return request<{ ok: true }>("/api/training/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
