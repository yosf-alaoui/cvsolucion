import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingCountryLabel, getBookingCountryOptions, guessBookingCountryCode } from "@/lib/bookingTime";
import { getDetectedCountry } from "@/lib/geo";
import { validatePasswordPolicy } from "@shared/passwordPolicy";

type AuthMode = "login" | "signup";

export default function Login() {
  const { t, locale } = useI18n();
  const { login, signup, sendReset, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [countryCode, setCountryCode] = useState(() => guessBookingCountryCode(null));
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const signupPasswordMessage = mode === "signup" && password ? validatePasswordPolicy(password).message : null;
  const resetPasswordMessage = recoveryMode && newPassword ? validatePasswordPolicy(newPassword).message : null;

  const disabled = useMemo(() => {
    if (recoveryMode) return !resetToken || !newPassword || Boolean(resetPasswordMessage) || newPassword !== confirmPassword;
    if (resetMode) return !email;
    if (mode === "signup") return !email || !password || Boolean(signupPasswordMessage) || !acceptTerms || !countryCode;
    return !email || !password;
  }, [
    email,
    password,
    resetMode,
    recoveryMode,
    newPassword,
    confirmPassword,
    resetToken,
    mode,
    acceptTerms,
    countryCode,
    signupPasswordMessage,
    resetPasswordMessage,
  ]);

  const countryOptions = useMemo(() => getBookingCountryOptions(locale), [locale]);
  const selectedCountryLabel = useMemo(() => getBookingCountryLabel(countryCode, locale), [countryCode, locale]);
  const countryLabel = locale === "ar" ? "الدولة" : locale === "fr" ? "Pays" : "Country";
  const countryHint =
    locale === "ar"
      ? "نستعمل الدولة لإظهار السعر المناسب لحسابك."
      : locale === "fr"
        ? "Nous utilisons le pays pour afficher le bon tarif."
        : "We use the country to show the correct price.";

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

  useEffect(() => {
    let cancelled = false;
    getDetectedCountry()
      .then((response) => {
        if (cancelled || !response.countryCode) return;
        setCountryCode(guessBookingCountryCode(response.countryCode));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const termsHref = locale === "en" ? "/terms" : `/${locale}/terms`;
  const nextHref = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const rawNext = params.get("next")?.trim();
    if (!rawNext) return homeHref;
    if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      return rawNext;
    }
    return homeHref;
  }, [homeHref]);

  const mapAuthError = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("email_recipient_rejected") ||
      normalized.includes("all recipients were rejected") ||
      normalized.includes("recipient address rejected") ||
      normalized.includes("mailbox does not exist") ||
      normalized.includes("mailbox unavailable") ||
      normalized.includes("user unknown") ||
      normalized.includes("no such user") ||
      normalized.includes("invalid recipient")
    ) {
      return t("auth.invalidInbox");
    }
    if (
      normalized.includes("couldn't send the email right now") ||
      normalized.includes("unable to send the verification email right now") ||
      normalized.includes("delivery_failed")
    ) {
      return t("auth.emailDeliveryIssue");
    }
    return message;
  };

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
        if (resetPasswordMessage) {
          setStatus(resetPasswordMessage);
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
        if (!acceptTerms) {
          setStatus(locale === "ar" ? "يجب الموافقة على الشروط والأحكام أولاً." : locale === "fr" ? "Vous devez accepter les conditions d'utilisation avant de créer un compte." : "You must accept the Terms and Conditions before creating an account.");
          setStatusTone("error");
          return;
        }
        if (!countryCode) {
          setStatus(locale === "ar" ? "الدولة مطلوبة لإنشاء الحساب." : locale === "fr" ? "Le pays est obligatoire pour créer le compte." : "Country is required to create the account.");
          setStatusTone("error");
          return;
        }
        if (signupPasswordMessage) {
          setStatus(signupPasswordMessage);
          setStatusTone("error");
          return;
        }
        await signup(email, password, locale, acceptTerms, countryCode, selectedCountryLabel);
        setStatus(t("auth.checkEmail"));
        setStatusTone("success");
        setAcceptTerms(false);
      }
    } catch (err: any) {
      const rawMessage = String(err?.message || "");
      const message = rawMessage === "Please confirm your email before signing in."
        ? t("auth.unverifiedLogin")
        : rawMessage
          ? mapAuthError(rawMessage)
          : t("auth.genericError");
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

  const termsLabel = locale === "ar" ? "أوافق على الشروط والأحكام" : locale === "fr" ? "J'accepte les conditions d'utilisation" : "I agree to the Terms and Conditions";
  const termsHint = locale === "ar" ? "مطلوب لإنشاء الحساب." : locale === "fr" ? "Obligatoire pour créer le compte." : "Required to create the account.";
  const termsLinkLabel = locale === "ar" ? "قراءة الشروط" : locale === "fr" ? "Lire les conditions" : "Read terms";

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
                      setAcceptTerms(false);
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
                      {resetPasswordMessage ? <p className="text-xs text-destructive">{resetPasswordMessage}</p> : null}
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
                        {signupPasswordMessage ? <p className="text-xs text-destructive">{signupPasswordMessage}</p> : null}
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          className="text-xs font-semibold text-primary hover:text-primary/80"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                    ) : null}

                    {!resetMode && mode === "signup" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="signup-country">{countryLabel}</Label>
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger id="signup-country" className="w-full bg-white">
                              <SelectValue placeholder={countryLabel} />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((option) => (
                                <SelectItem key={option.code} value={option.code}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">{countryHint}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id="accept-terms"
                              checked={acceptTerms}
                              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                              className="mt-1"
                            />
                            <div className="space-y-1 text-sm">
                              <Label htmlFor="accept-terms" className="cursor-pointer leading-6 text-slate-700">
                                {termsLabel}
                              </Label>
                              <div className="text-xs text-muted-foreground">{termsHint}</div>
                              <a
                                href={termsHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-xs font-semibold text-primary hover:text-primary/80"
                              >
                                {termsLinkLabel}
                              </a>
                            </div>
                          </div>
                        </div>
                      </>
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
