export type SectionLocale = "en" | "fr" | "ar";

const PENDING_HOME_SECTION_KEY = "cvsolucion:pending-home-section";

function getHomePath(locale: SectionLocale) {
  return locale === "en" ? "/" : `/${locale}`;
}

export function readPendingHomeSection() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PENDING_HOME_SECTION_KEY);
}

export function clearPendingHomeSection() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_HOME_SECTION_KEY);
}

export function navigateToHomeSection(locale: SectionLocale, sectionId: string) {
  if (typeof window === "undefined") return;

  const homePath = getHomePath(locale);
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const normalizedHomePath = homePath.replace(/\/+$/, "") || "/";

  window.sessionStorage.setItem(PENDING_HOME_SECTION_KEY, sectionId);

  if (currentPath === normalizedHomePath) {
    window.dispatchEvent(new CustomEvent("cvsolucion:scroll-home-section"));
    return;
  }

  window.location.assign(homePath);
}
