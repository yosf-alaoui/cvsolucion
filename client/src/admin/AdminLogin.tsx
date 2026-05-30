import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { validatePasswordPolicy } from "@shared/passwordPolicy";

type LoginState = "login" | "reset" | "recovery";

function getSafeNextPath() {
  const params = new URLSearchParams(window.location.search);
  const rawNext = params.get("next")?.trim();
  if (rawNext?.startsWith("/") && !rawNext.startsWith("//")) {
    return rawNext.startsWith("/admin") ? rawNext : "/admin";
  }
  return "/admin";
}

export default function AdminLogin() {
  const { user, isAdmin, loading, login, logout, sendReset, resetPassword } = useAuth();
  const [state, setState] = useState<LoginState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const resetPasswordMessage = state === "recovery" && newPassword ? validatePasswordPolicy(newPassword).message : null;
  const disabled = useMemo(() => {
    if (state === "reset") return !email;
    if (state === "recovery") return !resetToken || !newPassword || newPassword !== confirmPassword || Boolean(resetPasswordMessage);
    return !email || !password;
  }, [confirmPassword, email, newPassword, password, resetPasswordMessage, resetToken, state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recovery = params.get("recovery");
    const token = params.get("token");
    const reset = params.get("reset");

    if ((recovery === "1" || recovery === "true") && token) {
      setState("recovery");
      setResetToken(token);
      return;
    }

    if (reset === "success") {
      setStatus("Password updated. Sign in with the new password.");
      setStatusTone("success");
    }
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      window.location.replace(getSafeNextPath());
    }
  }, [isAdmin, loading, user]);

  const setError = (message: string) => {
    setStatus(message);
    setStatusTone("error");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setStatusTone(null);

    try {
      if (state === "recovery") {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        if (resetPasswordMessage) {
          setError(resetPasswordMessage);
          return;
        }
        await resetPassword(resetToken, newPassword);
        window.location.href = "/admin/login?reset=success";
        return;
      }

      if (state === "reset") {
        if (!email) {
          setError("Email is required.");
          emailRef.current?.focus();
          return;
        }
        await sendReset(email, "en", "admin");
        setStatus("If this admin account exists, a reset link has been sent.");
        setStatusTone("success");
        return;
      }

      const nextUser = await login(email, password, { adminOnly: true });
      if (nextUser.role !== "admin") {
        await logout().catch(() => {});
        setError("Admin access only.");
        return;
      }
      window.location.href = getSafeNextPath();
    } catch (error: any) {
      const message = String(error?.message || "Unable to sign in.");
      setError(message === "Please confirm your email before signing in." ? "Confirm this email before signing in." : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to public site
          </a>
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">CVsolucion Admin</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950">Admin Console</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                A separate control panel for site operations, bookings, articles, users, analytics, designers, and training.
              </p>
            </div>
          </div>
        </section>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {state === "recovery" ? "Create a new password" : state === "reset" ? "Reset admin password" : "Admin sign in"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {state === "recovery" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin-new-password">New password</Label>
                    <Input
                      id="admin-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                    {resetPasswordMessage ? <p className="text-xs text-destructive">{resetPasswordMessage}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-confirm-password">Confirm password</Label>
                    <Input
                      id="admin-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  {state === "login" ? (
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          className="pr-12"
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 text-slate-500 hover:text-slate-900"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <Button type="submit" className="w-full" disabled={disabled || busy || loading}>
                {busy ? "Working..." : state === "recovery" ? "Save password" : state === "reset" ? "Send reset link" : "Sign in"}
              </Button>
            </form>

            {status ? (
              <div
                className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                  statusTone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {status}
              </div>
            ) : null}

            {state === "login" ? (
              <button
                type="button"
                className="mt-5 text-sm font-semibold text-primary hover:text-primary/80"
                onClick={() => {
                  setState("reset");
                  setStatus(null);
                  setStatusTone(null);
                }}
              >
                Forgot password?
              </button>
            ) : state === "reset" ? (
              <button
                type="button"
                className="mt-5 text-sm font-semibold text-primary hover:text-primary/80"
                onClick={() => {
                  setState("login");
                  setStatus(null);
                  setStatusTone(null);
                }}
              >
                Return to sign in
              </button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
