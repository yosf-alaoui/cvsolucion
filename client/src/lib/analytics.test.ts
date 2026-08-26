import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackAnalyticsPageView, trackFunnelEvent } from "./analytics";
import { trackCampaignEvent } from "./campaignTracking";

type FakeScript = {
  async: boolean;
  defer: boolean;
  src: string;
  attributes: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
};

function installBrowser() {
  const scripts: FakeScript[] = [];
  const createElement = () => {
    const script: FakeScript = {
      async: false,
      defer: false,
      src: "",
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
    };
    return script;
  };
  const querySelector = (selector: string) => {
    const attributeMatch = selector.match(
      /^script\[([a-z0-9-]+)(?:="([^"]+)")?\]$/i,
    );
    if (attributeMatch) {
      const [, name, value] = attributeMatch;
      return (
        scripts.find(
          (script) =>
            name in script.attributes &&
            (value === undefined || script.attributes[name] === value),
        ) || null
      );
    }

    const srcMatch = selector.match(/^script\[src\*="([^"]+)"\]$/);
    if (srcMatch) {
      return scripts.find((script) => script.src.includes(srcMatch[1])) || null;
    }
    return null;
  };

  const analyticsWindow = {
    dataLayer: [] as unknown[],
    location: {
      pathname: "/training/career",
      href: "https://cvsolucion.com/training/career?utm_source=meta",
    },
    dispatchEvent: vi.fn(() => true),
  };
  const fakeDocument = {
    createElement,
    querySelector,
    head: {
      appendChild(script: FakeScript) {
        scripts.push(script);
        return script;
      },
    },
  };

  vi.stubGlobal("window", analyticsWindow);
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("navigator", { doNotTrack: "0" });
  vi.stubGlobal(
    "Event",
    class Event {
      constructor(public type: string) {}
    },
  );

  return { analyticsWindow, scripts };
}

describe("client analytics", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GTM_ID", "");
    vi.stubEnv("VITE_GA4_ID", "");
    vi.stubEnv("VITE_ENABLE_GTM", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads a configured GTM container even when the legacy flag is false", () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST");
    vi.stubEnv("VITE_ENABLE_GTM", "false");
    const { analyticsWindow, scripts } = installBrowser();

    expect(trackFunnelEvent("begin_checkout", { value: 140 })).toBe(true);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain("gtm.js?id=GTM-TEST");
    expect(analyticsWindow.dataLayer).toEqual([
      expect.objectContaining({ event: "gtm.js" }),
      expect.objectContaining({
        event: "begin_checkout",
        event_name: "begin_checkout",
        value: 140,
      }),
    ]);

    trackFunnelEvent("add_to_cart");
    expect(scripts).toHaveLength(1);
  });

  it("queues the first page view while loading GTM immediately", () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST");
    const { analyticsWindow, scripts } = installBrowser();

    expect(trackAnalyticsPageView({ page_path: "/training/career" })).toBe(
      true,
    );
    expect(scripts).toHaveLength(1);
    expect(analyticsWindow.dataLayer).toContainEqual({
      event: "virtual_pageview",
      event_name: "page_view",
      page_path: "/training/career",
    });
  });

  it("sends directly through GA4 when GTM is not configured", () => {
    vi.stubEnv("VITE_GA4_ID", "G-TEST");
    const { analyticsWindow, scripts } = installBrowser();

    expect(trackFunnelEvent("purchase", { transaction_id: "pay_1" })).toBe(
      true,
    );
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain("gtag/js?id=G-TEST");
    expect(analyticsWindow.dataLayer).toContainEqual([
      "event",
      "purchase",
      expect.objectContaining({ transaction_id: "pay_1" }),
    ]);
  });

  it("normalizes the legacy career Lead event to generate_lead", () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST");
    const { analyticsWindow } = installBrowser();

    trackCampaignEvent("Lead", { lead_id: "lead_1" });

    expect(analyticsWindow.dataLayer).toContainEqual(
      expect.objectContaining({
        // Preserve the legacy GTM trigger while exposing GA4's normalized
        // event name to tags consuming the data-layer payload.
        event: "Lead",
        event_name: "generate_lead",
        legacy_event_name: "Lead",
        lead_id: "lead_1",
      }),
    );
  });

  it("does not load or queue external analytics when DNT is enabled", () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST");
    const { analyticsWindow, scripts } = installBrowser();
    vi.stubGlobal("navigator", { doNotTrack: "1" });

    expect(trackFunnelEvent("generate_lead")).toBe(false);
    expect(scripts).toHaveLength(0);
    expect(analyticsWindow.dataLayer).toHaveLength(0);
  });

  it("does not load analytics while a recovery credential is in the URL", () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TEST");
    const { analyticsWindow, scripts } = installBrowser();
    Object.assign(analyticsWindow.location, {
      origin: "https://cvsolucion.com",
      search: "?recovery=1&token=secret",
      hash: "",
    });

    expect(trackFunnelEvent("form_start")).toBe(false);
    expect(scripts).toHaveLength(0);
    expect(analyticsWindow.dataLayer).toHaveLength(0);
  });
});
