import type { I18nModuleContext, I18nModuleOptions, Locale, TranslationTree } from "./contracts";

export function getLocaleFromPath(path: string): Locale {
  if (path === "/fr" || path.startsWith("/fr/")) return "fr";
  if (path === "/ar" || path.startsWith("/ar/")) return "ar";
  return "en";
}

export function normalizePathWithoutLocale(path: string) {
  if (path === "/fr" || path === "/ar") return "/";
  if (path.startsWith("/fr/")) return path.replace(/^\/fr/, "") || "/";
  if (path.startsWith("/ar/")) return path.replace(/^\/ar/, "") || "/";
  return path;
}

export function buildPathWithLocale(path: string, locale: Locale) {
  const clean = normalizePathWithoutLocale(path);
  if (locale === "fr") {
    return clean === "/" ? "/fr" : `/fr${clean}`;
  }
  if (locale === "ar") {
    return clean === "/" ? "/ar" : `/ar${clean}`;
  }
  return clean;
}

function getByPath(obj: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, obj);
}

export function createI18nModule<TContent extends TranslationTree>(
  options: I18nModuleOptions<TContent>
) {
  const fallbackLocale = options.fallbackLocale || "en";

  return {
    getLocaleFromPath,
    normalizePathWithoutLocale,
    buildPathWithLocale,
    createContext(pathname: string): I18nModuleContext<TContent> {
      const locale = getLocaleFromPath(pathname);
      const content = options.translations[locale];

      return {
        locale,
        content,
        t(key: string) {
          return (
            getByPath(content, key) ??
            getByPath(options.translations[fallbackLocale], key) ??
            key
          );
        },
        normalizePathWithoutLocale,
        buildPathWithLocale,
      };
    },
  };
}

export function buildWhatsAppLink(phoneE164: string, message: string) {
  const clean = phoneE164.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
