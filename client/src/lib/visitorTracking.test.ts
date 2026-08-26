import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  finishVisitorSession,
  recordVisitorPage,
  trackVisitorFunnelEvent,
  trackVisitorPage,
} from "./visitorTracking";

function createSessionStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  };
}

describe("first-party visitor tracking", () => {
  const sendBeacon = vi.fn(() => true);

  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createSessionStorage() });
    vi.stubGlobal("navigator", { sendBeacon });
    sendBeacon.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for the visitor cookie response before sending session_start", async () => {
    let resolvePageRequest: ((value: { ok: boolean }) => void) | undefined;
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/visitor/track") {
        return new Promise<{ ok: boolean }>((resolve) => {
          resolvePageRequest = resolve;
        });
      }
      return Promise.resolve({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    const session = recordVisitorPage();
    const request = trackVisitorPage(
      { path: "/training/career", sessionId: session.id },
      session,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/visitor/track");

    resolvePageRequest!({ ok: true });
    await request;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/visitor/event");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      type: "session_start",
      path: "/training/career",
      sessionId: session.id,
    });
  });

  it("claims session_end once and continues the same session after navigation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true })),
    );
    const session = recordVisitorPage();
    await trackVisitorPage({ path: "/book", sessionId: session.id }, session);

    expect(finishVisitorSession("/book")).toBe(true);
    expect(finishVisitorSession("/book")).toBe(false);
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const nextSession = recordVisitorPage("/book/cart");
    expect(nextSession.id).toBe(session.id);
    expect(nextSession.pageCount).toBe(2);
    expect(finishVisitorSession("/book/cart")).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(2);
  });

  it("stores supported funnel milestones without personal data", () => {
    Object.assign(window, { location: { pathname: "/training/career" } });

    expect(
      trackVisitorFunnelEvent("form_submit", {
        form_name: "career_evaluation",
        email: "private@example.com",
      }),
    ).toBe(true);

    const blob = sendBeacon.mock.calls[0][1] as Blob;
    return blob.text().then((body) => {
      expect(JSON.parse(body)).toMatchObject({
        type: "form_submit",
        path: "/training/career",
        label: "career_evaluation",
      });
      expect(body).not.toContain("private@example.com");
    });
  });
});
