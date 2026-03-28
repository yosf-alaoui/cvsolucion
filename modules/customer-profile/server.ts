import type { CustomerProfile } from "./contracts";

type MaybePromise<T> = T | Promise<T>;

export type CustomerProfileStorage = {
  load(): MaybePromise<CustomerProfile[]>;
  save(profiles: CustomerProfile[]): MaybePromise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

export function createCustomerProfileStore(storage: CustomerProfileStorage) {
  return {
    async getProfile(userId: string) {
      const profiles = await storage.load();
      return profiles.find((profile) => profile.userId === userId) ?? null;
    },
    async upsertProfile(input: {
      userId: string;
      email: string;
      name?: string | null;
      country?: string | null;
      phone?: string | null;
      company?: string | null;
    }) {
      const profiles = await storage.load();
      const timestamp = nowIso();
      const existing = profiles.find((profile) => profile.userId === input.userId);

      if (existing) {
        existing.email = input.email.trim().toLowerCase();
        existing.name = input.name?.trim() || existing.name || null;
        existing.country = input.country?.trim() || existing.country || null;
        existing.phone = input.phone?.trim() || existing.phone || null;
        existing.company = input.company?.trim() || existing.company || null;
        existing.updatedAt = timestamp;
        await storage.save(profiles);
        return existing;
      }

      const profile: CustomerProfile = {
        userId: input.userId,
        email: input.email.trim().toLowerCase(),
        name: input.name?.trim() || null,
        country: input.country?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await storage.save([...profiles, profile]);
      return profile;
    },
  };
}
