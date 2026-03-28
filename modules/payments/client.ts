import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  CreatePaymentIntentPayload,
  PaymentConfigResponse,
  PaymentIntentResponse,
} from "./contracts";

type CreatePaymentsModuleClientOptions = JsonHttpClientOptions & {
  configPath?: string;
  intentPath?: string;
};

export function createPaymentsModuleClient(options: CreatePaymentsModuleClientOptions = {}) {
  const request = createJsonHttpClient(options);
  const configPath = options.configPath || "/api/stripe/config";
  const intentPath = options.intentPath || "/api/payments/intents";

  return {
    getConfig() {
      return request<PaymentConfigResponse>(configPath, { method: "GET" });
    },
    createPaymentIntent(payload: CreatePaymentIntentPayload) {
      return request<PaymentIntentResponse>(intentPath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
