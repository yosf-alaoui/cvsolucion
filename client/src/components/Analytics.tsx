import { useEffect } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Optional analytics loader + first-party visitor tracking.
 *
 * External analytics:
 * - Google Analytics 4 via VITE_GA4_ID
 * - Umami via VITE_UMAMI_URL + VITE_UMAMI_WEBSITE_ID
 *
 * Internal tracking:
 * - Sends route visits to /api/visitor/track so the admin dashboard can show
 *   known and anonymous visitors without depending on GA.
 */
export default function Analytics() {
  const [location] = useLocation();
  const { locale } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" || (window as any).doNotTrack === "1");
    if (dnt) return;

    const ga4Id = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim();
    if (ga4Id && !document.querySelector(`script[data-ga4-id="${ga4Id}"]`)) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
      gaScript.setAttribute("data-ga4-id", ga4Id);
      document.head.appendChild(gaScript);

      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = (...args: any[]) => {
        (window as any).dataLayer.push(args);
      };
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", ga4Id, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    const umamiUrl = (
      (import.meta.env.VITE_UMAMI_URL as string | undefined) ||
      (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)
    )?.trim();
    const umamiWebsiteId = (
      (import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) ||
      (import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined)
    )?.trim();

    if (umamiUrl && umamiWebsiteId && !document.querySelector(`script[data-website-id="${umamiWebsiteId}"]`)) {
      const base = umamiUrl.replace(/\/+$/, "");
      const src = base.endsWith(".js") ? base : `${base}/script.js`;
      const s = document.createElement("script");
      s.async = true;
      s.defer = true;
      s.src = src;
      s.setAttribute("data-website-id", umamiWebsiteId);
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" || (window as any).doNotTrack === "1");
    if (dnt) return;

    const controller = new AbortController();
    fetch("/api/visitor/track", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: window.location.pathname + window.location.search + window.location.hash,
        locale,
        title: document.title,
        referrer: document.referrer || null,
        browserLanguage: navigator.language || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        screen:
          typeof window !== "undefined"
            ? `${window.screen?.width || 0}x${window.screen?.height || 0}`
            : null,
        userId: user?.id ?? null,
      }),
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [location, locale, user?.id]);

  return null;
}
