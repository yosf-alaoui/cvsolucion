import Stripe from "stripe";
import type {
  CreatePaymentIntentPayload,
  PaymentConfigResponse,
  PaymentLineItem,
  PaymentTotals,
} from "./contracts";

export type CreateStripePaymentsModuleOptions = {
  secretKey?: string | null;
  publishableKey?: string | null;
  webhookSecret?: string | null;
  currency?: string;
};

function computeLineItemTotal(item: Omit<PaymentLineItem, "totalAmount">) {
  return item.quantity * item.unitAmount;
}

export function calculateOrderTotals(
  lineItems: Array<Omit<PaymentLineItem, "totalAmount">>,
  taxRate = 0
): PaymentTotals {
  const subtotal = lineItems.reduce((sum, item) => sum + computeLineItemTotal(item), 0);
  const taxes = Math.round(subtotal * taxRate);
  return {
    subtotal,
    taxes,
    total: subtotal + taxes,
  };
}

export function createStripePaymentsModule(options: CreateStripePaymentsModuleOptions) {
  const stripe =
    options.secretKey && options.secretKey.trim()
      ? new Stripe(options.secretKey.trim())
      : null;
  const currency = (options.currency || "cad").toLowerCase();

  return {
    isConfigured() {
      return Boolean(stripe && options.publishableKey?.trim());
    },
    getConfig(): PaymentConfigResponse {
      return {
        enabled: Boolean(stripe && options.publishableKey?.trim()),
        publishableKey: options.publishableKey?.trim() || null,
        currency,
      };
    },
    async createPaymentIntent(payload: CreatePaymentIntentPayload) {
      if (!stripe) {
        throw new Error("Stripe is not configured.");
      }

      const total =
        payload.lineItems?.length
          ? payload.lineItems.reduce((sum, item) => sum + item.totalAmount, 0)
          : payload.amount || 0;

      if (!total || total < 1) {
        throw new Error("Payment amount must be greater than zero.");
      }

      const intent = await stripe.paymentIntents.create({
        amount: total,
        currency: payload.currency?.toLowerCase() || currency,
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: payload.email || undefined,
        metadata: payload.metadata || {},
      });

      if (!intent.client_secret) {
        throw new Error("Stripe did not return a client secret.");
      }

      return {
        ok: true as const,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
      };
    },
    async verifySuccessfulPayment(input: {
      paymentIntentId: string;
      expectedAmount: number;
      expectedCurrency?: string;
      metadata?: Record<string, string>;
    }) {
      if (!stripe) {
        throw new Error("Stripe is not configured.");
      }

      const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
      if (!intent || intent.status !== "succeeded") {
        throw new Error("Payment has not been completed.");
      }

      if (intent.amount !== input.expectedAmount) {
        throw new Error("Payment amount does not match.");
      }

      if ((input.expectedCurrency || currency).toLowerCase() !== intent.currency.toLowerCase()) {
        throw new Error("Payment currency does not match.");
      }

      if (input.metadata) {
        for (const [key, value] of Object.entries(input.metadata)) {
          if (intent.metadata?.[key] !== value) {
            throw new Error(`Payment metadata mismatch for ${key}.`);
          }
        }
      }

      return intent;
    },
    constructWebhookEvent(payload: Buffer, signature: string) {
      if (!stripe || !options.webhookSecret?.trim()) {
        throw new Error("Stripe webhook is not configured.");
      }

      return stripe.webhooks.constructEvent(payload, signature, options.webhookSecret.trim());
    },
  };
}
