import type { InvoiceSummary } from "./contracts";

export function createInvoicesModuleClient(baseUrl = "") {
  return {
    listCustomerInvoices: async () => {
      const response = await fetch(`${baseUrl}/api/customer/dashboard`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load customer invoices.");
      }
      const data = (await response.json()) as { invoices?: InvoiceSummary[] };
      return data.invoices ?? [];
    },
  };
}
