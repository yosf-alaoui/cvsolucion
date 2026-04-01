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
  utcStart: string;
  priority: BookingPriority;
  status: "available" | "booked";
  source: "available" | "real" | "blocked";
};

export type BookingAvailabilityDay = {
  date: string;
  slots: BookingAvailabilitySlot[];
};

export type BookingAvailabilityResponse = {
  timeZone: string;
  priority: BookingPriority;
  isOpen: boolean;
  schedule: {
    standardOpen: boolean;
    expressOpen: boolean;
    updatedAt: string;
  };
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

export type BookingScheduleSettings = {
  standardOpen: boolean;
  expressOpen: boolean;
  updatedAt: string;
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

export type CreateBookingPayload = {
  serviceType: BookingServiceType;
  priority: BookingPriority;
  packageKey?: string | null;
  regionCode?: string | null;
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

export type AdminBookingSlotView = {
  id: string;
  date: string;
  hour: number;
  utcStart: string;
  priority: BookingPriority;
  status: "booked" | "available";
  source: "real" | "blocked" | "available";
  booking:
    | {
        id: string;
        name: string;
        email: string;
        status: BookingStatus;
        paymentStatus: BookingPaymentStatus;
      }
    | null;
  block:
    | {
        id: string;
        reason: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | null;
};

export type AdminBookingSlotsResponse = {
  ok: true;
  date: string;
  priority: BookingPriority;
  slots: AdminBookingSlotView[];
};
