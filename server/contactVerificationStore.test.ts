import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-contact-"));
  process.env.APP_DATA_DIR = tempDir;
});

afterEach(async () => {
  const { closeDocumentDatabase } = await import("./documentDatabase");
  closeDocumentDatabase();
  delete process.env.APP_DATA_DIR;
  delete process.env.APP_STORAGE_DRIVER;
  delete process.env.APP_SQLITE_JSON_MIRROR;
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function pendingLeadInput() {
  return {
    name: "Test Lead",
    email: "TEST@EXAMPLE.COM",
    company: "Shop worker",
    phone: "+15555550100",
    interest: "Cabinet Vision career evaluation",
    message: "I want to move from production into Cabinet Vision design.",
    locale: "en" as const,
    sourceType: "career_evaluation" as const,
    source: "https://cvsolucion.com/training/career",
    tracking: { utm_source: "meta" },
  };
}

describe("contact verification store", () => {
  it("stores pending leads behind a one-use token", async () => {
    const {
      createPendingContactLead,
      getPendingContactLeadByToken,
      markPendingContactLeadConfirmed,
    } = await import("./contactVerificationStore");

    const { pendingLead, rawToken } = createPendingContactLead(
      pendingLeadInput(),
      1000 * 60 * 60,
    );

    expect(getPendingContactLeadByToken(rawToken)).toMatchObject({
      id: pendingLead.id,
      email: "test@example.com",
      confirmedAt: null,
    });

    markPendingContactLeadConfirmed(pendingLead.id);

    expect(getPendingContactLeadByToken(rawToken)).toBeNull();
  });

  it("does not return expired pending leads", async () => {
    const { createPendingContactLead, getPendingContactLeadByToken } =
      await import("./contactVerificationStore");

    const { rawToken } = createPendingContactLead(pendingLeadInput(), -1);

    expect(getPendingContactLeadByToken(rawToken)).toBeNull();
  });
});
