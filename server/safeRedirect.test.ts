import { describe, expect, it } from "vitest";
import { normalizeSafeLocalRedirect } from "../shared/safeRedirect";

describe("normalizeSafeLocalRedirect", () => {
  it("keeps a local path with query and hash", () => {
    expect(normalizeSafeLocalRedirect("/training?level=2#pricing")).toBe(
      "/training?level=2#pricing",
    );
  });

  it.each([
    "https://example.com/steal",
    "//example.com/steal",
    "\\\\example.com\\steal",
    "/%2fexample.com/steal",
    "/%255cexample.com/steal",
    "javascript:alert(1)",
    "",
  ])("rejects an unsafe redirect: %s", (value) => {
    expect(normalizeSafeLocalRedirect(value, "/fallback")).toBe("/fallback");
  });
});
