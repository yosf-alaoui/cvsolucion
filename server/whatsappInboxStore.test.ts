import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-whatsapp-"));
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

describe("WhatsApp inbox store", () => {
  it("stores inbound messages idempotently by WhatsApp message id", async () => {
    const { listWhatsAppInboxConversations, recordWhatsAppInboundMessage } =
      await import("./whatsappInboxStore");

    const first = recordWhatsAppInboundMessage({
      phone: "+1 (438) 807-8747",
      contactName: "Test Client",
      whatsappMessageId: "wamid.test-1",
      body: "Hello",
    });
    const duplicate = recordWhatsAppInboundMessage({
      phone: "14388078747",
      contactName: "Test Client",
      whatsappMessageId: "wamid.test-1",
      body: "Hello again",
    });

    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(listWhatsAppInboxConversations()).toHaveLength(1);
    expect(listWhatsAppInboxConversations()[0]).toMatchObject({
      phone: "14388078747",
      unreadCount: 1,
      status: "needs_reply",
    });
    expect(listWhatsAppInboxConversations()[0].messages).toHaveLength(1);
  });

  it("updates outbound status from webhook status events", async () => {
    const {
      listWhatsAppInboxConversations,
      recordWhatsAppOutboundMessage,
      updateWhatsAppInboxMessageStatus,
    } = await import("./whatsappInboxStore");

    recordWhatsAppOutboundMessage({
      phone: "14388078747",
      whatsappMessageId: "wamid.sent-1",
      body: "Thanks",
      sentByEmail: "admin@example.com",
    });

    const updated = updateWhatsAppInboxMessageStatus({
      whatsappMessageId: "wamid.sent-1",
      status: "read",
    });

    expect(updated?.message.status).toBe("read");
    expect(listWhatsAppInboxConversations()[0].messages[0]).toMatchObject({
      status: "read",
      sentByEmail: "admin@example.com",
    });
  });
});
