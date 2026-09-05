import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-contact-queue-"));
  process.env.APP_DATA_DIR = tempDir;
  delete process.env.APP_STORAGE_DRIVER;
});

afterEach(async () => {
  const { closeDocumentDatabase } = await import("./documentDatabase");
  closeDocumentDatabase();
  delete process.env.APP_DATA_DIR;
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("contact notification queue", () => {
  it("stores the lead and its idempotent delivery jobs together", async () => {
    const store = await import("./contactStore");
    const { lead, notifications } = store.storeContactLeadWithNotifications(
      {
        id: "lead-idempotency-key",
        name: "Test Lead",
        email: "lead@example.com",
        phone: "+15145550123",
        message: "Please review our Cabinet Vision workflow.",
      },
      {
        sourceType: "career_evaluation",
        locale: "en",
        source: "https://cvsolucion.com/training/career",
        tracking: { utm_source: "test" },
      },
    );
    const repeated = store.storeContactLeadWithNotifications(
      {
        id: "lead-idempotency-key",
        name: "Test Lead",
        email: "lead@example.com",
        phone: "+15145550123",
        message: "Please review our Cabinet Vision workflow.",
      },
      {
        sourceType: "career_evaluation",
        locale: "en",
        source: "https://cvsolucion.com/training/career",
      },
    );

    expect(store.listContactLeads()).toHaveLength(1);
    expect(repeated.lead.id).toBe(lead.id);
    expect(notifications.map((job) => job.kind).sort()).toEqual([
      "admin_email",
      "career_start_email",
      "whatsapp_template",
    ]);
    expect(store.listContactNotifications()).toHaveLength(3);
    expect(store.listContactNotifications()[0].leadId).toBe(lead.id);
  });

  it("persists retry state and allows an admin retry after terminal failure", async () => {
    const store = await import("./contactStore");
    store.storeContactLeadWithNotifications(
      {
        name: "Test Lead",
        email: "lead@example.com",
        message: "Please contact me about Cabinet Vision support.",
      },
      {
        sourceType: "contact",
        locale: "en",
        source: "https://cvsolucion.com/",
      },
    );

    const jobs = store.listContactNotifications();
    for (const completed of jobs.slice(1)) {
      store.markContactNotificationSent(completed.id);
    }
    let job = store.claimDueContactNotification(new Date("2030-01-01T00:00:00Z"));
    expect(job).not.toBeNull();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (!job) break;
      const failed = store.markContactNotificationFailed(job.id, "provider unavailable");
      if (failed?.status === "failed") {
        job = failed;
        break;
      }
      job = store.claimDueContactNotification(
        new Date(new Date(failed!.nextAttemptAt).getTime() + 1),
      );
    }

    expect(job?.status).toBe("failed");
    const retried = store.retryContactNotification(job!.id);
    expect(retried).toMatchObject({
      status: "queued",
      attempts: 0,
      lastError: null,
    });
  });
});
