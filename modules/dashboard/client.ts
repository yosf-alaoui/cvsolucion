import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  AdminCatalogPackage,
  AdminCatalogResponse,
  AdminDashboardResponse,
  CustomerDashboardResponse,
} from "./contracts";

export function createDashboardModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    getCustomerDashboard() {
      return request<CustomerDashboardResponse>("/api/customer/dashboard", { method: "GET" });
    },
    updateCustomerProfile(payload: {
      name: string;
      country: string;
      phone: string;
      company: string;
    }) {
      return request<{ ok: true; profile: CustomerDashboardResponse["profile"] }>("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    getAdminDashboard() {
      return request<AdminDashboardResponse>("/api/admin/dashboard", { method: "GET" });
    },
    cancelAdminBooking(bookingId: string) {
      return request<{ ok: true; booking: AdminDashboardResponse["bookings"][number] }>(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
        { method: "POST" }
      );
    },
    refundAdminBooking(bookingId: string) {
      return request<{
        ok: true;
        booking: AdminDashboardResponse["bookings"][number];
        refund: { id: string; status: string | null; amount: number; currency: string | null };
      }>(`/api/admin/bookings/${encodeURIComponent(bookingId)}/refund`, { method: "POST" });
    },
    getAdminCatalog() {
      return request<AdminCatalogResponse>("/api/admin/catalog", { method: "GET" });
    },
    updatePricing(payload: AdminCatalogResponse["bookingPrices"]) {
      return request<{ ok: true; bookingPrices: AdminCatalogResponse["bookingPrices"] }>("/api/admin/catalog/pricing", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    createPackage(payload: {
      active?: boolean;
      highlight?: boolean;
      order?: number;
      translations: AdminCatalogPackage["translations"];
    }) {
      return request<{ ok: true; package: AdminCatalogPackage }>("/api/admin/catalog/packages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    updatePackage(packageId: string, payload: Partial<AdminCatalogPackage>) {
      return request<{ ok: true; package: AdminCatalogPackage }>(
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
