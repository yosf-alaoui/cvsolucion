import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "cvsolucion-structured-reads-"),
  );
  process.env.APP_STORAGE_DRIVER = "sqlite";
  process.env.APP_DATA_DIR = tempDir;
  process.env.APP_SQLITE_JSON_MIRROR = "true";
});

afterEach(async () => {
  const { closeDocumentDatabase } = await import("./documentDatabase");
  closeDocumentDatabase();
  delete process.env.APP_STORAGE_DRIVER;
  delete process.env.APP_DATA_DIR;
  delete process.env.APP_SQLITE_JSON_MIRROR;
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("structured SQLite reads", () => {
  it("reads booking records from structured tables without dropping extended fields", async () => {
    const { ensureJsonFile, writeJsonFileAtomic } = await import("./jsonFile");
    const { getBookingById } = await import("./bookingStore");
    const bookingsPath = path.join(tempDir, "bookings-db.json");

    ensureJsonFile(bookingsPath, { bookings: [], blockedSlots: [] });
    writeJsonFileAtomic(bookingsPath, {
      bookings: [
        {
          id: "booking_1",
          userId: "user_1",
          serviceType: "support",
          priority: "express",
          packageKey: "support-quick",
          currency: "usd",
          date: "2026-06-01",
          hour: 14,
          name: "Test User",
          email: "TEST@EXAMPLE.COM",
          phone: "555",
          country: "United States",
          countryCode: "us",
          company: "Shop",
          notes: "Bring library backup",
          locale: "fr",
          status: "confirmed",
          designerUserId: "designer_1",
          designerAssignedAt: "2026-01-02T00:00:00.000Z",
          designerAssignedByUserId: "admin_1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
          rescheduledFromBookingId: "booking_previous",
          paymentStatus: "paid",
          paymentProvider: "stripe",
          paymentReference: "pi_test",
          unitAmount: 18000,
          refundStatus: "none",
          refundReference: null,
          refundAmount: 0,
          refundedAt: null,
        },
      ],
      blockedSlots: [],
    });

    expect(getBookingById("booking_1")).toMatchObject({
      id: "booking_1",
      serviceType: "support",
      priority: "express",
      packageKey: "support-quick",
      email: "test@example.com",
      countryCode: "US",
      notes: "Bring library backup",
      locale: "fr",
      designerUserId: "designer_1",
      designerAssignedAt: "2026-01-02T00:00:00.000Z",
      designerAssignedByUserId: "admin_1",
      rescheduledFromBookingId: "booking_previous",
      paymentReference: "pi_test",
      unitAmount: 18000,
    });
  });

  it("reads visitor snapshots with page views and interactions from structured tables", async () => {
    const { ensureJsonFile, writeJsonFileAtomic } = await import("./jsonFile");
    const { getVisitorsSnapshot } = await import("./visitorStore");
    const visitorsPath = path.join(tempDir, "visitors-db.json");

    ensureJsonFile(visitorsPath, { visitors: [] });
    writeJsonFileAtomic(visitorsPath, {
      visitors: [
        {
          id: "visitor_1",
          firstSeenAt: "2026-01-01T00:00:00.000Z",
          lastSeenAt: "2026-01-01T00:10:00.000Z",
          visitCount: 2,
          landingPath: "/",
          lastPath: "/book",
          locale: "en",
          referrer: "https://example.com",
          ip: "127.0.0.1",
          userAgent: "vitest",
          browserLanguage: "en-US",
          timezone: "America/New_York",
          screen: "1440x900",
          deviceType: "desktop",
          isRegistered: true,
          userId: "user_1",
          email: "test@example.com",
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "cabinet",
          utmTerm: "cabinet vision",
          utmContent: "ad-1",
          gclid: "gclid_1",
          fbclid: null,
          totalSessions: 1,
          totalPageViews: 2,
          totalDurationMs: 120000,
          lastSessionDurationMs: 120000,
          lastSessionPageCount: 2,
          whatsappClicks: 1,
          emailClicks: 0,
          ctaClicks: 1,
          chatOpens: 1,
          chatMessages: 1,
          lastWhatsappClickAt: "2026-01-01T00:05:00.000Z",
          lastEmailClickAt: null,
          lastChatAt: "2026-01-01T00:07:00.000Z",
          pageViews: [
            {
              path: "/",
              locale: "en",
              title: "Home",
              referrer: null,
              occurredAt: "2026-01-01T00:00:00.000Z",
              sessionId: "session_1",
            },
            {
              path: "/book",
              locale: "en",
              title: "Booking",
              referrer: "https://cvsolucion.com/",
              occurredAt: "2026-01-01T00:02:00.000Z",
              sessionId: "session_1",
            },
          ],
          interactions: [
            {
              type: "chat_message",
              path: "/book",
              label: "message",
              href: null,
              sessionId: "session_1",
              durationMs: null,
              pageCount: null,
              occurredAt: "2026-01-01T00:07:00.000Z",
            },
          ],
        },
      ],
    });

    const snapshot = getVisitorsSnapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({
      id: "visitor_1",
      userId: "user_1",
      email: "test@example.com",
      totalPageViews: 2,
      lastSessionDurationMs: 120000,
      utmSource: "google",
    });
    expect(snapshot[0].pageViews.map((pageView) => pageView.path)).toEqual([
      "/book",
      "/",
    ]);
    expect(snapshot[0].interactions).toMatchObject([
      {
        type: "chat_message",
        path: "/book",
        occurredAt: "2026-01-01T00:07:00.000Z",
      },
    ]);
  });
});
