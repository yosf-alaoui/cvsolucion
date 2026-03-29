import type { BookingPriority, BookingServiceType } from "@/lib/bookings";

export type BookingCheckoutSlot = {
  id: string;
  date: string;
  hour: number;
};

export type BookingCheckoutDraft = {
  priority: BookingPriority;
  serviceType: BookingServiceType;
  packageKey?: string | null;
  slots: BookingCheckoutSlot[];
  createdAt: number;
};

const STORAGE_KEY = "cvsolucion-booking-checkout";
const EVENT_NAME = "cvsolucion-booking-cart-change";

function normalizeDraft(draft: BookingCheckoutDraft): BookingCheckoutDraft {
  const seen = new Set<string>();
  const slots = draft.slots.filter((slot) => {
    if (!slot?.id || !slot?.date || typeof slot.hour !== "number") return false;
    if (seen.has(slot.id)) return false;
    seen.add(slot.id);
    return true;
  });

  return {
    priority: draft.priority,
    serviceType: draft.serviceType,
    packageKey: typeof draft.packageKey === "string" && draft.packageKey.trim() ? draft.packageKey.trim() : null,
    slots,
    createdAt: draft.createdAt || Date.now(),
  };
}

export function saveBookingCheckoutDraft(draft: BookingCheckoutDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeDraft(draft)));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
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
    return normalizeDraft(parsed);
  } catch {
    return null;
  }
}

export function updateBookingCheckoutDraft(updater: (draft: BookingCheckoutDraft | null) => BookingCheckoutDraft | null) {
  if (typeof window === "undefined") return null;
  const nextDraft = updater(getBookingCheckoutDraft());
  if (!nextDraft || !nextDraft.slots.length) {
    clearBookingCheckoutDraft();
    return null;
  }
  saveBookingCheckoutDraft(nextDraft);
  return nextDraft;
}

export function removeBookingCheckoutSlot(slotId: string) {
  return updateBookingCheckoutDraft((draft) => {
    if (!draft) return null;
    return {
      ...draft,
      slots: draft.slots.filter((slot) => slot.id !== slotId),
    };
  });
}

export function clearBookingCheckoutDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getBookingCheckoutCount() {
  return getBookingCheckoutDraft()?.slots.length || 0;
}

export function getBookingCheckoutEventName() {
  return EVENT_NAME;
}
