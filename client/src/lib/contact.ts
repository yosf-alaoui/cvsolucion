import { withCsrfHeaders } from "@/lib/csrf";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  country?: string;
  countryCode?: string;
  interest?: string;
  message: string;
  locale?: string;
  source?: "career_evaluation";
  tracking?: Partial<
    Record<
      | "utm_source"
      | "utm_medium"
      | "utm_campaign"
      | "utm_content"
      | "utm_term"
      | "fbclid"
      | "landing_page",
      string
    >
  >;
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

export function submitContactLead(payload: ContactPayload) {
  const fingerprint = JSON.stringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < fingerprint.length; index += 1) {
    hash ^= fingerprint.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const storageKey = `cvsolucion:contact-idempotency:${(hash >>> 0).toString(16)}`;
  let idempotencyKey = "";
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null") as {
      key?: string;
      createdAt?: number;
    } | null;
    if (
      stored?.key &&
      Number.isFinite(stored.createdAt) &&
      Date.now() - Number(stored.createdAt) < 30 * 60_000
    ) {
      idempotencyKey = stored.key;
    } else {
      idempotencyKey = crypto.randomUUID();
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ key: idempotencyKey, createdAt: Date.now() }),
      );
    }
  } catch {
    idempotencyKey = crypto.randomUUID();
  }

  return request<{
    ok: true;
    leadId?: string;
    pendingEmailVerification?: boolean;
    email?: string;
  }>("/api/contact", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}
