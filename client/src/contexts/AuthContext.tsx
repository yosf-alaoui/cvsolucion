import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  CurrentUserResponse,
  getCurrentUser,
  loginWithPassword,
  logout as logoutRequest,
  resetPassword as resetPasswordRequest,
  sendPasswordReset,
  signUp,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, password: string, locale: string) => Promise<void>;
  logout: () => Promise<void>;
  sendReset: (email: string, locale: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const response: CurrentUserResponse = await getCurrentUser();
    setUser(response.user);
    setIsAdmin(Boolean(response.isAdmin));
    return response.user;
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      loading,
      refresh,
      login: async (email, password) => {
        const response = await loginWithPassword(email, password);
        setUser(response.user);
        setIsAdmin(Boolean(response.isAdmin));
        return response.user;
      },
      signup: async (email, password, locale) => {
        await signUp(email, password, locale);
      },
      logout: async () => {
        await logoutRequest();
        setUser(null);
        setIsAdmin(false);
      },
      sendReset: async (email, locale) => {
        await sendPasswordReset(email, locale);
      },
      resetPassword: async (token, password) => {
        await resetPasswordRequest(token, password);
      },
    }),
    [user, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
