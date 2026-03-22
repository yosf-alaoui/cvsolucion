import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Header Component - CV Solucion
 *
 * - Floating transparent header
 * - Centered menu items (Services / Packages / FAQ)
 * - Desktop: Language switch + WhatsApp on the right
 * - Mobile: Language switch inside the opened menu only
 */
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

  // Build locale href while keeping pathname + search + hash
  const getLocaleHref = (target: "en" | "fr" | "ar") => {
    if (typeof window === "undefined") {
      if (target === "fr") return "/fr";
      if (target === "ar") return "/ar";
      return "/";
    }

    const { pathname, search, hash } = window.location;

    const stripLocale = (p: string) => {
      if (p === "/fr" || p === "/ar") return "/";
      if (p.startsWith("/fr/")) return p.replace(/^\/fr/, "") || "/";
      if (p.startsWith("/ar/")) return p.replace(/^\/ar/, "") || "/";
      return p;
    };

    const addLocale = (p: string, loc: "en" | "fr" | "ar") => {
      const clean = stripLocale(p);
      if (loc === "en") return clean;
      const prefix = loc === "fr" ? "/fr" : "/ar";
      return clean === "/" ? prefix : `${prefix}${clean}`;
    };

    const base = stripLocale(pathname);
    const nextPath = addLocale(base, target);

    return `${nextPath}${search}${hash}`;
  };

  const enHref = getLocaleHref("en");
  const frHref = getLocaleHref("fr");
  const arHref = getLocaleHref("ar");

  const whatsappHref = useMemo(() => {
    return buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));
  }, [t]);

  const trainingHref = locale === "en" ? "/training" : `/${locale}/training`;
  const designPricingHref = locale === "en" ? "/design-pricing" : `/${locale}/design-pricing`;
  const articlesHref = locale === "en" ? "/articles" : `/${locale}/articles`;
  const dashboardHref = locale === "en" ? "/dashboard" : `/${locale}/dashboard`;
  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const isAuthed = Boolean(user?.id);
  const articlesLabel = locale === "ar" ? "المقالات" : locale === "fr" ? "Articles" : "Articles";

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      const base = locale === "en" ? "/" : `/${locale}`;
      window.location.href = `${base}#${sectionId}`;
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout().catch(() => {});
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="mt-3 rounded-2xl border border-white/25 bg-white/85 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <a
              href={locale === "en" ? "/" : `/${locale}` }
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="CV Solucion Logo"
                className="h-10 sm:h-11 md:h-12 w-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
              />
            </a>

            {/* Desktop Navigation (center) */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
              <a
                href={trainingHref}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{t("nav.training")}</a>

              <a
                href={designPricingHref}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{t("nav.designPricing")}</a>

              <a
                href={articlesHref}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{articlesLabel}</a>

              {isAuthed && isAdmin ? (
                <a
                  href={dashboardHref}
                  className="text-foreground hover:text-primary transition-colors font-semibold"
                >
                  Dashboard
                </a>
              ) : null}

              <button
                onClick={() => scrollToSection("services")}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{t("nav.services")}</button>
              <button
                onClick={() => scrollToSection("packages")}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{t("nav.packages")}</button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-foreground hover:text-primary transition-colors font-semibold"
              >{t("nav.faq")}</button>
            </nav>

            {/* Desktop Right: Language + Account + WhatsApp */}
            <div className="hidden md:flex items-center justify-end gap-3">
              {!isAuthed ? (
                <a
                  href={loginHref}
                  className="text-foreground hover:text-primary transition-colors font-semibold"
                >
                  {t("auth.signInUp")}
                </a>
              ) : (
                <button
                  type="button"
                  className="text-foreground hover:text-primary transition-colors font-semibold"
                  onClick={handleSignOut}
                >
                  {t("auth.signOut")}
                </button>
              )}

              <div
                data-testid="lang-switch-desktop"
                className="relative"
                ref={langMenuRef}
              >
                <button
                  type="button"
                  onClick={() => setIsLangOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-1 text-sm font-semibold text-foreground backdrop-blur hover:bg-white/80 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={isLangOpen}
                >
                  {t("nav.languageLabel")}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-white/95 shadow-lg backdrop-blur p-1">
                    <a
                      href={enHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "en"
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.english")}
                    </a>
                    <a
                      href={frHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "fr"
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.french")}
                    </a>
                    <a
                      href={arHref}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        locale === "ar"
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-white/80"
                      }`}
                      onClick={() => setIsLangOpen(false)}
                    >
                      {t("nav.arabic")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl hover:bg-white/30 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-white/20 px-4 py-4 space-y-2">
              <div data-testid="lang-switch-mobile" className="pt-1 pb-2">
                <div className="relative" ref={mobileLangMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsLangOpen((v) => !v)}
                    className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-white/70 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur hover:bg-white/80 transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={isLangOpen}
                  >
                    {t("nav.languageLabel")}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isLangOpen && (
                    <div className="mt-2 w-full rounded-xl border border-border bg-white/95 shadow-lg backdrop-blur p-1">
                      <a
                        href={enHref}
                        className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          locale === "en"
                            ? "bg-primary text-white"
                            : "text-foreground hover:bg-white/80"
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
                          locale === "fr"
                            ? "bg-primary text-white"
                            : "text-foreground hover:bg-white/80"
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
                          locale === "ar"
                            ? "bg-primary text-white"
                            : "text-foreground hover:bg-white/80"
                        }`}
                        onClick={() => {
                          setIsLangOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {t("nav.arabic")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <a
                href={trainingHref}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >{t("nav.training")}</a>

              <a
                href={designPricingHref}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >{t("nav.designPricing")}</a>

              {isAuthed && isAdmin ? (
                <a
                  href={dashboardHref}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </a>
              ) : null}

              <a
                href={articlesHref}
                className="text-foreground hover:text-primary transition-colors font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                {articlesLabel}
              </a>

              <button
                onClick={() => scrollToSection("services")}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
              >{t("nav.services")}</button>
              <button
                onClick={() => scrollToSection("packages")}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
              >{t("nav.packages")}</button>
              <button
                onClick={() => scrollToSection("faq")}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
              >{t("nav.faq")}</button>

              {!isAuthed ? (
                <a
                  href={loginHref}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
                >
                  {t("auth.signInUp")}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold"
                >
                  {t("auth.signOut")}
                </button>
              )}

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
