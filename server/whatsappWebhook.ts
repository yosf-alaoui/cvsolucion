import crypto from "crypto";

type WhatsAppWebhookConfig = {
  appSecret: string;
  businessAccountId: string;
  phoneNumberId: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

export function getWhatsAppWebhookConfig(
  env: NodeJS.ProcessEnv = process.env,
): WhatsAppWebhookConfig {
  return {
    appSecret: clean(env.WHATSAPP_APP_SECRET),
    businessAccountId: clean(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    phoneNumberId: clean(env.WHATSAPP_PHONE_NUMBER_ID),
  };
}

export function isWhatsAppIntegrationConfigured(
  env: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(
    clean(env.WHATSAPP_ACCESS_TOKEN) ||
      clean(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) ||
      clean(env.WHATSAPP_PHONE_NUMBER_ID) ||
      clean(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
  );
}

export function assertWhatsAppWebhookConfiguration(
  env: NodeJS.ProcessEnv = process.env,
) {
  const config = getWhatsAppWebhookConfig(env);
  if (env.NODE_ENV !== "production" || !isWhatsAppIntegrationConfigured(env)) {
    return Boolean(
      config.appSecret && config.businessAccountId && config.phoneNumberId,
    );
  }

  const missing = [
    !config.businessAccountId ? "WHATSAPP_BUSINESS_ACCOUNT_ID" : null,
    !config.phoneNumberId ? "WHATSAPP_PHONE_NUMBER_ID" : null,
    !clean(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)
      ? "WHATSAPP_WEBHOOK_VERIFY_TOKEN"
      : null,
    !clean(env.WHATSAPP_ACCESS_TOKEN) ? "WHATSAPP_ACCESS_TOKEN" : null,
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `WhatsApp integration is enabled but required webhook settings are missing: ${missing.join(
        ", ",
      )}`,
    );
  }

  // The application may remain available without the optional inbound
  // webhook credential, but POST events still fail closed in
  // verifyMetaWebhookSignature until the real Meta app secret is configured.
  return Boolean(config.appSecret);
}

export function verifyMetaWebhookSignature(
  signatureHeader: string,
  payload: Buffer,
  appSecret = getWhatsAppWebhookConfig().appSecret,
) {
  // A missing secret is a configuration failure, never permission to bypass
  // authenticity checks.
  if (!appSecret) return false;

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader);
  if (!match) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest();
  const actual = Buffer.from(match[1], "hex");

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function validateWhatsAppWebhookTarget(
  body: unknown,
  config = getWhatsAppWebhookConfig(),
) {
  if (!config.businessAccountId || !config.phoneNumberId) return false;
  if (!body || typeof body !== "object") return false;

  const payload = body as {
    object?: unknown;
    entry?: Array<{
      id?: unknown;
      changes?: Array<{ value?: { metadata?: { phone_number_id?: unknown } } }>;
    }>;
  };
  if (payload.object !== "whatsapp_business_account") return false;
  if (!Array.isArray(payload.entry) || payload.entry.length === 0) return false;

  return payload.entry.every((entry) => {
    if (clean(entry?.id) !== config.businessAccountId) return false;
    if (!Array.isArray(entry?.changes) || entry.changes.length === 0) return false;
    return entry.changes.every(
      (change) =>
        clean(change?.value?.metadata?.phone_number_id) === config.phoneNumberId,
    );
  });
}
