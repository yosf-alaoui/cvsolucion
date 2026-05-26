const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let csrfToken: string | null = null;

export function setCsrfToken(token?: string | null) {
  csrfToken = token || null;
}

export function withCsrfHeaders(init?: RequestInit, headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  const method = String(init?.method || "GET").toUpperCase();

  if (!SAFE_METHODS.has(method) && csrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  return Object.fromEntries(headers.entries());
}
