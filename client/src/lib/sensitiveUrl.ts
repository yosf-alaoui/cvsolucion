import {
  hasSensitiveAnalyticsParameters,
  sanitizeAnalyticsLocation,
} from "@shared/analyticsPrivacy";

const initialSensitiveUrl =
  typeof window !== "undefined" &&
  hasSensitiveAnalyticsParameters(window.location)
    ? {
        pathname: window.location.pathname,
        search: window.location.search,
      }
    : null;

/**
 * Remove credentials and contact fields from the address bar before any
 * third-party script can inspect Page URL. The original query stays only in
 * this module's closure long enough for the password-recovery form to read it.
 */
export function scrubInitialSensitiveUrl() {
  if (typeof window === "undefined" || !initialSensitiveUrl) return false;
  const safeLocation = sanitizeAnalyticsLocation(window.location);
  window.history.replaceState(
    window.history.state,
    "",
    `${safeLocation.pathname}${safeLocation.search}${safeLocation.hash}`,
  );
  return true;
}

export function getInitialSensitiveSearch() {
  if (
    typeof window === "undefined" ||
    !initialSensitiveUrl ||
    window.location.pathname !== initialSensitiveUrl.pathname
  ) {
    return window.location.search;
  }
  return initialSensitiveUrl.search;
}
