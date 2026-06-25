type CampaignEventName =
  | "ViewContent"
  | "CTA_Click"
  | "Form_Start"
  | "Lead"
  | "Contact"
  | "Scroll_50"
  | "Scroll_90";

type CampaignWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

const LOAD_EXTERNAL_ANALYTICS_EVENT =
  "cvsolucion:load-external-analytics";

export function trackCampaignEvent(
  event: CampaignEventName,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(LOAD_EXTERNAL_ANALYTICS_EVENT));
  const campaignWindow = window as CampaignWindow;
  campaignWindow.dataLayer = campaignWindow.dataLayer || [];
  campaignWindow.dataLayer.push({
    event,
    event_name: event,
    page_path: window.location.pathname,
    page_location: window.location.href,
    ...params,
  });
}

export function markCareerLeadForThankYou(leadId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    "cvsolucion:career-lead",
    JSON.stringify({ leadId, createdAt: Date.now() }),
  );
}

export function consumeCareerLeadForThankYou() {
  if (typeof window === "undefined") return null;
  const key = "cvsolucion:career-lead";
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  window.sessionStorage.removeItem(key);

  try {
    const value = JSON.parse(raw) as {
      leadId?: string;
      createdAt?: number;
    };
    if (
      !value.leadId ||
      !value.createdAt ||
      Date.now() - value.createdAt > 1000 * 60 * 30
    ) {
      return null;
    }
    return value.leadId;
  } catch {
    return null;
  }
}
