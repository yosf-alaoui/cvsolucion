import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getBookingCheckoutDraft,
  saveBookingCheckoutDraft,
  updateBookingCheckoutDraft,
} from "./bookingCheckout";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("booking checkout draft ownership", () => {
  let localStorage: MemoryStorage;

  beforeEach(() => {
    localStorage = new MemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage,
        sessionStorage: new MemoryStorage(),
        dispatchEvent: () => true,
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("keeps a guest cart available after the customer signs in", () => {
    saveBookingCheckoutDraft(
      {
        priority: "standard",
        serviceType: "consultation",
        slots: [{ id: "2026-08-10:9:standard", date: "2026-08-10", hour: 9 }],
        createdAt: Date.now(),
      },
      null,
    );

    expect(getBookingCheckoutDraft("customer-1")?.slots).toHaveLength(1);

    updateBookingCheckoutDraft((draft) => draft, "customer-1");
    expect(getBookingCheckoutDraft("customer-1")?.ownerUserId).toBe(
      "customer-1",
    );
  });

  it("does not expose an owned cart to a guest or another account", () => {
    saveBookingCheckoutDraft(
      {
        priority: "standard",
        serviceType: "support",
        slots: [{ id: "2026-08-11:10:standard", date: "2026-08-11", hour: 10 }],
        createdAt: Date.now(),
      },
      "customer-1",
    );

    expect(getBookingCheckoutDraft(null)).toBeNull();
    expect(getBookingCheckoutDraft("customer-2")).toBeNull();
  });

  it("keeps a guest cart across tabs so email verification can return to it", () => {
    saveBookingCheckoutDraft(
      {
        priority: "standard",
        serviceType: "consultation",
        slots: [{ id: "2026-08-12:11:standard", date: "2026-08-12", hour: 11 }],
        createdAt: Date.now(),
      },
      null,
    );

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage,
        sessionStorage: new MemoryStorage(),
        dispatchEvent: () => true,
      },
    });

    expect(getBookingCheckoutDraft("customer-1")?.slots).toHaveLength(1);
  });

  it("drops stale carts", () => {
    saveBookingCheckoutDraft(
      {
        priority: "standard",
        serviceType: "consultation",
        slots: [{ id: "old", date: "2026-08-01", hour: 9 }],
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
      },
      null,
    );

    expect(getBookingCheckoutDraft(null)).toBeNull();
  });
});
