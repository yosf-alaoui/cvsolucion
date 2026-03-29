export type InvoiceStatus = "issued";

export type InvoiceSummary = {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: string;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  serviceType: "consultation" | "support";
  priority: "standard" | "express";
  date: string;
  hour: number;
  downloadUrl: string;
};
