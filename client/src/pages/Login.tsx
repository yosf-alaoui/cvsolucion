import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "signup";

export default function Login() {
  const { t, locale } = useI18n();
  const { login, signup, sendReset, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const disabled = useMemo(() => {
    if (recoveryMode) return !resetToken || !newPassword || newPassword !== confirmPassword;
    if (resetMode) return !email;
    return !email || !password;
  }, [email, password, resetMode, recoveryMode, newPassword, confirmPassword, resetToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("mode");
    const reset = params.get("reset");
    const recovery = params.get("recovery");
    const token = params.get("token");
    const magic = params.get("magic");

    if (next === "signup" || next === "login") {
      setMode(next);
    }
    if (reset === "success") {
      setStatus(t("auth.resetSuccess"));
      setStatusTone("success");
    }
    if (magic === "disabled" || next === "magic") {
      setMode("login");
      setStatus(t("auth.magicDisabled"));
      setStatusTone("error");
    }
    if ((recovery === "1" || recovery === "true") && token) {
      setRecoveryMode(true);
      setResetMode(false);
      setResetToken(token);
    }
  }, [t]);

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const nextHref = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const rawNext = params.get("next")?.trim();
    if (!rawNext) return homeHref;
    if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      return rawNext;
    }
    return homeHref;
  }, [homeHref]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setStatusTone(null);

    try {
      if (recoveryMode) {
        if (newPassword !== confirmPassword) {
          setStatus(t("auth.passwordMismatch"));
          setStatusTone("error");
          return;
        }
        await resetPassword(resetToken, newPassword);
        window.location.href = `${loginHref}?mode=login&reset=success`;
        return;
      }

      if (resetMode) {
        if (!email) {
          setStatus(t("auth.resetMissingEmail"));
          setStatusTone("error");
          emailRef.current?.focus();
          emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        await sendReset(email, locale);
        setStatus(t("auth.resetSent"));
        setStatusTone("success");
        return;
      }

      if (mode === "login") {
        await login(email, password);
        window.location.href = nextHref;
      } else {
        await signup(email, password, locale);
        setStatus(t("auth.checkEmail"));
        setStatusTone("success");
      }
    } catch (err: any) {
      const message = err?.message === "Please confirm your email before signing in."
        ? t("auth.unverifiedLogin")
        : err?.message || t("auth.genericError");
      setStatus(message);
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = () => {
    setResetMode(true);
    setStatus(null);
    setStatusTone(null);
    emailRef.current?.focus();
    emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title={`${t("auth.signIn")} | CVsolucion`}
        description={t("auth.subtitle")}
        robots="noindex, nofollow"
        type="website"
      />
      <Header />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="glass-card-strong card-static rounded-2xl p-8">
              <h1 className="text-2xl font-bold text-primary">
                {t(mode === "signup" ? "auth.signUp" : "auth.signIn")}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">{t("auth.subtitle")}</p>

              <div className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant={mode === "login" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setMode("login");
                    setResetMode(false);
                    setRecoveryMode(false);
                    setResetToken("");
                    setStatus(null);
                    setStatusTone(null);
                  }}
                  disabled={recoveryMode}
                >
                  {t("auth.login")}
                </Button>
                <Button
                  type="button"
                  variant={mode === "signup" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setMode("signup");
                    setResetMode(false);
                    setRecoveryMode(false);
                    setResetToken("");
                    setStatus(null);
                    setStatusTone(null);
                  }}
                  disabled={recoveryMode}
                >
                  {t("auth.signup")}
                </Button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {recoveryMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder={t("auth.newPasswordPlaceholder")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={disabled || busy}>
                      {busy ? t("auth.working") : t("auth.savePassword")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("auth.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        ref={emailRef}
                      />
                    </div>

                    {!resetMode ? (
                      <div className="space-y-2">
                        <Label htmlFor="password">{t("auth.password")}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="pr-16"
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder={t("auth.passwordPlaceholder")}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          className="text-xs font-semibold text-primary hover:text-primary/80"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                    ) : null}

                    <Button type="submit" className="w-full" disabled={disabled || busy}>
                      {busy ? t("auth.working") : t("auth.submit")}
                    </Button>
                  </>
                )}
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

              <p className="mt-4 text-xs text-muted-foreground">{t("auth.note")}</p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
