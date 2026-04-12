import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";

export type CatalogLocale = "en" | "fr" | "ar";

export type CatalogPackageTranslation = {
  title: string;
  subtitle: string;
  duration: string;
  priceLabel: string;
  bullets: string[];
};

export type CatalogPackageRecord = {
  id: string;
  active: boolean;
  highlight: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  translations: Record<CatalogLocale, CatalogPackageTranslation>;
};

export type CatalogBookingPrices = {
  standardConsultation: number;
  standardSupport: number;
  expressConsultation: number;
  expressSupport: number;
};

export type CatalogTrainingPrices = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  bundle: number;
};

type CatalogDb = {
  bookingPrices: CatalogBookingPrices;
  trainingPrices: CatalogTrainingPrices;
  servicePackages: CatalogPackageRecord[];
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "catalog-db.json");

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 10) {
  return crypto.randomBytes(size).toString("hex");
}

function parseAmount(value: string | undefined, fallback: number) {
  const amount = Number(value || "");
  return Number.isInteger(amount) && amount > 0 ? amount : fallback;
}

function defaultBookingPrices(): CatalogBookingPrices {
  return {
    standardConsultation: parseAmount(process.env.STRIPE_PRICE_STANDARD_CONSULTATION, 14000),
    standardSupport: parseAmount(process.env.STRIPE_PRICE_STANDARD_SUPPORT, 14000),
    expressConsultation: parseAmount(process.env.STRIPE_PRICE_EXPRESS_CONSULTATION, 18000),
    expressSupport: parseAmount(process.env.STRIPE_PRICE_EXPRESS_SUPPORT, 18000),
  };
}

function defaultTrainingPrices(): CatalogTrainingPrices {
  return {
    level1: parseAmount(process.env.STRIPE_PRICE_TRAINING_LEVEL_1, 59700),
    level2: parseAmount(process.env.STRIPE_PRICE_TRAINING_LEVEL_2, 99700),
    level3: parseAmount(process.env.STRIPE_PRICE_TRAINING_LEVEL_3, 129700),
    level4: parseAmount(process.env.STRIPE_PRICE_TRAINING_LEVEL_4, 149700),
    bundle: parseAmount(process.env.STRIPE_PRICE_TRAINING_BUNDLE, 399700),
  };
}

function createDefaultPackages(): CatalogPackageRecord[] {
  const timestamp = nowIso();
  return [
    {
      id: randomId(),
      active: true,
      highlight: true,
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      translations: {
        en: {
          title: "Annual Support Plan",
          subtitle: "Priority support + continuous optimization",
          duration: "Billed yearly (no monthly billing)",
          priceLabel: "",
          bullets: [
            "Priority WhatsApp support",
            "Monthly system and workflow check",
            "Library, material, and hardware updates",
            "CNC output troubleshooting when needed",
            "Performance monitoring and recommendations",
          ],
        },
        fr: {
          title: "Plan de Support Annuel",
          subtitle: "Support prioritaire + optimisation continue",
          duration: "Facturation annuelle (pas de mensuel)",
          priceLabel: "",
          bullets: [
            "Support WhatsApp prioritaire",
            "Contrôle mensuel système & workflow",
            "Mises à jour bibliothèques / matériaux",
            "Dépannage CNC si nécessaire",
            "Suivi performance + recommandations",
          ],
        },
        ar: {
          title: "خطة الدعم السنوية",
          subtitle: "دعم أولوية + تحسين مستمر",
          duration: "فوترة سنوية (بدون شهري)",
          priceLabel: "",
          bullets: [
            "دعم واتساب بأولوية",
            "فحص شهري للنظام وسير العمل",
            "تحديثات المكتبات والمواد والإكسسوارات",
            "حل مشكلات CNC عند الحاجة",
            "متابعة الأداء وتوصيات",
          ],
        },
      },
    },
    {
      id: randomId(),
      active: true,
      highlight: false,
      order: 2,
      createdAt: timestamp,
      updatedAt: timestamp,
      translations: {
        en: {
          title: "Audit",
          subtitle: "Fast clarity in one session",
          duration: "90 minutes",
          priceLabel: "$299",
          bullets: [
            "System and workflow review",
            "Root-cause identification",
            "Priority fix plan",
            "Quick wins implemented",
            "Clear next steps for your team",
          ],
        },
        fr: {
          title: "Audit",
          subtitle: "Clarté rapide en une session",
          duration: "90 minutes",
          priceLabel: "299 $",
          bullets: [
            "Revue système + workflow",
            "Identification des causes racines",
            "Plan de correction priorisé",
            "Quick wins appliqués",
            "Étapes suivantes claires",
          ],
        },
        ar: {
          title: "Audit",
          subtitle: "وضوح سريع في جلسة واحدة",
          duration: "90 دقيقة",
          priceLabel: "$299",
          bullets: [
            "مراجعة النظام وسير العمل",
            "تحديد الأسباب الجذرية",
            "خطة إصلاح ذات أولوية",
            "حلول سريعة مطبقة",
            "خطوات تالية واضحة",
          ],
        },
      },
    },
    {
      id: randomId(),
      active: true,
      highlight: false,
      order: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
      translations: {
        en: {
          title: "Fix Day",
          subtitle: "Hands-on fixes and setup",
          duration: "Full day (remote)",
          priceLabel: "$899",
          bullets: [
            "Error diagnosis and resolution",
            "Library and material setup",
            "Hardware and path configuration",
            "CNC and output fixes",
            "Stability checks and backup guidance",
          ],
        },
        fr: {
          title: "Fix Day",
          subtitle: "Corrections & mise en place",
          duration: "Journée complète (à distance)",
          priceLabel: "899 $",
          bullets: [
            "Diagnostic et résolution d'erreurs",
            "Mise en place bibliothèques",
            "Configuration quincaillerie + chemins",
            "Correctifs CNC / sorties",
            "Contrôles de stabilité + backup",
          ],
        },
        ar: {
          title: "Fix Day",
          subtitle: "إصلاحات وإعداد عملي",
          duration: "يوم كامل (عن بُعد)",
          priceLabel: "$899",
          bullets: [
            "تشخيص وحل الأخطاء",
            "إعداد المكتبات والمواد",
            "تهيئة الإكسسوارات والمسارات",
            "إصلاحات CNC والمخرجات",
            "تحقق من الاستقرار وإرشادات النسخ",
          ],
        },
      },
    },
  ];
}

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: CatalogDb = {
      bookingPrices: defaultBookingPrices(),
      trainingPrices: defaultTrainingPrices(),
      servicePackages: createDefaultPackages(),
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

function normalizeTranslation(input?: Partial<CatalogPackageTranslation>) {
  return {
    title: String(input?.title || "").trim(),
    subtitle: String(input?.subtitle || "").trim(),
    duration: String(input?.duration || "").trim(),
    priceLabel: String(input?.priceLabel || "").trim(),
    bullets: Array.isArray(input?.bullets)
      ? input!.bullets.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
  };
}

function loadDb(): CatalogDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<CatalogDb>;
  return {
    bookingPrices: {
      ...defaultBookingPrices(),
      ...(parsed.bookingPrices || {}),
    },
    trainingPrices: {
      ...defaultTrainingPrices(),
      ...(parsed.trainingPrices || {}),
    },
    servicePackages: (parsed.servicePackages || createDefaultPackages()).map((item, index) => ({
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
    })),
  };
}

