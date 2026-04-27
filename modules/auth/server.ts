import type {
  AuthForgotPasswordPayload,
  AuthLoginPayload,
  AuthResetPasswordPayload,
  AuthSignupPayload,
} from "./contracts";

export type AuthSessionCookieOptions = {
  cookieName?: string;
  path?: string;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  maxAgeSeconds?: number;
};

function requireValue(value: unknown, message: string) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

export function normalizeAuthEmail(email: string) {
  return requireValue(email, "Email is required.").toLowerCase();
}

export function normalizeAuthLocale(locale: string, fallback = "en") {
  const normalized = String(locale || "").trim().toLowerCase();
  return normalized || fallback;
}

export function validateAuthLoginPayload(payload: AuthLoginPayload): AuthLoginPayload {
  return {
    email: normalizeAuthEmail(payload.email),
    password: requireValue(payload.password, "Password is required."),
  };
}

export function validateAuthSignupPayload(
  payload: AuthSignupPayload,
  options: { requireLocale?: boolean } = {}
): AuthSignupPayload {
  const locale = normalizeAuthLocale(payload.locale);
  if (options.requireLocale && !locale) {
    throw new Error("Locale is required.");
  }

  return {
    email: normalizeAuthEmail(payload.email),
    password: requireValue(payload.password, "Password is required."),
    locale,
  };
}

export function validateForgotPasswordPayload(
  payload: AuthForgotPasswordPayload
): AuthForgotPasswordPayload {
  return {
    email: normalizeAuthEmail(payload.email),
    locale: normalizeAuthLocale(payload.locale),
  };
}

export function validateResetPasswordPayload(
  payload: AuthResetPasswordPayload
): AuthResetPasswordPayload {
  return {
    token: requireValue(payload.token, "Reset token is required."),
    password: requireValue(payload.password, "Password is required."),
  };
}

export function createAuthSessionCookieOptions(
  options: AuthSessionCookieOptions = {}
) {
  return {
    cookieName: options.cookieName || "session",
    path: options.path || "/",
    secure: options.secure ?? true,
    sameSite: options.sameSite || "lax",
    maxAgeSeconds:
      Number.isInteger(options.maxAgeSeconds) && Number(options.maxAgeSeconds) > 0
        ? Number(options.maxAgeSeconds)
        : 60 * 60 * 24 * 30,
  };
}
