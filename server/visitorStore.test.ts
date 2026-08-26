import { describe, expect, it } from "vitest";
import { getAcquisitionReferrer } from "./visitorStore";

describe("visitor acquisition attribution", () => {
  it("keeps external referrers", () => {
    expect(
      getAcquisitionReferrer(
        "https://www.google.com/search?q=cabinet+vision+problem",
      ),
    ).toContain("google.com");
  });

  it("does not replace acquisition with an internal navigation", () => {
    expect(
      getAcquisitionReferrer(
        "https://cvsolucion.com/cabinet-vision-s2m-troubleshooting",
      ),
    ).toBeNull();
    expect(
      getAcquisitionReferrer("https://admin.cvsolucion.com/visitors"),
    ).toBeNull();
  });
});
