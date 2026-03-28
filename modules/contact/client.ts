import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type { ContactLead, SubmitContactLeadPayload } from "./contracts";

export function createContactModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    submitLead(payload: SubmitContactLeadPayload) {
      return request<{ ok: true; leadId: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    listLeads() {
      return request<{ leads: ContactLead[] }>("/api/admin/contact-leads", { method: "GET" });
    },
  };
}
