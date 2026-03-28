export type CatalogLocale = "en" | "fr" | "ar";

export type CatalogBookingPrices = {
  standardConsultation: number;
  standardSupport: number;
  expressConsultation: number;
  expressSupport: number;
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
  servicePackages: PublicCatalogPackage[];
};

export type AdminCatalogResponse = {
  bookingPrices: CatalogBookingPrices;
  servicePackages: CatalogPackageRecord[];
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

export function getPublicCatalog(locale: CatalogLocale) {
  return request<PublicCatalogResponse>(`/api/catalog/public?locale=${encodeURIComponent(locale)}`, { method: "GET" });
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
