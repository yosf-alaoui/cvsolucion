import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
  assertWhatsAppWebhookConfiguration,
  validateWhatsAppWebhookTarget,
  verifyMetaWebhookSignature,
} from "./whatsappWebhook";

describe("WhatsApp webhook protection", () => {
  it("fails closed when the app secret or signature is missing", () => {
    const payload = Buffer.from('{"object":"whatsapp_business_account"}');
    expect(verifyMetaWebhookSignature("", payload, "secret")).toBe(false);
    expect(verifyMetaWebhookSignature("sha256=00", payload, "secret")).toBe(false);
    expect(verifyMetaWebhookSignature("", payload, "")).toBe(false);
  });

  it("accepts only the HMAC of the exact raw request body", () => {
    const secret = "test-app-secret";
    const payload = Buffer.from('{"entry":[{"id":"waba"}]}');
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")}`;

    expect(verifyMetaWebhookSignature(signature, payload, secret)).toBe(true);
    expect(
      verifyMetaWebhookSignature(signature, Buffer.from(`${payload.toString()} `), secret),
    ).toBe(false);
  });

  it("rejects events for a different business account or phone number", () => {
    const config = {
      appSecret: "secret",
      businessAccountId: "waba-1",
      phoneNumberId: "phone-1",
    };
    const event = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba-1",
          changes: [{ value: { metadata: { phone_number_id: "phone-1" } } }],
        },
      ],
    };

    expect(validateWhatsAppWebhookTarget(event, config)).toBe(true);
    expect(
      validateWhatsAppWebhookTarget(
        { ...event, entry: [{ ...event.entry[0], id: "waba-2" }] },
        config,
      ),
    ).toBe(false);
    expect(
      validateWhatsAppWebhookTarget(
        {
          ...event,
          entry: [
            {
              ...event.entry[0],
              changes: [
                { value: { metadata: { phone_number_id: "phone-2" } } },
              ],
            },
          ],
        },
        config,
      ),
    ).toBe(false);
  });

  it("refuses to start a configured production integration with missing secrets", () => {
    expect(() =>
      assertWhatsAppWebhookConfiguration({
        NODE_ENV: "production",
        WHATSAPP_ACCESS_TOKEN: "token",
        WHATSAPP_PHONE_NUMBER_ID: "phone-1",
      }),
    ).toThrow(/WHATSAPP_APP_SECRET/);
  });
});
