import { afterEach, describe, expect, it, vi } from "vitest";

describe("initial sensitive URL handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("removes a recovery token before render while retaining it for the form", async () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        origin: "https://cvsolucion.com",
        pathname: "/login",
        search: "?recovery=1&token=secret&utm_source=email",
        hash: "",
      },
      history: { state: null, replaceState },
    });

    const { getInitialSensitiveSearch, scrubInitialSensitiveUrl } =
      await import("./sensitiveUrl");

    expect(scrubInitialSensitiveUrl()).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/login?recovery=1&utm_source=email",
    );
    expect(getInitialSensitiveSearch()).toContain("token=secret");
  });
});
