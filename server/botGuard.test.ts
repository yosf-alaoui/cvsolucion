import { describe, expect, it } from "vitest";
import {
  getBotDecision,
  shouldBlockBotRequest,
  shouldIgnoreVisitorTracking,
} from "./botGuard";

describe("bot guard", () => {
  it("allows important search and preview crawlers but excludes them from visitor tracking", () => {
    const googlebot =
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    const facebook =
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

    expect(shouldBlockBotRequest(googlebot)).toBe(false);
    expect(shouldIgnoreVisitorTracking(googlebot)).toBe(true);
    expect(getBotDecision(facebook)).toMatchObject({
      automated: true,
      allowed: true,
      blocked: false,
    });
  });

  it("blocks noisy crawlers and scanners", () => {
    expect(shouldBlockBotRequest("Mozilla/5.0 SemrushBot")).toBe(true);
    expect(shouldBlockBotRequest("sqlmap/1.7")).toBe(true);
  });

  it("does not block normal browser visitors", () => {
    const chrome =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36";

    expect(shouldBlockBotRequest(chrome)).toBe(false);
    expect(shouldIgnoreVisitorTracking(chrome)).toBe(false);
    expect(getBotDecision(chrome).automated).toBe(false);
  });
});
