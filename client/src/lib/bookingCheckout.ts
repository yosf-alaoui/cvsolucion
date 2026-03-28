import type { BookingPriority, BookingServiceType } from "@/lib/bookings";

export type BookingCheckoutSlot = {
  id: string;
  date: string;
  hour: number;
};

export type BookingCheckoutDraft = {
  priority: BookingPriority;
  serviceType: BookingServiceType;
  slots: BookingCheckoutSlot[];
  createdAt: number;
};

const STORAGE_KEY = "cvsolucion-booking-checkout";

export function saveBookingCheckoutDraft(draft: BookingCheckoutDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function getBookingCheckoutDraft(): BookingCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BookingCheckoutDraft;
    if (!parsed || !Array.isArray(parsed.slots) || !parsed.priority || !parsed.serviceType) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingCheckoutDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
