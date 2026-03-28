import type { BookingRecord } from "../booking/contracts";

export type CustomerProfile = {
  userId: string;
  email: string;
  name: string | null;
  country: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDashboardResponse = {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  profile: CustomerProfile;
  bookings: BookingRecord[];
};

export type AdminCatalogPackageTranslation = {
  title: string;
  subtitle: string;
  duration: string;
  priceLabel: string;
  bullets: string[];
};

export type AdminCatalogPackage = {
  id: string;
  active: boolean;
  highlight: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  translations: {
    en: AdminCatalogPackageTranslation;
    fr: AdminCatalogPackageTranslation;
    ar: AdminCatalogPackageTranslation;
  };
};

export type AdminCatalogResponse = {
  bookingPrices: {
    standardConsultation: number;
    standardSupport: number;
    expressConsultation: number;
    expressSupport: number;
  };
  servicePackages: AdminCatalogPackage[];
};

export type AdminDashboardResponse = {
  admin: { email: string };
  stats: Record<string, number>;
  users: Array<Record<string, unknown>>;
  sessions: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  insights: Record<string, unknown>;
  visitors: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
  ga4: Record<string, unknown>;
  chat: {
    enabled: boolean;
  };
};

