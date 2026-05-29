import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDocumentDatabase } from "./documentDatabase";
import { ensureJsonFile, writeJsonFileAtomic } from "./jsonFile";

let tempDir = "";

function openTestDatabase() {
  return new Database(path.join(tempDir, "cvsolucion.sqlite"), {
    fileMustExist: true,
  });
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-storage-"));
  process.env.APP_STORAGE_DRIVER = "sqlite";
  process.env.APP_DATA_DIR = tempDir;
  process.env.APP_SQLITE_JSON_MIRROR = "true";
});

afterEach(() => {
  closeDocumentDatabase();
  delete process.env.APP_STORAGE_DRIVER;
  delete process.env.APP_DATA_DIR;
  delete process.env.APP_SQLITE_JSON_MIRROR;
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("SQLite document storage", () => {
  it("mirrors auth documents into structured auth tables", () => {
    const authPath = path.join(tempDir, "auth-db.json");
    ensureJsonFile(authPath, {
      users: [],
      sessions: [],
      tokens: [],
      events: [],
    });

    writeJsonFileAtomic(authPath, {
      users: [
        {
          id: "user_1",
          email: "test@example.com",
          role: "customer",
          passwordSalt: "salt",
          passwordHash: "hash",
          emailVerifiedAt: null,
          termsAcceptedAt: "2026-01-01T00:00:00.000Z",
          termsVersion: "04/2026",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      sessions: [],
      tokens: [],
      events: [
        {
          id: "event_1",
          type: "signup",
          userId: "user_1",
          email: "test@example.com",
          locale: "en",
          ip: "127.0.0.1",
          userAgent: "vitest",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const db = openTestDatabase();
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM auth_users").get(),
    ).toMatchObject({ count: 1 });
    expect(
      db
        .prepare("SELECT email, role FROM auth_users WHERE id = ?")
        .get("user_1"),
    ).toMatchObject({
      email: "test@example.com",
      role: "customer",
    });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM auth_events").get(),
    ).toMatchObject({ count: 1 });
    const migrations = db
      .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
      .get() as { count: number };
    expect(migrations.count).toBeGreaterThanOrEqual(3);
    db.close();
  });

  it("mirrors booking documents into structured booking tables", () => {
    const bookingsPath = path.join(tempDir, "bookings-db.json");
    ensureJsonFile(bookingsPath, { bookings: [], blockedSlots: [] });

    writeJsonFileAtomic(bookingsPath, {
      bookings: [
        {
          id: "booking_1",
          userId: "user_1",
          serviceType: "consultation",
          priority: "standard",
          packageKey: null,
          currency: "usd",
          date: "2026-06-01",
          hour: 10,
          name: "Test User",
          email: "test@example.com",
          phone: "555",
          country: "United States",
          countryCode: "US",
          company: null,
          notes: "Keep CNC output attached",
          locale: "en",
          status: "confirmed",
          designerUserId: "designer_1",
          designerAssignedAt: "2026-01-02T00:00:00.000Z",
          designerAssignedByUserId: "admin_1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          rescheduledFromBookingId: "booking_previous",
          paymentStatus: "paid",
          paymentProvider: "stripe",
          paymentReference: "pi_test",
          unitAmount: 14000,
          refundStatus: "none",
          refundReference: null,
          refundAmount: 0,
          refundedAt: null,
        },
      ],
      blockedSlots: [],
    });

    const db = openTestDatabase();
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM bookings").get(),
    ).toMatchObject({ count: 1 });
    expect(
      db
        .prepare(
          "SELECT payment_reference, unit_amount, notes, designer_user_id, designer_assigned_at, designer_assigned_by_user_id, rescheduled_from_booking_id FROM bookings WHERE id = ?",
        )
        .get("booking_1"),
    ).toMatchObject({
      payment_reference: "pi_test",
      unit_amount: 14000,
      notes: "Keep CNC output attached",
      designer_user_id: "designer_1",
      designer_assigned_at: "2026-01-02T00:00:00.000Z",
      designer_assigned_by_user_id: "admin_1",
      rescheduled_from_booking_id: "booking_previous",
    });
    db.close();
  });
});
