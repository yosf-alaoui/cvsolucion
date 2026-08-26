const SAFE_REDIRECT_BASE = "https://cvsolucion.invalid";

/** Normalize a redirect target to a same-site path, or return the fallback. */
export function normalizeSafeLocalRedirect(
  value: unknown,
  fallback = "/",
) {
  const raw = String(value || "").trim();
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return fallback;
  }

  try {
    // Reject encoded slash/backslash tricks before emitting a Location header.
    // Some clients and proxies normalize them differently from the URL parser.
    let decoded = raw;
    for (let pass = 0; pass < 3; pass += 1) {
      const next = decodeURIComponent(decoded);
      if (next.startsWith("//") || next.includes("\\")) return fallback;
      if (next === decoded) break;
      decoded = next;
    }

    const parsed = new URL(raw, SAFE_REDIRECT_BASE);
    if (parsed.origin !== SAFE_REDIRECT_BASE) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
