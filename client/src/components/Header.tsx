import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Mail, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement | null>(null);

  const { locale, t } = useI18n();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!isLangOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const inDesktop = langMenuRef.current?.contains(target);
      const inMobile = mobileLangMenuRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isLangOpen]);

  const getLocaleHref = (target: "en" | "fr" | "ar") => {
    if (typeof window === "undefined") {
      if (target === "fr") return "/fr";
      if (target === "ar") return "/ar";
      return "/";
    }

    const { pathname, search, hash } = window.location;

    const stripLocale = (value: string) => {
      if (value === "/fr" || value === "/ar") return "/";
      if (value.startsWith("/fr/")) return value.replace(/^\/fr/, "") || "/";
      if (value.startsWith("/ar/")) return value.replace(/^\/ar/, "") || "/";
      return value;
    };

    const addLocale = (value: string, nextLocale: "en" | "fr" | "ar") => {
      const clean = stripLocale(value);
      if (nextLocale === "en") return clean;
      const prefix = nextLocale === "fr" ? "/fr" : "/ar";
      return clean === "/" ? prefix : `${prefix}${clean}`;
    };

    return `${addLocale(pathname, target)}${search}${hash}`;
  };

  const enHref = getLocaleHref("en");
  const frHref = getLocaleHref("fr");
  const arHref = getLocaleHref("ar");
  const prefix = locale === "en" ? "" : `/${locale}`;
  const homeHref = prefix || "/";
  const trainingHref = `${prefix}/training`;
  const designPricingHref = `${prefix}/design-pricing`;
  const articlesHref = `${prefix}/articles`;
  const aboutHref = `${prefix}/about`;
  const dashboardHref = `${prefix}/dashboard`;
  const loginHref = `${prefix}/login`;
  const contactHref = `${homeHref}#contact`;
  const bookingHref = getBookingHref(locale);
  const isAuthed = Boolean(user?.id);

  const articlesLabel = locale === "ar" ? "المقالات" : "Articles";
  const aboutLabel = locale === "ar" ? "من نحن" : locale === "fr" ? "A propos" : "About";
  const contactLabel = locale === "ar" ? "تواصل" : locale === "fr" ? "Contact" : "Contact";
  const bookLabel = locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver" : "Book";

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.location.href = `${homeHref}#${sectionId}`;
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout().catch(() => {});
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="mt-3 rounded-2xl border border-white/25 bg-white/85 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <a href={homeHref} className="flex items-center transition-opacity hover:opacity-90">
              <img
                src="/logo.png"
                alt="CV Solucion Logo"
                className="h-10 w-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] sm:h-11 md:h-12"
              />
            </a>

            <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
              <a href={trainingHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                {t("nav.training")}
              </a>
              <a href={designPricingHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                {t("nav.designPricing")}
              </a>
              <a href={articlesHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                {articlesLabel}
              </a>
              <a href={aboutHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                {aboutLabel}
              </a>
              {isAuthed && isAdmin ? (
                <a href={dashboardHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                  Dashboard
                </a>
              ) : null}
              <button
                onClick={() => scrollToSection("services")}
                className="font-semibold text-foreground transition-colors hover:text-primary"
              >
                {t("nav.services")}
              </button>
              <button
                onClick={() => scrollToSection("packages")}
                className="font-semibold text-foreground transition-colors hover:text-primary"
              >
                {t("nav.packages")}
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="font-semibold text-foreground transition-colors hover:text-primary"
              >
                {t("nav.faq")}
              </button>
            </nav>

            <div className="hidden items-center justify-end gap-3 md:flex">
              <Button asChild variant="outline" size="sm" className="rounded-full border-slate-200 bg-white/75 backdrop-blur">
                <a href={contactHref}>
                  <Mail className="h-4 w-4" />
                  {contactLabel}
                </a>
              </Button>

              <Button asChild size="sm" className="rounded-full bg-primary text-white shadow-sm hover:bg-primary/90">
                <a
                  href={bookingHref}
                  target={bookingHref.startsWith("http") ? "_blank" : undefined}
                  rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <CalendarDays className="h-4 w-4" />
                  {bookLabel}
                </a>
              </Button>

              {!isAuthed ? (
                <a href={loginHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                  {t("auth.signInUp")}
                </a>
              ) : (
                <button
                  type="button"
                  className="font-semibold text-foreground transition-colors hover:text-primary"
                  onClick={handleSignOut}
                >
                  {t("auth.signOut")}
                </button>
              )}

              <div data-testid="lang-switch-desktop" className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-1 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/80"
                  aria-haspopup="menu"
                  aria-expanded={isLangOpen}
                >
                  {t("nav.languageLabel")}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isLangOpen ? (
                  <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-white/95 p-1 shadow-lg backdrop-blur">
                    <a
                      href={enHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "en" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.english")}
                    </a>
                    <a
                      href={frHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "fr" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.french")}
                    </a>
                    <a
                      href={arHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "ar" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.arabic")}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => setIsMenuOpen((value) => !value)}
              className="rounded-xl p-2 transition-colors hover:bg-white/30 md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
            </button>
          </div>

          {isMenuOpen ? (
            <div className="space-y-2 border-t border-white/20 px-4 py-4 md:hidden">
              <div data-testid="lang-switch-mobile" className="pb-2 pt-1">
                <div className="relative" ref={mobileLangMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsLangOpen((value) => !value)}
                    className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-white/70 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/80"
                    aria-haspopup="menu"
                    aria-expanded={isLangOpen}
                  >
                    {t("nav.languageLabel")}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isLangOpen ? (
                    <div className="mt-2 w-full rounded-xl border border-border bg-white/95 p-1 shadow-lg backdrop-blur">
                      <a
                        href={enHref}
                        className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          locale === "en" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                        }`}
                        onClick={() => {
                          setIsLangOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {t("nav.english")}
                      </a>
                      <a
                        href={frHref}
                        className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          locale === "fr" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                        }`}
                        onClick={() => {
                          setIsLangOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {t("nav.french")}
                      </a>
                      <a
                        href={arHref}
                        className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          locale === "ar" ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                        }`}
                        onClick={() => {
                          setIsLangOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {t("nav.arabic")}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              <a
                href={trainingHref}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.training")}
              </a>
              <a
                href={designPricingHref}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.designPricing")}
              </a>
              <a
                href={articlesHref}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                onClick={() => setIsMenuOpen(false)}
              >
                {articlesLabel}
              </a>
              <a
                href={aboutHref}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                onClick={() => setIsMenuOpen(false)}
              >
                {aboutLabel}
              </a>
              {isAuthed && isAdmin ? (
                <a
                  href={dashboardHref}
                  className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </a>
              ) : null}
              <button
                onClick={() => scrollToSection("services")}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
              >
                {t("nav.services")}
              </button>
              <button
                onClick={() => scrollToSection("packages")}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
              >
                {t("nav.packages")}
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
              >
                {t("nav.faq")}
              </button>

              {!isAuthed ? (
                <a
                  href={loginHref}
                  className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                >
                  {t("auth.signInUp")}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/30"
                >
                  {t("auth.signOut")}
                </button>
              )}

              <div className="grid gap-2 pt-2">
                <Button asChild variant="outline" className="w-full rounded-full bg-white/80">
                  <a href={contactHref} onClick={() => setIsMenuOpen(false)}>
                    <Mail className="h-4 w-4" />
                    {contactLabel}
                  </a>
                </Button>
                <Button asChild className="w-full rounded-full bg-primary text-white hover:bg-primary/90">
                  <a
                    href={bookingHref}
                    target={bookingHref.startsWith("http") ? "_blank" : undefined}
                    rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {bookLabel}
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
