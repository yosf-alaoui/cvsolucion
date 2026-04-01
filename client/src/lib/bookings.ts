export type BookingPriority = "standard" | "express";
export type BookingServiceType = "consultation" | "support";
export type BookingStatus = "confirmed" | "cancelled";
export type BookingPaymentStatus = "pending" | "paid" | "unpaid" | "partially_refunded" | "refunded";
export type BookingRefundStatus = "none" | "pending" | "succeeded" | "failed" | "canceled";

export type BookingAvailabilitySlot = {
  id: string;
  date: string;
  hour: number;
  priority: BookingPriority;
  status: "available" | "booked";
  source: "available" | "real" | "showcase";
};

export type BookingAvailabilityDay = {
  date: string;
  slots: BookingAvailabilitySlot[];
};

export type BookingAvailabilityResponse = {
  timeZone: string;
  priority: BookingPriority;
  days: BookingAvailabilityDay[];
  window: {
    startDate: string;
    endDate: string;
  };
  rules: {
    standardHours: number[];
    expressHours: number[];
    lunchBreak: string;
  };
};

export type BookingRecord = {
  id: string;
  userId: string;
  serviceType: BookingServiceType;
  priority: BookingPriority;
  packageKey: string | null;
  currency: string;
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  country: string | null;
  company: string | null;
  notes: string | null;
  locale: "en" | "fr" | "ar";
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  rescheduledFromBookingId: string | null;
  paymentStatus: BookingPaymentStatus;
  paymentProvider: "stripe" | null;
  paymentReference: string | null;
  unitAmount: number;
  refundStatus: BookingRefundStatus;
  refundReference: string | null;
  refundAmount: number;
  refundedAt: string | null;
  canReschedule?: boolean;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Booking request failed.");
  }
  return data;
}

export function getBookingAvailability(priority: BookingPriority) {
  return request<BookingAvailabilityResponse>(`/api/bookings/availability?priority=${encodeURIComponent(priority)}`, {
    method: "GET",
  });
}

export function createBooking(payload: {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  packageKey?: string | null;
  slots: Array<{ date: string; hour: number }>;
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  notes: string;
  paymentIntentId?: string;
  locale: string;
}) {
  return request<{ ok: true; booking: BookingRecord }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rescheduleBooking(bookingId: string, payload: { date: string; hour: number }) {
  return request<{ ok: true; booking: BookingRecord }>(`/api/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
