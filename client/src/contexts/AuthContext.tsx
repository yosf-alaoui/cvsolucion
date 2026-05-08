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
  role: AuthUser["role"] | null;
  isAdmin: boolean;
  isDesigner: boolean;
  isTrainer: boolean;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, password: string, locale: string, termsAccepted: boolean, countryCode: string, country: string) => Promise<void>;
  logout: () => Promise<void>;
  sendReset: (email: string, locale: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AuthUser["role"] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const response: CurrentUserResponse = await getCurrentUser();
    setUser(response.user);
    const nextRole = response.user?.role || response.role || null;
    setRole(nextRole);
    setIsAdmin(Boolean(response.isAdmin ?? (nextRole === "admin")));
    setIsDesigner(Boolean(response.isDesigner ?? (nextRole === "designer")));
    setIsTrainer(Boolean(response.isTrainer ?? (nextRole === "trainer")));
    return response.user;
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAdmin,
      isDesigner,
      isTrainer,
      loading,
      refresh,
      login: async (email, password) => {
        const response = await loginWithPassword(email, password);
        setUser(response.user);
        const nextRole = response.user.role || response.role || null;
        setRole(nextRole);
        setIsAdmin(Boolean(response.isAdmin ?? (nextRole === "admin")));
        setIsDesigner(Boolean(response.isDesigner ?? (nextRole === "designer")));
        setIsTrainer(Boolean(response.isTrainer ?? (nextRole === "trainer")));
        return response.user;
      },
      signup: async (email, password, locale, termsAccepted, countryCode, country) => {
        await signUp(email, password, locale, termsAccepted, countryCode, country);
      },
      logout: async () => {
        await logoutRequest();
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setIsDesigner(false);
        setIsTrainer(false);
      },
      sendReset: async (email, locale) => {
        await sendPasswordReset(email, locale);
      },
      resetPassword: async (token, password) => {
        await resetPasswordRequest(token, password);
      },
    }),
    [user, role, isAdmin, isDesigner, isTrainer, loading]
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