function saveDb(db: CatalogDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sortPackages(packages: CatalogPackageRecord[]) {
  return [...packages].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function getCatalogSnapshot() {
  const db = loadDb();
  return {
    bookingPrices: db.bookingPrices,
    trainingPrices: db.trainingPrices,
    servicePackages: sortPackages(db.servicePackages),
  };
}

export function getPublicCatalog(locale: CatalogLocale) {
  const snapshot = getCatalogSnapshot();
  return {
    bookingPrices: snapshot.bookingPrices,
    servicePackages: snapshot.servicePackages
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        active: item.active,
        highlight: item.highlight,
        order: item.order,
        ...item.translations[locale],
      })),
  };
}

export function updateCatalogBookingPrices(input: Partial<CatalogBookingPrices>) {
  const db = loadDb();
  db.bookingPrices = {
    standardConsultation: Number.isInteger(input.standardConsultation) && Number(input.standardConsultation) >= 0 ? Number(input.standardConsultation) : db.bookingPrices.standardConsultation,
    standardSupport: Number.isInteger(input.standardSupport) && Number(input.standardSupport) >= 0 ? Number(input.standardSupport) : db.bookingPrices.standardSupport,
    expressConsultation: Number.isInteger(input.expressConsultation) && Number(input.expressConsultation) >= 0 ? Number(input.expressConsultation) : db.bookingPrices.expressConsultation,
    expressSupport: Number.isInteger(input.expressSupport) && Number(input.expressSupport) >= 0 ? Number(input.expressSupport) : db.bookingPrices.expressSupport,
  };
  saveDb(db);
  return db.bookingPrices;
}

export function updateCatalogTrainingPrices(input: Partial<CatalogTrainingPrices>) {
  const db = loadDb();
  db.trainingPrices = {
    level1: Number.isInteger(input.level1) && Number(input.level1) >= 0 ? Number(input.level1) : db.trainingPrices.level1,
    level2: Number.isInteger(input.level2) && Number(input.level2) >= 0 ? Number(input.level2) : db.trainingPrices.level2,
    level3: Number.isInteger(input.level3) && Number(input.level3) >= 0 ? Number(input.level3) : db.trainingPrices.level3,
    level4: Number.isInteger(input.level4) && Number(input.level4) >= 0 ? Number(input.level4) : db.trainingPrices.level4,
    bundle: Number.isInteger(input.bundle) && Number(input.bundle) >= 0 ? Number(input.bundle) : db.trainingPrices.bundle,
  };
  saveDb(db);
  return db.trainingPrices;
}

export function createCatalogPackage(input: {
  active?: boolean;
  highlight?: boolean;
  order?: number;
  translations?: Partial<Record<CatalogLocale, Partial<CatalogPackageTranslation>>>;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const nextOrder = Number.isFinite(input.order) ? Number(input.order) : db.servicePackages.length + 1;
  const record: CatalogPackageRecord = {
    id: randomId(),
    active: typeof input.active === "boolean" ? input.active : true,
    highlight: Boolean(input.highlight),
    order: nextOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
    translations: {
      en: normalizeTranslation(input.translations?.en),
      fr: normalizeTranslation(input.translations?.fr),
      ar: normalizeTranslation(input.translations?.ar),
    },
  };
  db.servicePackages.push(record);
  saveDb(db);
  return record;
}

export function updateCatalogPackage(input: {
  id: string;
  active?: boolean;
  highlight?: boolean;
  order?: number;
  translations?: Partial<Record<CatalogLocale, Partial<CatalogPackageTranslation>>>;
}) {
  const db = loadDb();
  const record = db.servicePackages.find((item) => item.id === input.id);
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
  saveDb(db);
  return record;
}

export function deleteCatalogPackage(id: string) {
  const db = loadDb();
  const nextPackages = db.servicePackages.filter((item) => item.id !== id);
  if (nextPackages.length === db.servicePackages.length) {
    throw new Error("Package not found.");
  }
  db.servicePackages = nextPackages;
  saveDb(db);
  return true;
}
