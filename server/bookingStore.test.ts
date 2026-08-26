import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-bookings-"));
  process.env.APP_DATA_DIR = tempDir;
  delete process.env.APP_STORAGE_DRIVER;
  delete process.env.APP_DATABASE_PATH;
});

afterEach(async () => {
  const { closeDocumentDatabase } = await import("./documentDatabase");
  closeDocumentDatabase();
  delete process.env.APP_DATA_DIR;
  delete process.env.APP_STORAGE_DRIVER;
  delete process.env.APP_DATABASE_PATH;
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

async function loadStoreAndSlots() {
  const store = await import("./bookingStore");
  const slots = store
    .getBookingAvailability("standard")
    .days.flatMap((day) => day.slots)
    .filter((slot) => slot.status === "available")
    .slice(0, 3)
    .map(({ date, hour }) => ({ date, hour }));
  expect(slots).toHaveLength(3);
  return { store, slots };
}

function bookingInput(slots: Array<{ date: string; hour: number }>) {
  return {
    userId: "user_1",
    serviceType: "consultation" as const,
    priority: "standard" as const,
    slots,
    name: "Test Customer",
    email: "customer@example.com",
    phone: "+15145550123",
    country: "Canada",
    countryCode: "CA",
    company: null,
    notes: "Review the Cabinet Vision construction methods.",
    locale: "en" as const,
    paymentStatus: "paid" as const,
    paymentProvider: "stripe" as const,
    unitAmount: 14000,
  };
}

describe("booking batch creation", () => {
  it("does not persist an earlier slot when a later slot fails preflight", async () => {
    const { store, slots } = await loadStoreAndSlots();
    store.createBookings({
      ...bookingInput([slots[1]]),
      userId: "other_user",
      email: "other@example.com",
      paymentReference: "pi_other",
    });

    expect(() =>
      store.createBookings({
        ...bookingInput([slots[0], slots[1]]),
        paymentReference: "pi_batch",
      }),
    ).toThrow("just been taken");

    expect(store.listBookings()).toHaveLength(1);
    expect(() =>
      store.assertBookingSlotsAvailable({
        priority: "standard",
        slots: [slots[1]],
      }),
    ).toThrow("just been taken");
  });

  it("uses the payment reference idempotently", async () => {
    const { store, slots } = await loadStoreAndSlots();
    const input = {
      ...bookingInput([slots[0], slots[1]]),
      paymentReference: "pi_idempotent",
    };

    const first = store.createBookings(input);
    const second = store.createBookings(input);

    expect(second.map((booking) => booking.id)).toEqual(
      first.map((booking) => booking.id),
    );
    expect(store.listBookings()).toHaveLength(2);
  });

  it("completes a legacy partial payment set in one follow-up write", async () => {
    const { store, slots } = await loadStoreAndSlots();
    const paymentReference = "pi_partial";
    store.createBookings({
      ...bookingInput([slots[0]]),
      paymentReference,
    });

    const recovered = store.createBookings({
      ...bookingInput([slots[0], slots[1]]),
      paymentReference,
    });

    expect(recovered).toHaveLength(2);
    expect(
      new Set(recovered.map((booking) => booking.paymentReference)),
    ).toEqual(new Set([paymentReference]));
    expect(store.listBookings()).toHaveLength(2);
  });

  it("holds every slot after authorization and promotes the same records after capture", async () => {
    const { store, slots } = await loadStoreAndSlots();
    const paymentReference = "pi_authorized";
    const pendingInput = {
      ...bookingInput([slots[0], slots[1]]),
      paymentReference,
      paymentStatus: "pending" as const,
    };

    const held = store.createBookings(pendingInput);
    expect(held.every((booking) => booking.paymentStatus === "pending")).toBe(true);
    expect(() =>
      store.createBookings({
        ...bookingInput([slots[0]]),
        userId: "other_user",
        email: "other@example.com",
        paymentReference: "pi_competing",
      }),
    ).toThrow("just been taken");

    const captured = store.createBookings({
      ...pendingInput,
      paymentStatus: "paid",
    });
    expect(captured.map((booking) => booking.id)).toEqual(
      held.map((booking) => booking.id),
    );
    expect(captured.every((booking) => booking.paymentStatus === "paid")).toBe(true);
  });

  it("does not sell the same calendar hour as both standard and express", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T14:00:00.000Z"));
    try {
      const store = await import("./bookingStore");
      const standardSlots = store
        .getBookingAvailability("standard")
        .days.flatMap((day) => day.slots)
        .filter((slot) => slot.status === "available");
      const expressKeys = new Set(
        store
          .getBookingAvailability("express")
          .days.flatMap((day) => day.slots)
          .filter((slot) => slot.status === "available")
          .map((slot) => `${slot.date}:${slot.hour}`),
      );
      const shared = standardSlots.find((slot) =>
        expressKeys.has(`${slot.date}:${slot.hour}`),
      );
      expect(shared).toBeTruthy();

      store.createBookings({
        ...bookingInput([{ date: shared!.date, hour: shared!.hour }]),
        paymentReference: "pi_standard_shared",
      });

      expect(() =>
        store.createBookings({
          ...bookingInput([{ date: shared!.date, hour: shared!.hour }]),
          priority: "express",
          userId: "express_user",
          email: "express@example.com",
          paymentReference: "pi_express_shared",
        }),
      ).toThrow("just been taken");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reuses one admin refund attempt and applies it only to the selected booking", async () => {
    const { store, slots } = await loadStoreAndSlots();
    const paymentReference = "pi_admin_refund";
    const bookings = store.createBookings({
      ...bookingInput([slots[0], slots[1]]),
      paymentReference,
    });
    const attemptId = "refund_attempt_1234567890";

    const firstClaim = store.claimBookingRefundByAdmin({
      bookingId: bookings[0].id,
      attemptId,
      refundAmount: bookings[0].unitAmount,
    });
    const repeatedClaim = store.claimBookingRefundByAdmin({
      bookingId: bookings[0].id,
      attemptId: "different_attempt_123456",
      refundAmount: bookings[0].unitAmount,
    });
    expect(firstClaim.reused).toBe(false);
    expect(repeatedClaim).toMatchObject({ attemptId, reused: true });

    store.applyStripeRefundUpdate({
      paymentReference,
      refundId: "re_admin_1",
      refundAmount: bookings[0].unitAmount,
      currency: "usd",
      refundStatus: "succeeded",
      bookingIds: [bookings[0].id],
    });

    expect(store.getBookingById(bookings[0].id)).toMatchObject({
      paymentStatus: "refunded",
      refundStatus: "succeeded",
    });
    expect(store.getBookingById(bookings[1].id)).toMatchObject({
      paymentStatus: "paid",
      refundStatus: "none",
    });
  });
});
