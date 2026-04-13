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

export type PublicCatalogPackage = {
  id: string;
  active: boolean;
  highlight: boolean;
  order: number;
  title: string;
  subtitle: string;
  duration: string;
  priceLabel: string;
  bullets: string[];
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

export type PublicTrainingProgram = Omit<CatalogTrainingProgramRecord, "priceCents" | "createdAt" | "updatedAt">;

export type CatalogSnapshot = {
  bookingPrices: CatalogBookingPrices;
  trainingPrices: CatalogTrainingPrices;
  trainingPrograms: CatalogTrainingProgramRecord[];
  servicePackages: CatalogPackageRecord[];
};

export type PublicCatalogResponse = {
  bookingPrices: CatalogBookingPrices;
  servicePackages: PublicCatalogPackage[];
};

export type PublicTrainingProgramsResponse = {
  programs: PublicTrainingProgram[];
};
