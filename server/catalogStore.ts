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

export type CatalogTrainingTranslation = {
  badge: string;
  title: string;
  hours: string;
  duration: string;
  prerequisite: string;
  certification: string;
  project: string;
  modules: string[];
};

export type CatalogTrainingProgramRecord = {
  id: string;
  key: string;
  active: boolean;
  featured: boolean;
  order: number;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
  translations: Record<CatalogLocale, CatalogTrainingTranslation>;
};

export type CatalogCountryPriceOverride = {
  countryCode: string;
  active: boolean;
  bookingPrices: Partial<CatalogBookingPrices>;
  trainingProgramPrices: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

type CatalogDb = {
  bookingPrices: CatalogBookingPrices;
  trainingPrices: CatalogTrainingPrices;
  trainingPrograms: CatalogTrainingProgramRecord[];
  servicePackages: CatalogPackageRecord[];
  countryPriceOverrides: CatalogCountryPriceOverride[];
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

function normalizeCountryCode(value: unknown) {
  const countryCode = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : "";
}

function normalizePriceOverride(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : undefined;
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

function createDefaultTrainingPrograms(prices = defaultTrainingPrices()): CatalogTrainingProgramRecord[] {
  const timestamp = nowIso();
  const defaults: Array<{
    key: keyof CatalogTrainingPrices;
    order: number;
    priceCents: number;
    translations: Record<CatalogLocale, CatalogTrainingTranslation>;
  }> = [
    {
      key: "level1",
      order: 1,
      priceCents: prices.level1,
      translations: {
        en: {
          badge: "Level 1 - Beginner",
          title: "Core Designer",
          hours: "25 hours",
          duration: "2-3 weeks",
          prerequisite: "No prerequisites",
          certification: "Certification: CV Core Designer",
          project: "Final project: complete residential kitchen + closet",
          modules: [
            "M1 - Environment & configuration - 3h",
            "M2 - Room layout - 5h",
            "M3 - Unit placement - 6h",
            "M4 - 3D render & presentation - 5h",
            "M5 - Cut List & printing - 6h",
          ],
        },
        fr: {
          badge: "Niveau 1 - Debutant",
          title: "Core Designer",
          hours: "25 heures",
          duration: "2-3 semaines",
          prerequisite: "Aucun prerequis",
          certification: "Certification : CV Core Designer",
          project: "Projet final : cuisine residentielle complete + closet",
          modules: [
            "M1 - Environnement & configuration - 3h",
            "M2 - Mise en plan de la piece - 5h",
            "M3 - Placement des unites - 6h",
            "M4 - Rendu 3D & presentation - 5h",
            "M5 - Cut List & impression - 6h",
          ],
        },
        ar: {
          badge: "المستوى 1 - مبتدئ",
          title: "Core Designer",
          hours: "25 ساعة",
          duration: "2-3 أسابيع",
          prerequisite: "بدون شروط مسبقة",
          certification: "الشهادة: CV Core Designer",
          project: "المشروع النهائي: مطبخ سكني كامل + Closet",
          modules: [
            "M1 - البيئة والإعداد - 3h",
            "M2 - تخطيط الغرفة - 5h",
            "M3 - وضع الوحدات - 6h",
            "M4 - العرض ثلاثي الأبعاد - 5h",
            "M5 - Cut List والطباعة - 6h",
          ],
        },
      },
    },
    {
      key: "level2",
      order: 2,
      priceCents: prices.level2,
      translations: {
        en: {
          badge: "Level 2 - Intermediate",
          title: "Catalog Engineer",
          hours: "30 hours",
          duration: "3-4 weeks",
          prerequisite: "Level 1 required",
          certification: "Certification: CV Catalog Engineer",
          project: "Final project: complete catalog (Garage or Semi-Custom)",
          modules: [
            "M6 - Assembly Manager - 7h",
            "M7 - Catalog construction - 7h",
            "M8 - Door Catalog & Hardware - 5h",
            "M9 - xBidding & xReporting - 6h",
            "M10 - Countertops & shaping - 5h",
          ],
        },
        fr: {
          badge: "Niveau 2 - Intermediaire",
          title: "Catalog Engineer",
          hours: "30 heures",
          duration: "3-4 semaines",
          prerequisite: "Niveau 1 requis",
          certification: "Certification : CV Catalog Engineer",
          project: "Projet final : catalogue complet (Garage ou Semi-Custom)",
          modules: [
            "M6 - Assembly Manager - 7h",
            "M7 - Construction du catalogue - 7h",
            "M8 - Door Catalogue & Hardware - 5h",
            "M9 - xBidding & xReporting - 6h",
            "M10 - Countertops & Shaping - 5h",
          ],
        },
        ar: {
          badge: "المستوى 2 - متوسط",
          title: "Catalog Engineer",
          hours: "30 ساعة",
          duration: "3-4 أسابيع",
          prerequisite: "المستوى 1 مطلوب",
          certification: "الشهادة: CV Catalog Engineer",
          project: "المشروع النهائي: كتالوج كامل (Garage أو Semi-Custom)",
          modules: [
            "M6 - Assembly Manager - 7h",
            "M7 - بناء الكتالوج - 7h",
            "M8 - الأبواب والهاردوير - 5h",
            "M9 - xBidding و xReporting - 6h",
            "M10 - Countertops والتشكيل - 5h",
          ],
        },
      },
    },
    {
      key: "level3",
      order: 3,
      priceCents: prices.level3,
      translations: {
        en: {
          badge: "Level 3 - Advanced",
          title: "Production Specialist",
          hours: "35 hours",
          duration: "4-5 weeks",
          prerequisite: "Level 2 required",
          certification: "Certification: CV Production Specialist",
          project: "Final project: from design to complete CNC files",
          modules: [
            "M11 - xMachining basics - 7h",
            "M12 - S2M Center and G-Code - 8h",
            "M13 - xOptimizer nesting - 6h",
            "M14 - xLabel & Paperless - 5h",
            "M15 - Complete design-to-CNC flow - 9h",
          ],
        },
        fr: {
          badge: "Niveau 3 - Avance",
          title: "Production Specialist",
          hours: "35 heures",
          duration: "4-5 semaines",
          prerequisite: "Niveau 2 requis",
          certification: "Certification : CV Production Specialist",
          project: "Projet final : du design aux fichiers CNC complets",
          modules: [
            "M11 - xMachining : bases - 7h",
            "M12 - S2M Center et G-Code - 8h",
            "M13 - xOptimizer (Nesting) - 6h",
            "M14 - xLabel & Paperless - 5h",
            "M15 - Flux complet design vers CNC - 9h",
          ],
        },
        ar: {
          badge: "المستوى 3 - متقدم",
          title: "Production Specialist",
          hours: "35 ساعة",
          duration: "4-5 أسابيع",
          prerequisite: "المستوى 2 مطلوب",
          certification: "الشهادة: CV Production Specialist",
          project: "المشروع النهائي: من التصميم إلى ملفات CNC كاملة",
          modules: [
            "M11 - أساسيات xMachining - 7h",
            "M12 - S2M Center و G-Code - 8h",
            "M13 - xOptimizer Nesting - 6h",
            "M14 - xLabel و Paperless - 5h",
            "M15 - مسار كامل من التصميم إلى CNC - 9h",
          ],
        },
      },
    },
    {
      key: "level4",
      order: 4,
      priceCents: prices.level4,
      translations: {
        en: {
          badge: "Level 4 - Expert",
          title: "CV Consultant",
          hours: "25 hours",
          duration: "3-4 weeks",
          prerequisite: "Level 3 required",
          certification: "Certification: Certified CV Consultant",
          project: "Final project: complete deployment for a manufacturer",
          modules: [
            "M16 - Object Intelligence & UCS - 7h",
            "M17 - Catalog automation - 6h",
            "M18 - xCRM & project management - 5h",
            "M19 - Consulting workshop - 7h",
          ],
        },
        fr: {
          badge: "Niveau 4 - Expert",
          title: "CV Consultant",
          hours: "25 heures",
          duration: "3-4 semaines",
          prerequisite: "Niveau 3 requis",
          certification: "Certification : Certified CV Consultant",
          project: "Projet final : deploiement complet pour un fabricant",
          modules: [
            "M16 - Object Intelligence & UCS - 7h",
            "M17 - Automatisation du catalogue - 6h",
            "M18 - xCRM & gestion de projets - 5h",
            "M19 - Atelier consultation - 7h",
          ],
        },
        ar: {
          badge: "المستوى 4 - خبير",
          title: "CV Consultant",
          hours: "25 ساعة",
          duration: "3-4 أسابيع",
          prerequisite: "المستوى 3 مطلوب",
          certification: "الشهادة: Certified CV Consultant",
          project: "المشروع النهائي: نشر كامل للنظام عند مصنع",
          modules: [
            "M16 - Object Intelligence و UCS - 7h",
            "M17 - أتمتة الكتالوج - 6h",
            "M18 - xCRM وإدارة المشاريع - 5h",
            "M19 - ورشة الاستشارة - 7h",
          ],
        },
      },
    },
    {
      key: "bundle",
      order: 5,
      priceCents: prices.bundle,
      translations: {
        en: {
          badge: "Complete bundle",
          title: "Complete CV Professional Path",
          hours: "115 hours",
          duration: "4 levels",
          prerequisite: "Level 1 to Level 4",
          certification: "All four certifications included",
          project: "Levels 1 + 2 + 3 + 4, four capstone projects, and certifications included.",
          modules: [
            "Core Designer",
            "Catalog Engineer",
            "Production Specialist",
            "CV Consultant",
          ],
        },
        fr: {
          badge: "Parcours complet",
          title: "Parcours CV Professionnel Complet",
          hours: "115 heures",
          duration: "4 niveaux",
          prerequisite: "Du niveau 1 au niveau 4",
          certification: "Les quatre certifications incluses",
          project: "Niveaux 1 + 2 + 3 + 4, quatre projets de fin de niveau et certifications incluses.",
          modules: [
            "Core Designer",
            "Catalog Engineer",
            "Production Specialist",
            "CV Consultant",
          ],
        },
        ar: {
          badge: "المسار الكامل",
          title: "المسار الاحترافي الكامل",
          hours: "115 ساعة",
          duration: "4 مستويات",
          prerequisite: "من المستوى 1 إلى المستوى 4",
          certification: "كل الشهادات الأربع مشمولة",
          project: "المستويات 1 + 2 + 3 + 4، مشاريع نهاية المستوى، والشهادات مشمولة.",
          modules: [
            "Core Designer",
            "Catalog Engineer",
            "Production Specialist",
            "CV Consultant",
          ],
        },
      },
    },
  ];

  return defaults.map((program) => ({
    id: program.key,
    key: program.key,
    active: true,
    featured: program.key === "bundle",
    order: program.order,
    priceCents: program.priceCents,
    createdAt: timestamp,
    updatedAt: timestamp,
    translations: program.translations,
  }));
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
    const trainingPrices = defaultTrainingPrices();
    const initial: CatalogDb = {
      bookingPrices: defaultBookingPrices(),
      trainingPrices,
      trainingPrograms: createDefaultTrainingPrograms(trainingPrices),
      servicePackages: createDefaultPackages(),
      countryPriceOverrides: [],
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

function normalizeTrainingTranslation(input?: Partial<CatalogTrainingTranslation>) {
  return {
    badge: String(input?.badge || "").trim(),
    title: String(input?.title || "").trim(),
    hours: String(input?.hours || "").trim(),
    duration: String(input?.duration || "").trim(),
    prerequisite: String(input?.prerequisite || "").trim(),
    certification: String(input?.certification || "").trim(),
    project: String(input?.project || "").trim(),
    modules: Array.isArray(input?.modules)
      ? input!.modules.map((item) => String(item || "").trim()).filter(Boolean)
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

function normalizeTrainingProgram(
  item: Partial<CatalogTrainingProgramRecord>,
  index: number,
  trainingPrices: CatalogTrainingPrices,
) {
  const fallbackKey = (["level1", "level2", "level3", "level4", "bundle"][index] || `program-${index + 1}`) as keyof CatalogTrainingPrices | string;
  const key = normalizeTrainingKey(item.key || fallbackKey);
  const legacyPrice = key in trainingPrices ? trainingPrices[key as keyof CatalogTrainingPrices] : undefined;
  const priceCents = Number.isInteger(item.priceCents) && Number(item.priceCents) >= 0 ? Number(item.priceCents) : legacyPrice || 0;

  return {
    id: item.id || randomId(),
    key,
    active: typeof item.active === "boolean" ? item.active : true,
    featured: Boolean(item.featured),
    order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
    priceCents,
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso(),
    translations: {
      en: normalizeTrainingTranslation(item.translations?.en),
      fr: normalizeTrainingTranslation(item.translations?.fr),
      ar: normalizeTrainingTranslation(item.translations?.ar),
    },
  } satisfies CatalogTrainingProgramRecord;
}

function normalizeCountryPriceOverride(item: Partial<CatalogCountryPriceOverride>) {
  const countryCode = normalizeCountryCode(item.countryCode);
  if (!countryCode) return null;

  const bookingPrices: Partial<CatalogBookingPrices> = {};
  for (const key of ["standardConsultation", "standardSupport", "expressConsultation", "expressSupport"] as const) {
    const amount = normalizePriceOverride(item.bookingPrices?.[key]);
    if (typeof amount === "number") bookingPrices[key] = amount;
  }

  const trainingProgramPrices: Record<string, number> = {};
  const rawTrainingPrices = item.trainingProgramPrices && typeof item.trainingProgramPrices === "object" ? item.trainingProgramPrices : {};
  for (const [key, value] of Object.entries(rawTrainingPrices)) {
    const normalizedKey = normalizeTrainingKey(key);
    const amount = normalizePriceOverride(value);
    if (normalizedKey && typeof amount === "number") trainingProgramPrices[normalizedKey] = amount;
  }

  return {
    countryCode,
    active: typeof item.active === "boolean" ? item.active : true,
    bookingPrices,
    trainingProgramPrices,
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso(),
  } satisfies CatalogCountryPriceOverride;
}

function deriveTrainingPrices(trainingPrices: CatalogTrainingPrices, trainingPrograms: CatalogTrainingProgramRecord[]) {
  const nextPrices = { ...trainingPrices };
  for (const key of ["level1", "level2", "level3", "level4", "bundle"] as Array<keyof CatalogTrainingPrices>) {
    const program = trainingPrograms.find((item) => item.key === key);
    if (program) nextPrices[key] = program.priceCents;
  }
  return nextPrices;
}

function applyCountryPriceOverride(db: CatalogDb, countryCode?: string | null) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const override = normalizedCountryCode
    ? db.countryPriceOverrides.find((item) => item.active && item.countryCode === normalizedCountryCode)
    : null;

  if (!override) {
    return {
      bookingPrices: db.bookingPrices,
      trainingPrices: db.trainingPrices,
      trainingPrograms: db.trainingPrograms,
      appliedCountryCode: null as string | null,
    };
  }

  const bookingPrices: CatalogBookingPrices = {
    ...db.bookingPrices,
    ...override.bookingPrices,
  };
  const trainingPrograms = db.trainingPrograms.map((program) => {
    const overridePrice =
      override.trainingProgramPrices[program.key] ??
      override.trainingProgramPrices[program.id];
    return typeof overridePrice === "number" && overridePrice >= 0
      ? { ...program, priceCents: overridePrice }
      : program;
  });

  return {
    bookingPrices,
    trainingPrices: deriveTrainingPrices(db.trainingPrices, trainingPrograms),
    trainingPrograms,
    appliedCountryCode: override.countryCode,
  };
}

function loadDb(): CatalogDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<CatalogDb>;
  const trainingPrices = {
    ...defaultTrainingPrices(),
    ...(parsed.trainingPrices || {}),
  };
  const trainingPrograms = Array.isArray(parsed.trainingPrograms) && parsed.trainingPrograms.length
    ? parsed.trainingPrograms.map((item, index) => normalizeTrainingProgram(item, index, trainingPrices))
    : createDefaultTrainingPrograms(trainingPrices);
  const countryPriceOverrides = (parsed.countryPriceOverrides || [])
    .map((item) => normalizeCountryPriceOverride(item))
    .filter((item): item is CatalogCountryPriceOverride => Boolean(item));
  return {
    bookingPrices: {
      ...defaultBookingPrices(),
      ...(parsed.bookingPrices || {}),
    },
    trainingPrices: deriveTrainingPrices(trainingPrices, trainingPrograms),
    trainingPrograms,
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
    countryPriceOverrides,
  };
}

function saveDb(db: CatalogDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sortPackages(packages: CatalogPackageRecord[]) {
  return [...packages].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function sortTrainingPrograms(programs: CatalogTrainingProgramRecord[]) {
  return [...programs].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function getCatalogSnapshot(countryCode?: string | null) {
  const db = loadDb();
  const resolved = applyCountryPriceOverride(db, countryCode);
  return {
    bookingPrices: resolved.bookingPrices,
    trainingPrices: resolved.trainingPrices,
    trainingPrograms: sortTrainingPrograms(resolved.trainingPrograms),
    servicePackages: sortPackages(db.servicePackages),
    countryPriceOverrides: db.countryPriceOverrides,
    appliedCountryCode: resolved.appliedCountryCode,
  };
}

export function getPublicCatalog(locale: CatalogLocale, countryCode?: string | null) {
  const snapshot = getCatalogSnapshot(countryCode);
  return {
    bookingPrices: snapshot.bookingPrices,
    appliedCountryCode: snapshot.appliedCountryCode,
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

export function getPublicTrainingPrograms() {
  return getCatalogSnapshot().trainingPrograms
    .filter((program) => program.active)
    .map((program) => ({
      id: program.id,
      key: program.key,
      active: program.active,
      featured: program.featured,
      order: program.order,
      translations: program.translations,
    }));
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

export function upsertCatalogCountryPriceOverride(input: {
  countryCode: string;
  active?: boolean;
  bookingPrices?: Partial<CatalogBookingPrices>;
  trainingProgramPrices?: Record<string, number | null | undefined>;
}) {
  const db = loadDb();
  const countryCode = normalizeCountryCode(input.countryCode);
  if (!countryCode) {
    throw new Error("A valid country code is required.");
  }

  const timestamp = nowIso();
  const existing = db.countryPriceOverrides.find((item) => item.countryCode === countryCode);
  const bookingPrices: Partial<CatalogBookingPrices> = {};
  for (const key of ["standardConsultation", "standardSupport", "expressConsultation", "expressSupport"] as const) {
    const amount = normalizePriceOverride(input.bookingPrices?.[key]);
    if (typeof amount === "number") bookingPrices[key] = amount;
  }

  const validProgramKeys = new Set(db.trainingPrograms.flatMap((program) => [program.id, program.key]));
  const trainingProgramPrices: Record<string, number> = {};
  for (const [key, value] of Object.entries(input.trainingProgramPrices || {})) {
    const normalizedKey = normalizeTrainingKey(key);
    const amount = normalizePriceOverride(value);
    if (normalizedKey && validProgramKeys.has(normalizedKey) && typeof amount === "number") {
      trainingProgramPrices[normalizedKey] = amount;
    }
  }

  if (existing) {
    existing.active = typeof input.active === "boolean" ? input.active : existing.active;
    existing.bookingPrices = bookingPrices;
    existing.trainingProgramPrices = trainingProgramPrices;
    existing.updatedAt = timestamp;
    saveDb(db);
    return existing;
  }

  const record: CatalogCountryPriceOverride = {
    countryCode,
    active: typeof input.active === "boolean" ? input.active : true,
    bookingPrices,
    trainingProgramPrices,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.countryPriceOverrides.push(record);
  db.countryPriceOverrides.sort((a, b) => a.countryCode.localeCompare(b.countryCode));
  saveDb(db);
  return record;
}

export function deleteCatalogCountryPriceOverride(countryCodeInput: string) {
  const db = loadDb();
  const countryCode = normalizeCountryCode(countryCodeInput);
  if (!countryCode) {
    throw new Error("A valid country code is required.");
  }

  const nextOverrides = db.countryPriceOverrides.filter((item) => item.countryCode !== countryCode);
  if (nextOverrides.length === db.countryPriceOverrides.length) {
    throw new Error("Country price override not found.");
  }
  db.countryPriceOverrides = nextOverrides;
  saveDb(db);
  return true;
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
  db.trainingPrograms = db.trainingPrograms.map((program) => {
    if (program.key in db.trainingPrices) {
      return {
        ...program,
        priceCents: db.trainingPrices[program.key as keyof CatalogTrainingPrices],
        updatedAt: nowIso(),
      };
    }
    return program;
  });
  saveDb(db);
  return db.trainingPrices;
}

export function getCatalogTrainingProgram(identifier: string, countryCode?: string | null) {
  const normalized = String(identifier || "").trim();
  if (!normalized) return null;
  return getCatalogSnapshot(countryCode).trainingPrograms.find((program) => program.id === normalized || program.key === normalized) || null;
}

export function createCatalogTrainingProgram(input: {
  key?: string;
  active?: boolean;
  featured?: boolean;
  order?: number;
  priceCents?: number;
  translations?: Partial<Record<CatalogLocale, Partial<CatalogTrainingTranslation>>>;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const key = makeUniqueTrainingKey(input.key || "training-program", db.trainingPrograms);
  const record: CatalogTrainingProgramRecord = {
    id: randomId(),
    key,
    active: typeof input.active === "boolean" ? input.active : true,
    featured: Boolean(input.featured),
    order: Number.isFinite(input.order) ? Number(input.order) : db.trainingPrograms.length + 1,
    priceCents: Number.isInteger(input.priceCents) && Number(input.priceCents) >= 0 ? Number(input.priceCents) : 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    translations: {
      en: normalizeTrainingTranslation(input.translations?.en),
      fr: normalizeTrainingTranslation(input.translations?.fr),
      ar: normalizeTrainingTranslation(input.translations?.ar),
    },
  };
  db.trainingPrograms.push(record);
  db.trainingPrices = deriveTrainingPrices(db.trainingPrices, db.trainingPrograms);
  saveDb(db);
  return record;
}

export function updateCatalogTrainingProgram(input: {
  id: string;
  key?: string;
  active?: boolean;
  featured?: boolean;
  order?: number;
  priceCents?: number;
  translations?: Partial<Record<CatalogLocale, Partial<CatalogTrainingTranslation>>>;
}) {
  const db = loadDb();
  const record = db.trainingPrograms.find((item) => item.id === input.id);
  if (!record) {
    throw new Error("Training program not found.");
  }

  if (typeof input.key === "string" && input.key.trim()) {
    record.key = makeUniqueTrainingKey(input.key, db.trainingPrograms, record.id);
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
  db.trainingPrices = deriveTrainingPrices(db.trainingPrices, db.trainingPrograms);
  saveDb(db);
  return record;
}

export function deleteCatalogTrainingProgram(id: string) {
  const db = loadDb();
  const nextPrograms = db.trainingPrograms.filter((item) => item.id !== id);
  if (nextPrograms.length === db.trainingPrograms.length) {
    throw new Error("Training program not found.");
  }
  db.trainingPrograms = nextPrograms;
  db.countryPriceOverrides = db.countryPriceOverrides.map((override) => {
    const trainingProgramPrices = { ...override.trainingProgramPrices };
    delete trainingProgramPrices[id];
    return { ...override, trainingProgramPrices, updatedAt: nowIso() };
  });
  db.trainingPrices = deriveTrainingPrices(defaultTrainingPrices(), db.trainingPrograms);
  saveDb(db);
  return true;
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
