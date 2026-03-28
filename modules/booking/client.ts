import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  BookingAvailabilityResponse,
  BookingPriority,
  BookingRecord,
  CreateBookingPayload,
} from "./contracts";

export function createBookingModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    getAvailability(priority: BookingPriority) {
      return request<BookingAvailabilityResponse>(
        `/api/bookings/availability?priority=${encodeURIComponent(priority)}`,
        { method: "GET" }
      );
    },
    createBooking(payload: CreateBookingPayload) {
      return request<{ ok: true; booking: BookingRecord }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    rescheduleBooking(bookingId: string, payload: { date: string; hour: number }) {
      return request<{ ok: true; booking: BookingRecord }>(
        `/api/bookings/${encodeURIComponent(bookingId)}/reschedule`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    createCheckoutIntent(payload: {
      serviceType: CreateBookingPayload["serviceType"];
      priority: CreateBookingPayload["priority"];
      slots: CreateBookingPayload["slots"];
      locale: string;
    }) {
      return request<{
        ok: true;
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
        currency: string;
      }>("/api/bookings/checkout-intent", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

