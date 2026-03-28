import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  AuthCurrentUserResponse,
  AuthForgotPasswordPayload,
  AuthLoginPayload,
  AuthResetPasswordPayload,
  AuthSignupPayload,
} from "./contracts";

export function createAuthModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    getCurrentUser() {
      return request<AuthCurrentUserResponse>("/api/auth/me", { method: "GET" });
    },
    login(payload: AuthLoginPayload) {
      return request<{ user: AuthCurrentUserResponse["user"]; isAdmin?: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    signup(payload: AuthSignupPayload) {
      return request<{ ok: true }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    forgotPassword(payload: AuthForgotPasswordPayload) {
      return request<{ ok: true }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    resetPassword(payload: AuthResetPasswordPayload) {
      return request<{ ok: true }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    logout() {
      return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
    },
  };
}

