import { trackAnalyticsEvent, trackFunnelEvent } from "@/lib/analytics";
import { sanitizeAnalyticsLocation } from "@shared/analyticsPrivacy";
import { withCsrfHeaders } from "@/lib/csrf";

type CampaignEventName =
  | "ViewContent"
  | "CTA_Click"
  | "Form_Start"
  | "Form_Submit"
  | "Email_Verification_Required"
  | "Country_Autofill"
  | "Lead"
  | "Contact"
  | "Scroll_50"
  | "Scroll_90";

export function trackCampaignEvent(
  event: CampaignEventName,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const location = sanitizeAnalyticsLocation(window.location);
  // Keep legacy GTM/Meta trigger names while using GA4-friendly names when
  // events are sent directly to GA.
  const normalizedEvent: Record<CampaignEventName, string> = {
    ViewContent: "view_item",
    CTA_Click: "select_content",
    Form_Start: "form_start",
    Form_Submit: "form_submit",
    Email_Verification_Required: "email_verification_required",
    Country_Autofill: "country_autofill",
    Lead: "generate_lead",
    Contact: "contact",
    Scroll_50: "scroll_50",
    Scroll_90: "scroll_90",
  };
  const eventParams = {
    legacy_event_name: event,
    page_path: location.pathname,
    page_location: location.href,
    ...params,
  };
  if (
    event === "Form_Start" ||
    event === "Form_Submit" ||
    event === "Email_Verification_Required" ||
    event === "Lead" ||
    event === "Contact"
  ) {
    return trackFunnelEvent(normalizedEvent[event], eventParams, {
      gtmEventName: event,
    });
  }
  return trackAnalyticsEvent(normalizedEvent[event], eventParams, {
    gtmEventName: event,
  });
}

export async function consumeServerCareerConversion() {
  const init: RequestInit = {
    method: "POST",
    credentials: "include",
    body: "{}",
  };
  const response = await fetch("/api/contact/career-conversion", {
    ...init,
    headers: withCsrfHeaders(init, { "Content-Type": "application/json" }),
  });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    confirmed?: boolean;
    leadId?: string | null;
  } | null;
  return data?.confirmed && data.leadId ? data.leadId : null;
}
