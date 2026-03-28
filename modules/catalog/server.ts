import crypto from "crypto";
import type {
  CatalogBookingPrices,
  CatalogLocale,
  CatalogPackageRecord,
  CatalogPackageTranslation,
  CatalogSnapshot,
  PublicCatalogPackage,
  PublicCatalogResponse,
} from "./contracts";

type MaybePromise<T> = T | Promise<T>;

export type CatalogModuleStorage = {
  load(): MaybePromise<Partial<CatalogSnapshot> | null | undefined>;
  save(snapshot: CatalogSnapshot): MaybePromise<void>;
};

type CreateCatalogModuleOptions = {
  storage: CatalogModuleStorage;
  defaults?: CatalogSnapshot;
};

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 10) {
  return crypto.randomBytes(size).toString("hex");
}

function normalizeTranslation(input?: Partial<CatalogPackageTranslation>): CatalogPackageTranslation {
  return {
    title: String(input?.title || "").trim(),
    subtitle: String(input?.subtitle || "").trim(),
    duration: String(input?.duration || "").trim(),
    priceLabel: String(input?.priceLabel || "").trim(),
    bullets: Array.isArray(input?.bullets)
      ? input.bullets.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
  };
}

function normalizeSnapshot(raw: Partial<CatalogSnapshot> | null | undefined, defaults?: CatalogSnapshot): CatalogSnapshot {
  const bookingPrices = {
    standardConsultation:
      raw?.bookingPrices?.standardConsultation ??
      defaults?.bookingPrices.standardConsultation ??
      14000,
    standardSupport:
      raw?.bookingPrices?.standardSupport ?? defaults?.bookingPrices.standardSupport ?? 14000,
    expressConsultation:
      raw?.bookingPrices?.expressConsultation ??
      defaults?.bookingPrices.expressConsultation ??
      18000,
    expressSupport:
      raw?.bookingPrices?.expressSupport ?? defaults?.bookingPrices.expressSupport ?? 18000,
  };

  const servicePackages = (raw?.servicePackages || defaults?.servicePackages || []).map((item, index) => ({
    id: item.id || randomId(),
    active: typeof item.active === "boolean" ? item.active : true,
    highlight: Boolean(item.highlight),
    order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso(),
    translations: {
      en: normalizeTranslation(item.translations?.en),
      fr: normalizeTranslation(item.translations?.fr),
      ar: normalizeTranslation(item.translations?.ar),
    },
  }));

  return {
    bookingPrices,
    servicePackages,
  };
}

function sortPackages(packages: CatalogPackageRecord[]) {
  return [...packages].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function localizePackage(item: CatalogPackageRecord, locale: CatalogLocale): PublicCatalogPackage {
  return {
    id: item.id,
    active: item.active,
    highlight: item.highlight,
    order: item.order,
    ...item.translations[locale],
  };
}

export function createCatalogModule(options: CreateCatalogModuleOptions) {
  async function readSnapshot() {
    return normalizeSnapshot(await options.storage.load(), options.defaults);
  }

  async function writeSnapshot(snapshot: CatalogSnapshot) {
    await options.storage.save(snapshot);
    return snapshot;
  }

  return {
    sortPackages,
    async getSnapshot() {
      const snapshot = await readSnapshot();
      return {
        ...snapshot,
        servicePackages: sortPackages(snapshot.servicePackages),
      };
    },
    async getPublicCatalog(locale: CatalogLocale): Promise<PublicCatalogResponse> {
      const snapshot = await readSnapshot();
      return {
        bookingPrices: snapshot.bookingPrices,
        servicePackages: sortPackages(snapshot.servicePackages)
          .filter((item) => item.active)
          .map((item) => localizePackage(item, locale)),
      };
    },
    async updateBookingPrices(input: Partial<CatalogBookingPrices>) {
      const snapshot = await readSnapshot();
      snapshot.bookingPrices = {
        standardConsultation:
          Number.isInteger(input.standardConsultation) && Number(input.standardConsultation) >= 0
            ? Number(input.standardConsultation)
            : snapshot.bookingPrices.standardConsultation,
        standardSupport:
          Number.isInteger(input.standardSupport) && Number(input.standardSupport) >= 0
            ? Number(input.standardSupport)
            : snapshot.bookingPrices.standardSupport,
        expressConsultation:
          Number.isInteger(input.expressConsultation) && Number(input.expressConsultation) >= 0
            ? Number(input.expressConsultation)
            : snapshot.bookingPrices.expressConsultation,
        expressSupport:
          Number.isInteger(input.expressSupport) && Number(input.expressSupport) >= 0
            ? Number(input.expressSupport)
            : snapshot.bookingPrices.expressSupport,
      };

      await writeSnapshot(snapshot);
      return snapshot.bookingPrices;
    },
    async createPackage(input: {
      active?: boolean;
      highlight?: boolean;
      order?: number;
      translations?: Partial<Record<CatalogLocale, Partial<CatalogPackageTranslation>>>;
    }) {
      const snapshot = await readSnapshot();
      const timestamp = nowIso();
      const record: CatalogPackageRecord = {
        id: randomId(),
        active: typeof input.active === "boolean" ? input.active : true,
        highlight: Boolean(input.highlight),
        order: Number.isFinite(input.order) ? Number(input.order) : snapshot.servicePackages.length + 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        translations: {
          en: normalizeTranslation(input.translations?.en),
          fr: normalizeTranslation(input.translations?.fr),
          ar: normalizeTranslation(input.translations?.ar),
        },
      };

      snapshot.servicePackages.push(record);
      await writeSnapshot(snapshot);
      return record;
    },
    async updatePackage(input: {
      id: string;
      active?: boolean;
      highlight?: boolean;
      order?: number;
      translations?: Partial<Record<CatalogLocale, Partial<CatalogPackageTranslation>>>;
    }) {
      const snapshot = await readSnapshot();
      const record = snapshot.servicePackages.find((item) => item.id === input.id);
      if (!record) {
        throw new Error("Package not found.");
      }

      if (typeof input.active === "boolean") record.active = input.active;
      if (typeof input.highlight === "boolean") record.highlight = input.highlight;
      if (Number.isFinite(input.order)) record.order = Number(input.order);

      if (input.translations) {
        for (const locale of ["en", "fr", "ar"] as CatalogLocale[]) {
          if (input.translations[locale]) {
            record.translations[locale] = normalizeTranslation({
              ...record.translations[locale],
              ...input.translations[locale],
            });
          }
        }
      }

      record.updatedAt = nowIso();
      await writeSnapshot(snapshot);
      return record;
    },
    async deletePackage(packageId: string) {
      const snapshot = await readSnapshot();
      const nextPackages = snapshot.servicePackages.filter((item) => item.id !== packageId);
      if (nextPackages.length === snapshot.servicePackages.length) {
        throw new Error("Package not found.");
      }

      snapshot.servicePackages = nextPackages;
      await writeSnapshot(snapshot);
      return true;
    },
  };
}
