import crypto from "crypto";
import type { ContactLead, SubmitContactLeadPayload } from "./contracts";

type MaybePromise<T> = T | Promise<T>;

export type ContactLeadStorage = {
  load(): MaybePromise<ContactLead[]>;
  save(leads: ContactLead[]): MaybePromise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeLeadPayload(payload: SubmitContactLeadPayload) {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    company: payload.company?.trim() || null,
    phone: payload.phone?.trim() || null,
    interest: payload.interest?.trim() || null,
    message: payload.message.trim(),
  };
}

export function createContactLeadStore(storage: ContactLeadStorage) {
  return {
    async listLeads() {
      return await storage.load();
    },
    async createLead(payload: SubmitContactLeadPayload) {
      const normalized = normalizeLeadPayload(payload);
      const leads = await storage.load();
      const lead: ContactLead = {
        id: crypto.randomBytes(12).toString("hex"),
        createdAt: nowIso(),
        ...normalized,
      };

      const nextLeads = [lead, ...leads];
      await storage.save(nextLeads);
      return lead;
    },
  };
}
