import { withCsrfHeaders } from "@/lib/csrf";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
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
  return request<{ ok: true; leadId: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
