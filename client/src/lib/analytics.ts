import {
  hasSensitiveAnalyticsParameters,
  hasSensitiveAnalyticsUrl,
  sanitizeAnalyticsLocation,
  sanitizeAnalyticsReferrer,
} from "@shared/analyticsPrivacy";
import { trackVisitorFunnelEvent } from "@/lib/visitorTracking";

export const LOAD_EXTERNAL_ANALYTICS_EVENT =
  "cvsolucion:load-external-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __cvsolucionGa4Configured?: Record<string, boolean>;
  doNotTrack?: string;
};

export type AnalyticsEventParams = Record<string, unknown>;

export type FunnelEventName =
  | "view_item"
  | "select_content"
  | "form_start"
  | "form_submit"
  | "email_verification_required"
  | "generate_lead"
  | "contact"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | (string & {});

function getAnalyticsWindow() {
  if (typeof window === "undefined") return null;
  return window as AnalyticsWindow;
}

function isSensitiveAnalyticsPage() {
  return (
    typeof window !== "undefined" &&
    (hasSensitiveAnalyticsParameters(window.location) ||
      (typeof document !== "undefined" &&
        hasSensitiveAnalyticsUrl(document.referrer)))
  );
}

export function isDoNotTrackEnabled() {
  if (typeof navigator === "undefined") return false;
  const analyticsWindow = getAnalyticsWindow();
  return navigator.doNotTrack === "1" || analyticsWindow?.doNotTrack === "1";
}

/**
 * Providing a container ID enables GTM. VITE_ENABLE_GTM is intentionally not
 * consulted: older deployments commonly left that legacy flag set to false,
 * which silently disabled an otherwise valid VITE_GTM_ID.
 */
export function getConfiguredGtmId() {
  return (import.meta.env.VITE_GTM_ID as string | undefined)?.trim() || "";
}

export function getConfiguredGa4Id() {
  return (import.meta.env.VITE_GA4_ID as string | undefined)?.trim() || "";
}

