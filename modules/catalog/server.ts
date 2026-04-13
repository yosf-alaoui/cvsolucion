import crypto from "crypto";
import type {
  CatalogBookingPrices,
  CatalogLocale,
  CatalogPackageRecord,
  CatalogPackageTranslation,
  CatalogSnapshot,
  CatalogTrainingPrices,
  CatalogTrainingProgramRecord,
  CatalogTrainingTranslation,
  PublicCatalogPackage,
  PublicCatalogResponse,
  PublicTrainingProgram,
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

function defaultTrainingPrices(): CatalogTrainingPrices {
  return {
    level1: 59700,
    level2: 99700,
    level3: 129700,
    level4: 149700,
    bundle: 399700,
  };
}

function normalizeTrainingTranslation(input?: Partial<CatalogTrainingTranslation>): CatalogTrainingTranslation {
  return {
    badge: String(input?.badge || "").trim(),
    title: String(input?.title || "").trim(),
    hours: String(input?.hours || "").trim(),
    duration: String(input?.duration || "").trim(),
    prerequisite: String(input?.prerequisite || "").trim(),
    certification: String(input?.certification || "").trim(),
    project: String(input?.project || "").trim(),
    modules: Array.isArray(input?.modules)
      ? input.modules.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
  };
}

function normalizeTrainingKey(value: unknown, fallback = "program") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function makeUniqueTrainingKey(key: string, programs: CatalogTrainingProgramRecord[], currentId?: string) {
  const base = normalizeTrainingKey(key);
  let candidate = base;
  let index = 2;
  while (programs.some((program) => program.id !== currentId && program.key === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function normalizeTrainingProgram(item: Partial<CatalogTrainingProgramRecord>, index: number): CatalogTrainingProgramRecord {
  const timestamp = nowIso();
  return {
    id: item.id || randomId(),
    key: normalizeTrainingKey(item.key || `program-${index + 1}`),
    active: typeof item.active === "boolean" ? item.active : true,
    featured: Boolean(item.featured),
    order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
    priceCents: Number.isInteger(item.priceCents) && Number(item.priceCents) >= 0 ? Number(item.priceCents) : 0,
    createdAt: item.createdAt || timestamp,
    updatedAt: item.updatedAt || item.createdAt || timestamp,
    translations: {
      en: normalizeTrainingTranslation(item.translations?.en),
      fr: normalizeTrainingTranslation(item.translations?.fr),
      ar: normalizeTrainingTranslation(item.translations?.ar),
    },
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

  const trainingPrices = {
    ...defaultTrainingPrices(),
    ...(defaults?.trainingPrices || {}),
    ...(raw?.trainingPrices || {}),
  };
  const trainingPrograms = (raw?.trainingPrograms || defaults?.trainingPrograms || []).map((item, index) =>
    normalizeTrainingProgram(item, index)
  );
  for (const key of ["level1", "level2", "level3", "level4", "bundle"] as Array<keyof CatalogTrainingPrices>) {
    const program = trainingPrograms.find((item) => item.key === key);
    if (program) trainingPrices[key] = program.priceCents;
  }

  return {
    bookingPrices,
    trainingPrices,
    trainingPrograms,
    servicePackages,
  };
}

function sortPackages(packages: CatalogPackageRecord[]) {
  return [...packages].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function sortTrainingPrograms(programs: CatalogTrainingProgramRecord[]) {
  return [...programs].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
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

function publicTrainingProgram(item: CatalogTrainingProgramRecord): PublicTrainingProgram {
  return {
    id: item.id,
    key: item.key,
    active: item.active,
    featured: item.featured,
    order: item.order,
    translations: item.translations,
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
    sortTrainingPrograms,
    async getSnapshot() {
      const snapshot = await readSnapshot();
      return {
        ...snapshot,
        trainingPrograms: sortTrainingPrograms(snapshot.trainingPrograms),
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
    async getPublicTrainingPrograms() {
      const snapshot = await readSnapshot();
      return {
        programs: sortTrainingPrograms(snapshot.trainingPrograms)
          .filter((program) => program.active)
          .map(publicTrainingProgram),
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
    async createTrainingProgram(input: {
      key?: string;
      active?: boolean;
      featured?: boolean;
      order?: number;
      priceCents?: number;
      translations?: Partial<Record<CatalogLocale, Partial<CatalogTrainingTranslation>>>;
    }) {
      const snapshot = await readSnapshot();
      const timestamp = nowIso();
      const record: CatalogTrainingProgramRecord = {
        id: randomId(),
        key: makeUniqueTrainingKey(input.key || "training-program", snapshot.trainingPrograms),
        active: typeof input.active === "boolean" ? input.active : true,
        featured: Boolean(input.featured),
        order: Number.isFinite(input.order) ? Number(input.order) : snapshot.trainingPrograms.length + 1,
        priceCents: Number.isInteger(input.priceCents) && Number(input.priceCents) >= 0 ? Number(input.priceCents) : 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        translations: {
          en: normalizeTrainingTranslation(input.translations?.en),
          fr: normalizeTrainingTranslation(input.translations?.fr),
          ar: normalizeTrainingTranslation(input.translations?.ar),
        },
      };

      snapshot.trainingPrograms.push(record);
      await writeSnapshot(snapshot);
      return record;
    },
    async updateTrainingProgram(input: {
      id: string;
      key?: string;
      active?: boolean;
      featured?: boolean;
      order?: number;
      priceCents?: number;
      translations?: Partial<Record<CatalogLocale, Partial<CatalogTrainingTranslation>>>;
    }) {
      const snapshot = await readSnapshot();
      const record = snapshot.trainingPrograms.find((item) => item.id === input.id);
      if (!record) {
        throw new Error("Training program not found.");
      }

      if (typeof input.key === "string" && input.key.trim()) {
        record.key = makeUniqueTrainingKey(input.key, snapshot.trainingPrograms, record.id);
      }
      if (typeof input.active === "boolean") record.active = input.active;
      if (typeof input.featured === "boolean") record.featured = input.featured;
      if (Number.isFinite(input.order)) record.order = Number(input.order);
      if (Number.isInteger(input.priceCents) && Number(input.priceCents) >= 0) record.priceCents = Number(input.priceCents);
      if (input.translations) {
        for (const locale of ["en", "fr", "ar"] as CatalogLocale[]) {
          if (input.translations[locale]) {
            record.translations[locale] = normalizeTrainingTranslation({
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
    async deleteTrainingProgram(programId: string) {
      const snapshot = await readSnapshot();
      const nextPrograms = snapshot.trainingPrograms.filter((item) => item.id !== programId);
      if (nextPrograms.length === snapshot.trainingPrograms.length) {
        throw new Error("Training program not found.");
      }

      snapshot.trainingPrograms = nextPrograms;
      await writeSnapshot(snapshot);
      return true;
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
