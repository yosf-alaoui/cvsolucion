export const CONTACT_EMAIL = "contact@cvsolucion.com";
export const WHATSAPP_PHONE = "+1 438 807 8747";

export function getBookingHref() {
  const configured = (import.meta.env.VITE_BOOKING_URL as string | undefined)?.trim();
  if (configured) return configured;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Book a Cabinet Vision consultation")}`;
}

export function getContactMailHref(subject?: string) {
  if (!subject) return `mailto:${CONTACT_EMAIL}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