function ensureGtm(gtmId: string) {
  const analyticsWindow = getAnalyticsWindow();
  if (!analyticsWindow || typeof document === "undefined") return false;

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  const encodedId = encodeURIComponent(gtmId);
  const alreadyLoaded =
    !!document.querySelector(`script[data-gtm-id="${gtmId}"]`) ||
    !!document.querySelector(
      `script[src*="googletagmanager.com/gtm.js?id=${encodedId}"]`,
    );

  if (!alreadyLoaded) {
    analyticsWindow.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodedId}`;
    script.setAttribute("data-gtm-id", gtmId);
    document.head.appendChild(script);
  }

  return true;
}

function ensureGtag(ga4Id: string) {
  const analyticsWindow = getAnalyticsWindow();
  if (!analyticsWindow || typeof document === "undefined") return null;

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  if (!analyticsWindow.gtag) {
    analyticsWindow.gtag = (...args: unknown[]) => {
      analyticsWindow.dataLayer!.push(args);
    };
  }

  const encodedId = encodeURIComponent(ga4Id);
  const alreadyLoaded =
    !!document.querySelector(`script[data-ga4-id="${ga4Id}"]`) ||
    !!document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${encodedId}"]`,
    );

  if (!alreadyLoaded) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodedId}`;
    script.setAttribute("data-ga4-id", ga4Id);
    document.head.appendChild(script);
  }

  analyticsWindow.__cvsolucionGa4Configured =
    analyticsWindow.__cvsolucionGa4Configured || {};
  if (!analyticsWindow.__cvsolucionGa4Configured[ga4Id]) {
    analyticsWindow.__cvsolucionGa4Configured[ga4Id] = true;
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", ga4Id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false,
    });
  }

  return analyticsWindow.gtag;
}

function ensureGoogleAnalytics() {
  const gtmId = getConfiguredGtmId();
  if (gtmId) return ensureGtm(gtmId);

  const ga4Id = getConfiguredGa4Id();
  if (!ga4Id) return false;
  return Boolean(ensureGtag(ga4Id));
}

function ensureUmami() {
  if (typeof document === "undefined") return;
  const url = (
    (import.meta.env.VITE_UMAMI_URL as string | undefined) ||
    (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)
  )?.trim();
  const websiteId = (
    (import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) ||
    (import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined)
  )?.trim();
  if (!url || !websiteId) return;
  if (document.querySelector(`script[data-website-id="${websiteId}"]`)) {
    return;
  }

  const base = url.replace(/\/+$/, "");
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = base.endsWith(".js") ? base : `${base}/script.js`;
  script.setAttribute("data-website-id", websiteId);
  document.head.appendChild(script);
}

function ensureAhrefs() {
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-ahrefs-analytics]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://analytics.ahrefs.com/analytics.js";
  script.setAttribute("data-key", "iABZcinu8y6HV7To3tLfIA");
  script.setAttribute("data-ahrefs-analytics", "true");
  document.head.appendChild(script);
}

/** Load all configured external analytics providers exactly once. */
export function loadExternalAnalytics() {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    isDoNotTrackEnabled() ||
    isSensitiveAnalyticsPage()
  ) {
    return false;
  }

  const googleLoaded = ensureGoogleAnalytics();
  ensureUmami();
  ensureAhrefs();
  return googleLoaded;
}

function notifyAnalyticsLoader() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOAD_EXTERNAL_ANALYTICS_EVENT));
}

/**
 * Send a funnel/custom event through GTM, or directly through GA4 when no GTM
 * container is configured. Calling this function also starts the provider
 * immediately, so the queued event cannot be stranded behind the lazy loader.
 */
export function trackAnalyticsEvent(
  name: string,
  params: AnalyticsEventParams = {},
  options: { gtmEventName?: string } = {},
) {
  if (
    !name ||
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    isDoNotTrackEnabled() ||
    isSensitiveAnalyticsPage()
  ) {
    return false;
  }

  const providerReady = ensureGoogleAnalytics();
  notifyAnalyticsLoader();
  if (!providerReady) return false;

  const gtmId = getConfiguredGtmId();
  const analyticsWindow = getAnalyticsWindow()!;
  const safeLocation = sanitizeAnalyticsLocation(window.location);
  const safeParams = {
    ...params,
    page_location: safeLocation.href,
    page_referrer: sanitizeAnalyticsReferrer(document.referrer),
  };
  if (gtmId) {
    analyticsWindow.dataLayer!.push({
      ...safeParams,
      event: options.gtmEventName || name,
      event_name: name,
    });
    return true;
  }

  const ga4Id = getConfiguredGa4Id();
  if (!ga4Id) return false;
  const gtag = ensureGtag(ga4Id);
  if (!gtag) return false;
  gtag("event", name, safeParams);
  return true;
}

/** Public funnel API used by landing, booking, and checkout flows. */
export function trackFunnelEvent(
  name: FunnelEventName,
  params: AnalyticsEventParams = {},
  options: { gtmEventName?: string } = {},
) {
  const firstPartyTracked = trackVisitorFunnelEvent(name, params);
  const externalTracked = trackAnalyticsEvent(name, params, options);
  return firstPartyTracked || externalTracked;
}

export function trackAnalyticsPageView(params: AnalyticsEventParams) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    isDoNotTrackEnabled() ||
    isSensitiveAnalyticsPage()
  ) {
    return false;
  }

  const providerReady = ensureGoogleAnalytics();
  notifyAnalyticsLoader();
  if (!providerReady) return false;

  const gtmId = getConfiguredGtmId();
  const analyticsWindow = getAnalyticsWindow()!;
  if (gtmId) {
    analyticsWindow.dataLayer!.push({
      ...params,
      event: "virtual_pageview",
      event_name: "page_view",
    });
    return true;
  }

  const ga4Id = getConfiguredGa4Id();
  if (!ga4Id) return false;
  const gtag = ensureGtag(ga4Id);
  if (!gtag) return false;
  gtag("event", "page_view", params);
  return true;
}
