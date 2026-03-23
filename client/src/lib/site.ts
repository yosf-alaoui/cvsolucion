export const CONTACT_EMAIL = "contact@cvsolucion.com";
export const WHATSAPP_PHONE = "+1 438 807 8747";

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
