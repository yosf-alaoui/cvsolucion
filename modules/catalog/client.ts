import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  CatalogBookingPrices,
  CatalogLocale,
  CatalogPackageRecord,
  CatalogSnapshot,
  CatalogTrainingProgramRecord,
  CatalogTrainingTranslation,
  PublicTrainingProgramsResponse,
  PublicCatalogResponse,
} from "./contracts";

export function createCatalogModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    getPublicCatalog(locale: CatalogLocale) {
      return request<PublicCatalogResponse>(`/api/catalog?locale=${encodeURIComponent(locale)}`, {
        method: "GET",
      });
    },
    getAdminCatalog() {
      return request<CatalogSnapshot>("/api/admin/catalog", { method: "GET" });
    },
    getTrainingPrograms() {
      return request<PublicTrainingProgramsResponse>("/api/training/programs", { method: "GET" });
    },
    updateBookingPrices(payload: CatalogBookingPrices) {
      return request<{ ok: true; bookingPrices: CatalogBookingPrices }>("/api/admin/catalog/pricing", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    createTrainingProgram(payload: {
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
    },
    updateTrainingProgram(programId: string, payload: Partial<CatalogTrainingProgramRecord>) {
      return request<{ ok: true; trainingProgram: CatalogTrainingProgramRecord; trainingPrograms: CatalogTrainingProgramRecord[] }>(
        `/api/admin/catalog/training-programs/${encodeURIComponent(programId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
    },
    deleteTrainingProgram(programId: string) {
      return request<{ ok: true; trainingPrograms: CatalogTrainingProgramRecord[] }>(
        `/api/admin/catalog/training-programs/${encodeURIComponent(programId)}`,
        { method: "DELETE" }
      );
    },
    createPackage(payload: {
      active?: boolean;
      highlight?: boolean;
      order?: number;
      translations: CatalogPackageRecord["translations"];
    }) {
      return request<{ ok: true; package: CatalogPackageRecord }>("/api/admin/catalog/packages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    updatePackage(packageId: string, payload: Partial<CatalogPackageRecord>) {
      return request<{ ok: true; package: CatalogPackageRecord }>(
        `/api/admin/catalog/packages/${encodeURIComponent(packageId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
    },
    deletePackage(packageId: string) {
      return request<{ ok: true }>(`/api/admin/catalog/packages/${encodeURIComponent(packageId)}`, {
        method: "DELETE",
      });
    },
  };
}
