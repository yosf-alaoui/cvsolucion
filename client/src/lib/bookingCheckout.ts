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
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readStoredDraft() {
  try {
    const persisted = window.localStorage?.getItem(STORAGE_KEY);
    if (persisted) return persisted;
  } catch {
    // Fall back to session storage when persistent storage is unavailable.
  }
  try {
    return window.sessionStorage?.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function writeStoredDraft(value: string) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, value);
    window.sessionStorage?.removeItem(STORAGE_KEY);
    return;
  } catch {
    // Fall back to the current tab in restricted browser contexts.
  }
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // A disabled storage API should not crash the booking page.
  }
}

function removeStoredDraft() {
  try {
    window.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
  try {
    window.sessionStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

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
    // Packages have separate scopes/prices and are confirmed manually. The
    // self-serve cart is intentionally limited to hourly sessions.
    packageKey: null,
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
  // A cart created before authentication belongs to this browser and
  // may be claimed by the customer after email verification/sign-in.
  if (!owner) return true;
  if (!current) return false;
  return owner === current;
}

export function saveBookingCheckoutDraft(draft: BookingCheckoutDraft, currentUserId?: string | null) {
  if (typeof window === "undefined") return;
  writeStoredDraft(
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
  const raw = readStoredDraft();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BookingCheckoutDraft;
    if (!parsed || !Array.isArray(parsed.slots) || !parsed.priority || !parsed.serviceType) {
      return null;
    }
    const draft = normalizeDraft(parsed);
    if (Date.now() - draft.createdAt > DRAFT_MAX_AGE_MS) {
      removeStoredDraft();
      return null;
    }
    if (typeof currentUserId === "undefined") {
      return draft;
    }
    if (!matchesDraftOwner(draft, currentUserId)) {
      return null;
    }
    if (!draft.ownerUserId && currentUserId) {
      const claimedDraft = normalizeDraft({
        ...draft,
        ownerUserId: currentUserId,
      });
      writeStoredDraft(JSON.stringify(claimedDraft));
      return claimedDraft;
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
  removeStoredDraft();
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getBookingCheckoutCount(currentUserId?: string | null) {
  return getBookingCheckoutDraft(currentUserId)?.slots.length || 0;
}

export function getBookingCheckoutEventName() {
  return EVENT_NAME;
}
