import { hasSensitiveAnalyticsParameters } from "@shared/analyticsPrivacy";

const SESSION_STORAGE_KEY = "cvs_visitor_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const FIRST_PARTY_FUNNEL_EVENTS = [
  "form_start",
  "form_submit",
  "email_verification_required",
  "generate_lead",
  "contact",
  "add_to_cart",
  "checkout_sign_in",
  "checkout_continue",
  "begin_checkout",
  "payment_form_opened",
  "add_payment_info",
  "purchase",
  "payment_failed",
  "checkout_error",
  "checkout_completion_failed",
] as const;

export type FirstPartyFunnelEvent = (typeof FIRST_PARTY_FUNNEL_EVENTS)[number];

export type VisitorSessionState = {
  id: string;
  startedAt: number;
  lastActivityAt: number;
  pageCount: number;
  firstPath?: string;
  startedEventSent?: boolean;
  endedEventSent?: boolean;
};

function getSessionState() {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VisitorSessionState;
  } catch {
    return null;
  }
}

function setSessionState(value: VisitorSessionState) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
}

function createSessionState(firstPath = "/"): VisitorSessionState {
  const timestamp = Date.now();
  const next = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    startedAt: timestamp,
    lastActivityAt: timestamp,
    pageCount: 0,
    firstPath,
    startedEventSent: false,
    endedEventSent: false,
  };
  setSessionState(next);
  return next;
}

function ensureSessionState(firstPath = "/") {
  const existing = getSessionState();
  const timestamp = Date.now();
  if (
    existing &&
    timestamp - (existing.lastActivityAt || existing.startedAt) <=
      SESSION_TIMEOUT_MS
  ) {
    // pagehide also fires during a normal full-page navigation. Reopen the
    // same 30-minute session on the next document instead of counting every
    // page as a new visit.
    existing.endedEventSent = false;
    existing.lastActivityAt = timestamp;
    existing.firstPath = existing.firstPath || firstPath;
    setSessionState(existing);
    return existing;
  }
  return createSessionState(firstPath);
}

function sendVisitorEvent(
  payload: Record<string, unknown>,
  preferBeacon = false,
) {
  const body = JSON.stringify(payload);
  if (
    preferBeacon &&
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/visitor/event", blob)) return;
  }

  fetch("/api/visitor/event", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: preferBeacon,
  }).catch(() => {});
}

export function recordVisitorPage(path = "/") {
  const session = ensureSessionState(path);
  session.pageCount += 1;
  session.lastActivityAt = Date.now();
  setSessionState(session);
  return session;
}

/**
 * Persist a page view first. The successful response installs the HTTP-only
 * visitor cookie, so session_start is only emitted after the server can attach
 * it to the same visitor.
 */
export async function trackVisitorPage(
  payload: Record<string, unknown>,
  session: VisitorSessionState,
) {
  try {
    const response = await fetch("/api/visitor/track", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) return false;

    // Multiple route requests can finish out of order. Re-reading and claiming
    // the flag synchronously ensures exactly one of them emits session_start.
    const current = getSessionState();
    if (
      !current ||
      current.id !== session.id ||
      current.startedEventSent ||
      current.endedEventSent
    ) {
      return true;
    }

    if (
      current.pageCount === 1 &&
      (!current.firstPath || current.firstPath === "/") &&
      typeof payload.path === "string"
    ) {
      current.firstPath = payload.path;
    }
    current.startedEventSent = true;
    setSessionState(current);
    sendVisitorEvent({
      type: "session_start",
      path: current.firstPath || String(payload.path || "/"),
      sessionId: current.id,
    });
    return true;
  } catch {
    return false;
  }
}

/** Claim and send session_end once for a given session ID. */
export function finishVisitorSession(path: string) {
  const current = getSessionState();
  if (!current || !current.startedEventSent || current.endedEventSent) {
    return false;
  }

  current.endedEventSent = true;
  current.lastActivityAt = Date.now();
  setSessionState(current);
  sendVisitorEvent(
    {
      type: "session_end",
      path,
      sessionId: current.id,
      durationMs: Date.now() - current.startedAt,
      pageCount: current.pageCount,
    },
    true,
  );
  return true;
}

export function trackVisitorInteraction(payload: Record<string, unknown>) {
  sendVisitorEvent(payload, true);
}

function firstPartyFunnelLabel(
  type: FirstPartyFunnelEvent,
  params: Record<string, unknown>,
) {
  const candidate =
    params.form_name ||
    params.service_type ||
    params.content_name ||
    params.contact_method ||
    type;
  return String(candidate).slice(0, 140);
}

/** Store conversion milestones without sending contact or payment details. */
export function trackVisitorFunnelEvent(
  type: string,
  params: Record<string, unknown> = {},
) {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    navigator.doNotTrack === "1" ||
    hasSensitiveAnalyticsParameters(window.location) ||
    window.location?.hostname?.toLowerCase().startsWith("admin.") ||
    window.location?.pathname?.startsWith("/admin") ||
    !FIRST_PARTY_FUNNEL_EVENTS.includes(type as FirstPartyFunnelEvent)
  ) {
    return false;
  }

  const session = ensureSessionState(window.location?.pathname || "/");
  sendVisitorEvent(
    {
      type,
      path: window.location?.pathname || "/",
      label: firstPartyFunnelLabel(type as FirstPartyFunnelEvent, params),
      sessionId: session.id,
    },
    true,
  );
  return true;
}
