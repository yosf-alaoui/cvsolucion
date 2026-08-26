import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import {
  LOAD_EXTERNAL_ANALYTICS_EVENT,
  isDoNotTrackEnabled,
  loadExternalAnalytics,
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from "@/lib/analytics";
import {
  finishVisitorSession,
  recordVisitorPage,
  trackVisitorInteraction,
  trackVisitorPage,
} from "@/lib/visitorTracking";
import {
  hasSensitiveAnalyticsParameters,
  hasSensitiveAnalyticsUrl,
  sanitizeAnalyticsLocation,
  sanitizeAnalyticsReferrer,
} from "@shared/analyticsPrivacy";

function getNavigationType() {
  if (
    typeof performance === "undefined" ||
    typeof performance.getEntriesByType !== "function"
  ) {
    return null;
  }
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type || null;
}

/**
 * Optional analytics loader + first-party visitor tracking.
 *
 * External analytics:
 * - Google Tag Manager via VITE_GTM_ID (the ID enables it automatically)
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
  const { user, isAdmin, loading } = useAuth();
  const lastExternalPageKey = useRef<string | null>(null);
  const sensitiveLocation =
    hasSensitiveAnalyticsParameters(window.location) ||
    hasSensitiveAnalyticsUrl(document.referrer);
  const excludedFromTracking =
    loading ||
    sensitiveLocation ||
    isAdmin ||
    user?.role === "admin" ||
    window.location.hostname.toLowerCase().startsWith("admin.") ||
    window.location.pathname.startsWith("/admin");

  useEffect(() => {
    if (excludedFromTracking || isDoNotTrackEnabled()) return;

    let loaded = false;
    let timer = 0;
    const triggerLoad = () => {
      if (loaded) return;
      loaded = true;
      window.clearTimeout(timer);
      window.removeEventListener("load", scheduleLoad);
      window.removeEventListener(LOAD_EXTERNAL_ANALYTICS_EVENT, triggerLoad);
      loadExternalAnalytics();
    };
    const scheduleLoad = () => {
      if (loaded) return;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      timer = window.setTimeout(triggerLoad, mobile ? 15000 : 8000);
    };

    window.addEventListener(LOAD_EXTERNAL_ANALYTICS_EVENT, triggerLoad, {
      once: true,
    });

    if (document.readyState === "complete") {
      scheduleLoad();
    } else {
      window.addEventListener("load", scheduleLoad, { once: true });
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", scheduleLoad);
      window.removeEventListener(LOAD_EXTERNAL_ANALYTICS_EVENT, triggerLoad);
    };
  }, [excludedFromTracking]);

  useEffect(() => {
    if (excludedFromTracking || isDoNotTrackEnabled()) return;

    const rawSearch = window.location.search || "";
    const safeLocation = sanitizeAnalyticsLocation(window.location);
    const safeReferrer = sanitizeAnalyticsReferrer(document.referrer);
    const params = new URLSearchParams(rawSearch.replace(/^\?/, ""));
    const campaign = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
      gclid: params.get("gclid"),
      fbclid: params.get("fbclid"),
      msclkid: params.get("msclkid"),
      ttclid: params.get("ttclid"),
      li_fat_id: params.get("li_fat_id"),
      wbraid: params.get("wbraid"),
      gbraid: params.get("gbraid"),
    };

    const session = recordVisitorPage(safeLocation.pathname);
    // Seo updates document.title in a React effect. Deferring one task keeps
    // analytics aligned with the new route instead of the previous page.
    const trackingTimer = window.setTimeout(() => {
      const pageKey = safeLocation.path;
      const isNewPage = lastExternalPageKey.current !== pageKey;
      lastExternalPageKey.current = pageKey;

      if (isNewPage) {
        trackAnalyticsPageView({
          page_title: document.title,
          page_path: safeLocation.pathname,
          page_location: safeLocation.href,
          page_search: safeLocation.search,
          page_referrer: safeReferrer,
          locale,
          user_status: user ? "registered" : "anonymous",
          ...campaign,
        });
      }

      void trackVisitorPage(
        {
          path: safeLocation.pathname,
          search: safeLocation.search,
          locale,
          title: document.title,
          referrer: safeReferrer,
          browserLanguage: navigator.language || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
          navigationType: getNavigationType(),
          userId: user?.id ?? null,
          sessionId: session.id,
          ...campaign,
        },
        session,
      );
    }, 0);

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trackedElement = target?.closest<HTMLElement>(
        'a, button[data-track="cta"], button[data-cta="true"], [data-track="cta"], [data-cta="true"]',
      );
      if (!trackedElement) return;

      const link = trackedElement.closest("a") as HTMLAnchorElement | null;
      const href = link?.href || null;
      const safeHref = href ? sanitizeAnalyticsReferrer(href) : null;
      let linkDomain: string | null = null;
      if (safeHref) {
        try {
          linkDomain = new URL(safeHref).hostname || null;
        } catch {
          linkDomain = null;
        }
      }
      const label =
        (trackedElement.textContent || "").trim().slice(0, 140) || null;
      const externalLink = safeHref ? { link_url: safeHref } : {};
      const visitorLink = safeHref ? { href: safeHref } : {};

      if (href && /wa\.me|whatsapp/i.test(href)) {
        trackAnalyticsEvent("whatsapp_click", {
          contact_method: "whatsapp",
          link_domain: linkDomain,
          link_text: label,
          page_path: safeLocation.pathname,
          locale,
        });
        trackVisitorInteraction({
          type: "whatsapp_click",
          path: safeLocation.pathname,
          label,
          sessionId: session.id,
        });
      } else if (href?.startsWith("mailto:")) {
        trackAnalyticsEvent("email_click", {
          contact_method: "email",
          link_text: label,
          page_path: safeLocation.pathname,
          locale,
        });
        trackVisitorInteraction({
          type: "email_click",
          path: safeLocation.pathname,
          ...visitorLink,
          label,
          sessionId: session.id,
        });
      } else if (
        trackedElement.dataset.cta === "true" ||
        trackedElement.getAttribute("data-track") === "cta"
      ) {
        trackAnalyticsEvent("cta_click", {
          ...externalLink,
          link_text: label,
          page_path: safeLocation.pathname,
          locale,
        });
        trackVisitorInteraction({
          type: "cta_click",
          path: safeLocation.pathname,
          ...visitorLink,
          label,
          sessionId: session.id,
        });
      }
    };

    const pageHideHandler = () => {
      finishVisitorSession(safeLocation.pathname);
    };

    document.addEventListener("click", clickHandler, true);
    window.addEventListener("pagehide", pageHideHandler);

    return () => {
      window.clearTimeout(trackingTimer);
      document.removeEventListener("click", clickHandler, true);
      window.removeEventListener("pagehide", pageHideHandler);
    };
  }, [location, locale, user?.id, excludedFromTracking]);

  return null;
}
