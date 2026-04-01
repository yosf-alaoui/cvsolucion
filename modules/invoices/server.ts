export type IssueInvoiceInput = {
  bookingId: string;
  userId: string;
  currency: string;
  unitAmount: number;
  serviceType: "consultation" | "support";
  priority: "standard" | "express";
  date: string;
  hour: number;
  locale: "en" | "fr" | "ar";
  name: string;
  email: string;
  phone: string;
  country: string | null;
  company: string | null;
  paymentReference: string | null;
};

export type InvoicesModuleServer = {
  issueInvoiceForBooking: (input: IssueInvoiceInput) => Promise<unknown> | unknown;
  getInvoiceById: (invoiceId: string) => Promise<unknown> | unknown;
  listInvoicesForUser: (userId: string, email?: string | null) => Promise<unknown[]> | unknown[];
};
