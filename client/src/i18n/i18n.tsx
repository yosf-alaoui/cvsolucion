import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { translations, Locale } from "./translations";

type I18nContextValue = {
  locale: Locale;
  t: (key: string) => any;
  content: any;
  toggleLocalePath: (currentHash?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getLocaleFromPath(path: string): Locale {
  if (path === "/fr" || path.startsWith("/fr/")) return "fr";
  if (path === "/ar" || path.startsWith("/ar/")) return "ar";
  return "en";
}

function normalizePathWithoutLocale(path: string): string {
  if (path === "/fr" || path === "/ar") return "/";
  if (path.startsWith("/fr/")) return path.replace(/^\/fr/, "") || "/";
  if (path.startsWith("/ar/")) return path.replace(/^\/ar/, "") || "/";
  return path;
}

function buildPathWithLocale(path: string, locale: Locale): string {
  const clean = normalizePathWithoutLocale(path);
  if (locale === "fr") {
    return clean === "/" ? "/fr" : `/fr${clean}`;
  }
  if (locale === "ar") {
    return clean === "/" ? "/ar" : `/ar${clean}`;
  }
  // English default on root
  return clean;
}

function getByPath(obj: any, key: string) {
  return key.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const locale = useMemo(() => getLocaleFromPath(location), [location]);

  const content = translations[locale];

  const t = useMemo(() => {
    return (key: string) => {
      const v = getByPath(content, key);
      const fallback = getByPath(translations.en, key);
      return v ?? fallback ?? key;
    };
  }, [content]);

  // Set <html lang="..."> + direction for accessibility/SEO
  // + Load Arabic font only when locale === "ar" (Cairo)
  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";

      // Load Cairo only for Arabic to avoid slowing EN/FR
      if (locale === "ar") {
        Promise.all([
          import("@fontsource/cairo/400.css"),
          import("@fontsource/cairo/500.css"),
          import("@fontsource/cairo/700.css"),
        ]).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [locale]);

  // Basic meta title/description
  useEffect(() => {
    try {
      if (content?.meta?.title) document.title = content.meta.title;
      const desc = content?.meta?.description;
      if (desc) {
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "description";
          document.head.appendChild(meta);
        }
        meta.content = desc;
      }

      // hreflang alternates (best-effort for SPA)
      const existing = Array.from(document.head.querySelectorAll('link[data-i18n="alt"]'));
      existing.forEach((el) => el.remove());

      const origin = window.location.origin;
      const basePath = normalizePathWithoutLocale(window.location.pathname);
      const enUrl = origin + buildPathWithLocale(basePath, "en");
      const frUrl = origin + buildPathWithLocale(basePath, "fr");
      const arUrl = origin + buildPathWithLocale(basePath, "ar");

      const mk = (hreflang: string, href: string) => {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.setAttribute("data-i18n", "alt");
        link.hreflang = hreflang;
        link.href = href;
        document.head.appendChild(link);
      };

      mk("en", enUrl);
      mk("fr", frUrl);
      mk("ar", arUrl);
      mk("x-default", enUrl);
    } catch {
      // ignore
    }
  }, [locale, content]);

  const toggleLocalePath = useMemo(() => {
    return (currentHash?: string) => {
      const base = normalizePathWithoutLocale(location);
      const nextLocale: Locale = locale === "en" ? "fr" : locale === "fr" ? "ar" : "en";
      const nextPath = buildPathWithLocale(base, nextLocale);
      return currentHash ? `${nextPath}${currentHash}` : nextPath;
    };
  }, [location, locale]);

  const value: I18nContextValue = { locale, t, content, toggleLocalePath };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function buildWhatsAppLink(phoneE164: string, message: string) {
  const clean = phoneE164.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
