const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "reset_token",
  "resettoken",
  "verification_token",
  "verificationtoken",
  "magic_token",
  "magictoken",
  "code",
  "otp",
  "email",
  "phone",
  "phone_number",
  "name",
  "full_name",
  "fullname",
  "first_name",
  "last_name",
  "lead",
  "lead_id",
  "password",
  "secret",
  "signature",
]);

const SAFE_ANALYTICS_QUERY_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
  "li_fat_id",
  "wbraid",
  "gbraid",
  "gtm_debug",
  "priority",
  "service",
  "program",
  "mode",
  "reset",
  "recovery",
  "confirmation",
  "locale",
  "lang",
  "page",
  "category",
  "slug",
  "next",
]);

function isSensitiveKey(key: string) {
  const normalized = key.trim().toLowerCase();
  return (
    SENSITIVE_QUERY_KEYS.has(normalized) ||
    normalized.endsWith("_token") ||
    normalized.endsWith("token")
  );
}

const SENSITIVE_VALUE_PATTERN =
  /(?:^|[?&#/])(token|\w*token|access-token|code|otp|email|phone|password|secret|signature)=/i;

export function hasSensitiveAnalyticsParameters(location: {
  search?: string | null;
  hash?: string | null;
}) {
  const params = new URLSearchParams(
    String(location.search || "").replace(/^\?/, ""),
  );
  let sensitiveQuery = false;
  params.forEach((value, key) => {
    if (isSensitiveKey(key) || SENSITIVE_VALUE_PATTERN.test(value)) {
      sensitiveQuery = true;
    }
  });
  if (sensitiveQuery) return true;

  let hash = String(location.hash || "");
  try {
    hash = decodeURIComponent(hash);
  } catch {
    return true;
  }
  return SENSITIVE_VALUE_PATTERN.test(hash);
}

export function hasSensitiveAnalyticsUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, "https://cvsolucion.invalid");
    return hasSensitiveAnalyticsParameters(url);
  } catch {
    return true;
  }
}

function sanitizeUrl(url: URL) {
  const queryEntries: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => queryEntries.push([key, value]));
  for (const [key, value] of queryEntries) {
    // Wrapper parameters such as `next=/reset?token=...` must be removed as a
    // whole or the nested credential would still reach analytics providers.
    if (
      isSensitiveKey(key) ||
      SENSITIVE_VALUE_PATTERN.test(value) ||
      !SAFE_ANALYTICS_QUERY_KEYS.has(key.trim().toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  // Fragments are unnecessary for conversion reporting and can contain
  // OAuth credentials or user-entered data, so never forward them.
  url.hash = "";

  return url;
}

export function sanitizeAnalyticsLocation(location: {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}) {
  const url = sanitizeUrl(
    new URL(
      `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`,
      location.origin || "https://cvsolucion.invalid",
    ),
  );
  const search = url.search;
  const hash = url.hash;
  const path = `${url.pathname}${search}${hash}`;
  return {
    href: `${url.origin}${path}`,
    pathname: url.pathname,
    search,
    hash,
    path,
  };
}

export function sanitizeAnalyticsReferrer(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return sanitizeUrl(url).toString();
  } catch {
    return null;
  }
}

export function sanitizeAnalyticsPath(
  value: string | null | undefined,
  origin = "https://cvsolucion.invalid",
) {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  try {
    const url = sanitizeUrl(new URL(raw, origin));
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
