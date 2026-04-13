export type PaymentCurrency = string;

export type PaymentLineItem = {
  id: string;
  title: string;
  description?: string | null;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  metadata?: Record<string, string>;
};

export type PaymentTotals = {
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
};

export type PaymentConfigResponse = {
  enabled: boolean;
  publishableKey: string | null;
  currency: PaymentCurrency;
  cardPaymentFeeCents?: number;
};

export type CreatePaymentIntentPayload = {
  amount?: number;
  currency?: PaymentCurrency;
  email?: string | null;
  cardPaymentFeeCents?: number;
  metadata?: Record<string, string>;
  lineItems?: PaymentLineItem[];
};

export type PaymentIntentResponse = {
  ok: true;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: PaymentCurrency;
};

export type ProcessedWebhookEvent = {
  id: string;
  type: string;
  createdAt: string;
};
