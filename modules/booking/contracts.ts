export type BookingPriority = "standard" | "express";
export type BookingServiceType = "consultation" | "support";
export type BookingStatus = "confirmed" | "cancelled";
export type BookingPaymentStatus = "pending" | "paid" | "unpaid" | "partially_refunded" | "refunded";
export type BookingRefundStatus = "none" | "pending" | "succeeded" | "failed" | "canceled";

export type BookingSlot = {
  date: string;
  hour: number;
};

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

export type CreateBookingPayload = {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  slots: BookingSlot[];
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  notes: string;
  paymentIntentId?: string;
  locale: string;
};

