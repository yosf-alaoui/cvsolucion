export const CONTACT_EMAIL = "contact@cvsolucion.com";
export const WHATSAPP_PHONE = "+1 438 807 8747";

function localePrefix(locale: "en" | "fr" | "ar") {
  if (locale === "fr") return "/fr";
  if (locale === "ar") return "/ar";
  return "";
}

export function getBookingHref(locale: "en" | "fr" | "ar" = "en") {
  const configured = (import.meta.env.VITE_BOOKING_URL as string | undefined)?.trim();
  if (configured) return configured;
  if (locale === "fr") return "/fr/book";
  if (locale === "ar") return "/ar/book";
  return "/book";
}

export function getContactMailHref(subject?: string) {
  if (!subject) return `mailto:${CONTACT_EMAIL}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function isDesignerWorkspaceHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase().startsWith("designer.");
}

export function getDesignerDashboardHref(locale: "en" | "fr" | "ar" = "en") {
  const prefix = localePrefix(locale);
  if (typeof window === "undefined") {
    return `${prefix}/designer`;
  }

  const hostname = window.location.hostname.toLowerCase();
  const path = `${prefix}/dashboard`;

  if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname)) {
    return `${prefix}/designer`;
  }

  if (hostname.startsWith("designer.")) {
    return path;
  }

  return `https://designer.cvsolucion.com${path}`;
}

export function getAccountDashboardHref(locale: "en" | "fr" | "ar", role?: "customer" | "designer" | "trainer" | "admin" | null) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "designer") {
    return getDesignerDashboardHref(locale);
  }
  const prefix = localePrefix(locale);
  return `${prefix}/dashboard`;
}
