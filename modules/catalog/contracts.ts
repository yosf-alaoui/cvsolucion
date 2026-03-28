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

export type CatalogSnapshot = {
  bookingPrices: CatalogBookingPrices;
  servicePackages: CatalogPackageRecord[];
};

export type PublicCatalogResponse = {
  bookingPrices: CatalogBookingPrices;
  servicePackages: PublicCatalogPackage[];
};
