export type CatalogLocale = "en" | "fr" | "ar";

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

export type PublicCatalogResponse = {
  bookingPrices: CatalogBookingPrices;
  appliedCountryCode?: string | null;
  servicePackages: PublicCatalogPackage[];
};

export type AdminCatalogResponse = {
  bookingPrices: CatalogBookingPrices;
  trainingPrices: CatalogTrainingPrices;
  trainingPrograms: CatalogTrainingProgramRecord[];
  servicePackages: CatalogPackageRecord[];
  countryPriceOverrides: CatalogCountryPriceOverride[];
  appliedCountryCode?: string | null;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Catalog request failed.");
  }
  return data;
}

export function getPublicCatalog(locale: CatalogLocale, countryCode?: string | null) {
  const params = new URLSearchParams({ locale });
  if (countryCode) params.set("countryCode", countryCode);
  return request<PublicCatalogResponse>(`/api/catalog/public?${params.toString()}`, { method: "GET" });
}

export function getAdminCatalog() {
  return request<AdminCatalogResponse>("/api/admin/catalog", { method: "GET" });
}

export function updateAdminCatalogPricing(payload: CatalogBookingPrices) {
  return request<{ ok: true; bookingPrices: CatalogBookingPrices }>("/api/admin/catalog/pricing", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCatalogTrainingPricing(payload: CatalogTrainingPrices) {
  return request<{ ok: true; trainingPrices: CatalogTrainingPrices }>("/api/admin/catalog/training-pricing", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function upsertAdminCatalogCountryPricing(countryCode: string, payload: {
  active: boolean;
  bookingPrices: Partial<CatalogBookingPrices>;
  trainingProgramPrices: Record<string, number>;
}) {
  return request<{ ok: true; countryPriceOverride: CatalogCountryPriceOverride; countryPriceOverrides: CatalogCountryPriceOverride[] }>(
    `/api/admin/catalog/country-pricing/${encodeURIComponent(countryCode)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteAdminCatalogCountryPricing(countryCode: string) {
  return request<{ ok: true; countryPriceOverrides: CatalogCountryPriceOverride[] }>(
    `/api/admin/catalog/country-pricing/${encodeURIComponent(countryCode)}`,
    { method: "DELETE" }
  );
}

export function createAdminCatalogTrainingProgram(payload: {
  key?: string;
  active?: boolean;
  featured?: boolean;
  order?: number;
  priceCents?: number;
  translations: Record<CatalogLocale, CatalogTrainingTranslation>;
}) {
  return request<{ ok: true; trainingProgram: CatalogTrainingProgramRecord; trainingPrograms: CatalogTrainingProgramRecord[] }>("/api/admin/catalog/training-programs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCatalogTrainingProgram(
  programId: string,
  payload: {
    key?: string;
    active?: boolean;
    featured?: boolean;
    order?: number;
    priceCents?: number;
    translations?: Partial<Record<CatalogLocale, Partial<CatalogTrainingTranslation>>>;
  }
) {
  return request<{ ok: true; trainingProgram: CatalogTrainingProgramRecord; trainingPrograms: CatalogTrainingProgramRecord[] }>(`/api/admin/catalog/training-programs/${encodeURIComponent(programId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCatalogTrainingProgram(programId: string) {
  return request<{ ok: true; trainingPrograms: CatalogTrainingProgramRecord[] }>(`/api/admin/catalog/training-programs/${encodeURIComponent(programId)}`, {
    method: "DELETE",
  });
}

export function createAdminCatalogPackage(payload: {
  active?: boolean;
  highlight?: boolean;
  order?: number;
  translations: Record<CatalogLocale, CatalogPackageTranslation>;
}) {
  return request<{ ok: true; package: CatalogPackageRecord }>("/api/admin/catalog/packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCatalogPackage(
  packageId: string,
  payload: {
    active?: boolean;
    highlight?: boolean;
    order?: number;
    translations?: Partial<Record<CatalogLocale, Partial<CatalogPackageTranslation>>>;
  }
) {
  return request<{ ok: true; package: CatalogPackageRecord }>(`/api/admin/catalog/packages/${encodeURIComponent(packageId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCatalogPackage(packageId: string) {
  return request<{ ok: true }>(`/api/admin/catalog/packages/${encodeURIComponent(packageId)}`, {
    method: "DELETE",
  });
}
