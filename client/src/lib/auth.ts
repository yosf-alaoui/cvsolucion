export type AuthUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
};

export type CurrentUserResponse = {
  user: AuthUser | null;
  isAdmin?: boolean;
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
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export function getCurrentUser() {
  return request<CurrentUserResponse>("/api/auth/me", { method: "GET" });
}

export function loginWithPassword(email: string, password: string) {
  return request<{ user: AuthUser; isAdmin?: boolean }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(
  email: string,
  password: string,
  locale: string,
  termsAccepted: boolean,
  countryCode: string,
  country: string,
  termsVersion = "04/2026"
) {
  return request<{ ok: true }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, locale, termsAccepted, countryCode, country, termsVersion }),
  });
}

export function sendPasswordReset(email: string, locale: string) {
  return request<{ ok: true }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, locale }),
  });
}

export function resetPassword(token: string, password: string) {
  return request<{ ok: true }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function logout() {
  return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}
