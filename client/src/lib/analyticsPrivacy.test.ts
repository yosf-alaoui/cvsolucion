import { describe, expect, it } from "vitest";
import {
  hasSensitiveAnalyticsParameters,
  hasSensitiveAnalyticsUrl,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsLocation,
  sanitizeAnalyticsReferrer,
} from "@shared/analyticsPrivacy";

describe("analytics URL privacy", () => {
  it("removes recovery credentials while preserving campaign parameters", () => {
    expect(
      sanitizeAnalyticsLocation({
        origin: "https://cvsolucion.com",
        pathname: "/login",
        search: "?recovery=1&token=super-secret&utm_source=google",
        hash: "",
      }),
    ).toMatchObject({
      href: "https://cvsolucion.com/login?recovery=1&utm_source=google",
      path: "/login?recovery=1&utm_source=google",
      search: "?recovery=1&utm_source=google",
    });
  });

  it("drops a sensitive hash and sanitizes referrers", () => {
    expect(
      sanitizeAnalyticsLocation({
        origin: "https://cvsolucion.com",
        pathname: "/login",
        search: "",
        hash: "#token=secret",
      }).hash,
    ).toBe("");
    expect(
      sanitizeAnalyticsReferrer(
        "https://cvsolucion.com/login?code=123&utm_medium=email",
      ),
    ).toBe("https://cvsolucion.com/login?utm_medium=email");
  });

  it("blocks nested credentials, contact fields, and non-web referrers", () => {
    const location = {
      search:
        "?next=%2Flogin%3Frecovery%3D1%26token%3Dsecret&utm_source=google&phone=15551234567",
      hash: "",
    };

    expect(hasSensitiveAnalyticsParameters(location)).toBe(true);
    expect(
      hasSensitiveAnalyticsUrl(
        "https://cvsolucion.com/login?next=%2Freset%3Ftoken%3Dsecret",
      ),
    ).toBe(true);
    expect(sanitizeAnalyticsPath(`/login${location.search}`)).toBe(
      "/login?utm_source=google",
    );
    expect(sanitizeAnalyticsReferrer("mailto:person@example.com")).toBeNull();
  });
});
