import type { BookingPriority, BookingServiceType } from "@/lib/bookings";

export type BookingCheckoutSlot = {
  id: string;
  date: string;
  hour: number;
  utcStart?: string;
};

export type BookingCheckoutDraft = {
  priority: BookingPriority;
  serviceType: BookingServiceType;
  packageKey?: string | null;
  ownerUserId?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  timeZone?: string | null;
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
    ownerUserId: typeof draft.ownerUserId === "string" && draft.ownerUserId.trim() ? draft.ownerUserId.trim() : null,
    countryCode: typeof draft.countryCode === "string" && draft.countryCode.trim() ? draft.countryCode.trim() : null,
    regionCode: typeof draft.regionCode === "string" && draft.regionCode.trim() ? draft.regionCode.trim() : null,
    timeZone: typeof draft.timeZone === "string" && draft.timeZone.trim() ? draft.timeZone.trim() : null,
    slots,
    createdAt: draft.createdAt || Date.now(),
  };
}

function matchesDraftOwner(draft: BookingCheckoutDraft, currentUserId?: string | null) {
  const owner = draft.ownerUserId || null;
  const current = currentUserId || null;
  if (!owner || !current) {
    return false;
  }
  return owner === current;
}

export function saveBookingCheckoutDraft(draft: BookingCheckoutDraft, currentUserId?: string | null) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizeDraft({
        ...draft,
        ownerUserId: currentUserId || null,
      })
    )
  );
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getBookingCheckoutDraft(currentUserId?: string | null): BookingCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BookingCheckoutDraft;
    if (!parsed || !Array.isArray(parsed.slots) || !parsed.priority || !parsed.serviceType) {
      return null;
    }
    const draft = normalizeDraft(parsed);
    if (typeof currentUserId === "undefined") {
      return draft;
    }
    if (!matchesDraftOwner(draft, currentUserId)) {
      clearBookingCheckoutDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function updateBookingCheckoutDraft(
  updater: (draft: BookingCheckoutDraft | null) => BookingCheckoutDraft | null,
  currentUserId?: string | null
) {
  if (typeof window === "undefined") return null;
  const nextDraft = updater(getBookingCheckoutDraft(currentUserId));
  if (!nextDraft || !nextDraft.slots.length) {
    clearBookingCheckoutDraft();
    return null;
  }
  saveBookingCheckoutDraft(nextDraft, currentUserId);
  return nextDraft;
}

export function removeBookingCheckoutSlot(slotId: string, currentUserId?: string | null) {
  return updateBookingCheckoutDraft((draft) => {
    if (!draft) return null;
    return {
      ...draft,
      slots: draft.slots.filter((slot) => slot.id !== slotId),
    };
  }, currentUserId);
}

export function clearBookingCheckoutDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getBookingCheckoutCount(currentUserId?: string | null) {
  return getBookingCheckoutDraft(currentUserId)?.slots.length || 0;
}

export function getBookingCheckoutEventName() {
  return EVENT_NAME;
}
