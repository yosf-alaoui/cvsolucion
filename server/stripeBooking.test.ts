import { describe, expect, it } from "vitest";
import {
  buildBookingPaymentMetadata,
  parseBookingPaymentMetadata,
  validateBookingCheckoutDetails,
  type BookingPaymentSnapshot,
} from "./stripeBooking";

function snapshot(): BookingPaymentSnapshot {
  return {
    serviceType: "support",
    priority: "express",
    countryCode: "CA",
    slots: [
      { date: "2026-08-07", hour: 18 },
      { date: "2026-08-08", hour: 9 },
    ],
    locale: "ar",
    name: "Test Customer",
    phone: "+15145550123",
    company: null,
    notes: "Cabinet Vision closes while generating the CNC output.",
    packageKey: "support-plan",
  };
}

describe("booking payment metadata", () => {
  it("round-trips all data needed to recover a booking from a webhook", () => {
    const input = snapshot();
    const metadata = buildBookingPaymentMetadata(input);

    expect(parseBookingPaymentMetadata(metadata)).toEqual(input);
    expect(metadata.bookingDataVersion).toBe("2");
    expect(metadata.bookingCheckoutDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects metadata changed after checkout was created", () => {
    const metadata = buildBookingPaymentMetadata(snapshot());
    metadata.customerNotes = "A different request with enough characters.";

    expect(() => parseBookingPaymentMetadata(metadata)).toThrow(
      "integrity checks",
    );
  });

  it("keeps company optional and enforces the same notes minimum", () => {
    expect(
      validateBookingCheckoutDetails({
        name: "Test Customer",
        phone: "+15145550123",
        company: "",
        notes: "Exactly ten",
      }).company,
    ).toBeNull();

    expect(() =>
      validateBookingCheckoutDetails({
        name: "Test Customer",
        phone: "+15145550123",
        company: "",
        notes: "Too short",
      }),
    ).toThrow("description is required");
  });
});
