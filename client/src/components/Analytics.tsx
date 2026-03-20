import { useEffect } from "react";

/**
 * Optional analytics loader.
 *
 * Supports:
 * - Google Analytics 4 (GA4) via VITE_GA4_ID (e.g. "G-XXXXXXXXXX")
 * - Umami (self-hosted or umami.is) via:
 *   - VITE_UMAMI_URL (e.g. "https://analytics.cvsolucion.com" or "https://umami.is")
 *   - VITE_UMAMI_WEBSITE_ID
 *
 * Backward-compat (older env names):
 * - VITE_ANALYTICS_ENDPOINT  (treated as VITE_UMAMI_URL)
 * - VITE_ANALYTICS_WEBSITE_ID (treated as VITE_UMAMI_WEBSITE_ID)
 *
 * Privacy note:
 * - If the user has "Do Not Track" enabled, we skip analytics.
 */
export default function Analytics() {
  useEffect(() => {
    // Respect Do Not Track
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" || (window as any).doNotTrack === "1");
    if (dnt) return;

    // --- GA4 ---
    const ga4Id = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim();
    if (ga4Id) {
      // Avoid injecting twice
      if (!document.querySelector(`script[data-ga4-id="${ga4Id}"]`)) {
        const gaScript = document.createElement("script");
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
        gaScript.setAttribute("data-ga4-id", ga4Id);
        document.head.appendChild(gaScript);

        // Init gtag
        (window as any).dataLayer = (window as any).dataLayer || [];
        const gtag = (...args: any[]) => {
          (window as any).dataLayer.push(args);
        };
        (window as any).gtag = gtag;
        gtag("js", new Date());

        // Disable ad personalization signals by default (safer for a service site)
        gtag("config", ga4Id, {
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
    }

    // --- Umami ---
    const umamiUrl = (
      (import.meta.env.VITE_UMAMI_URL as string | undefined) ||
      (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)
    )?.trim();
    const umamiWebsiteId = (
      (import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) ||
      (import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined)
    )?.trim();

    if (umamiUrl && umamiWebsiteId) {
      // Umami's default script is /script.js
      const base = umamiUrl.replace(/\/+$/, "");
      const src = base.endsWith(".js") ? base : `${base}/script.js`;

      if (!document.querySelector(`script[data-website-id="${umamiWebsiteId}"]`)) {
        const s = document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = src;
        s.setAttribute("data-website-id", umamiWebsiteId);
        document.head.appendChild(s);
      }
    }
  }, []);

  return null;
}
