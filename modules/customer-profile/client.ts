import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  CustomerProfile,
  CustomerProfileDashboardResponse,
  UpdateCustomerProfilePayload,
} from "./contracts";

export function createCustomerProfileModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    getDashboardProfile() {
      return request<CustomerProfileDashboardResponse>("/api/customer/dashboard", { method: "GET" });
    },
    updateProfile(payload: UpdateCustomerProfilePayload) {
      return request<{ ok: true; profile: CustomerProfile }>("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
  };
}
