import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpenCheck,
  Boxes,
  CalendarDays,
  ChevronDown,
  Code2,
  Cpu,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  LogOut,
  Mail,
  Menu,
  ShoppingCart,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";
import { getBookingCheckoutCount, getBookingCheckoutEventName } from "@/lib/bookingCheckout";
import { navigateToHomeSection } from "@/lib/sectionNavigation";
import { SEO_SERVICE_PAGE_ORDER, SEO_SERVICE_PAGES } from "@shared/seoServicePages";
import { getSeoServicePageContent } from "@shared/seoServicePageLocales";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement | null>(null);
  const [location] = useLocation();

  const { locale, t } = useI18n();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncCart = () => {
      if (authLoading || !user?.id) {
        setCartCount(0);
        return;
      }
      setCartCount(getBookingCheckoutCount(user.id));
    };
    syncCart();
    const eventName = getBookingCheckoutEventName();
    window.addEventListener(eventName, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(eventName, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, [authLoading, user?.id]);

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

  useEffect(() => {
    setIsMenuOpen(false);
    setIsLangOpen(false);
  }, [location]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewportState = () => {
      if (window.innerWidth >= 1280) {
        setIsMenuOpen(false);
      }
    };

    syncViewportState();
    window.addEventListener("resize", syncViewportState);
    return () => window.removeEventListener("resize", syncViewportState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (window.innerWidth >= 1280) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMenuOpen]);

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
  const localizeSitePath = (path: string) =>
    locale === "en" ? path : path === "/" ? `/${locale}` : `/${locale}${path}`;
  const homeHref = prefix || "/";
  const trainingHref = `${prefix}/training`;
  const designPricingHref = `${prefix}/design-pricing`;
  const articlesHref = `${prefix}/articles`;
  const guidesHref = `${prefix}/guides`;
  const aboutHref = `${prefix}/about`;
  const dashboardHref = `${prefix}/dashboard`;
  const loginHref = `${prefix}/login`;
  const bookingHref = getBookingHref(locale);
  const cartHref = locale === "en" ? "/book/cart" : `/${locale}/book/cart`;
  const isAuthed = Boolean(user?.id);

  const articlesLabel = locale === "ar" ? "المقالات" : "Articles";
  const guidesLabel = locale === "ar" ? "الأدلة" : "Guides";
  const aboutLabel = locale === "ar" ? "من نحن" : locale === "fr" ? "A propos" : "About";
  const contactLabel = locale === "ar" ? "تواصل" : locale === "fr" ? "Contact" : "Contact";
  const bookLabel = locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver" : "Book";
  const cartLabel = locale === "ar" ? "السلة" : locale === "fr" ? "Panier" : "Cart";
  const servicesOverviewLabel =
    locale === "ar" ? "كل الخدمات" : locale === "fr" ? "Vue d'ensemble des services" : "Services overview";
  const formationsLabel = locale === "ar" ? "التكوين" : locale === "fr" ? "Formations" : "Training";
  const solutionsLabel = locale === "ar" ? "الحلول" : locale === "fr" ? "Solutions" : "Solutions";
  const resourcesLabel = locale === "ar" ? "الموارد" : locale === "fr" ? "Ressources" : "Resources";
  const profileLabel = locale === "ar" ? "الحساب" : locale === "fr" ? "Profil" : "Profile";
  const accountLabel = locale === "ar" ? "حسابي" : locale === "fr" ? "Mon compte" : "My account";
  const languageAriaLabel = locale === "ar" ? "تغيير اللغة" : locale === "fr" ? "Changer de langue" : "Change language";
  const visibleCartCount = isAuthed ? cartCount : 0;
  const cartButtonLabel = visibleCartCount > 0 ? `${cartLabel} (${visibleCartCount})` : cartLabel;
  const serviceMenuLinks = SEO_SERVICE_PAGE_ORDER.map((key) => {
    const page = SEO_SERVICE_PAGES[key];
    const content = getSeoServicePageContent(page, locale);
    return {
      href: localizeSitePath(page.canonicalPath),
      label: content.shortTitle,
    };
  });

  const trainingMenu = [
    {
      href: trainingHref,
      label: t("nav.training"),
      description:
        locale === "ar"
          ? "مستويات تكوين عملية حسب خبرة فريقك."
          : locale === "fr"
            ? "Parcours de formation structure par niveau."
            : "Structured training paths by skill level.",
      icon: GraduationCap,
    },
    {
      action: () => scrollToSection("packages"),
      label: t("nav.packages"),
      description:
        locale === "ar"
          ? "باقات تدخل واضحة للتدريب والدعم."
          : locale === "fr"
            ? "Offres claires pour support et intervention."
            : "Clear intervention packages and support plans.",
      icon: Boxes,
    },
    {
      href: designPricingHref,
      label: t("nav.designPricing"),
      description:
        locale === "ar"
          ? "تنظيم التسعير والتقارير ومخرجات الإنتاج."
          : locale === "fr"
            ? "Structurer devis, rapports et logique atelier."
            : "Organize pricing, reports, and production logic.",
      icon: Gauge,
    },
  ] as const;

  const serviceIcons = [Wrench, Boxes, Cpu, Gauge, BookOpenCheck, Code2];
  const solutionsMenu = [
    {
      action: () => scrollToSection("services"),
      label: servicesOverviewLabel,
      description:
        locale === "ar"
          ? "نظرة سريعة على كل مسارات الخدمة."
          : locale === "fr"
            ? "Vue rapide de tous les parcours de service."
            : "Quick overview of every service path.",
      icon: BookOpenCheck,
      featured: true,
    },
    ...serviceMenuLinks.map((link, index) => ({
      href: link.href,
      label: link.label,
      description:
        locale === "ar"
          ? "صفحة مفصلة خاصة بهذه الخدمة."
          : locale === "fr"
            ? "Page detaillee pour ce service."
            : "Dedicated page for this service.",
      icon: serviceIcons[index] ?? Wrench,
    })),
  ] as const;

  const resourcesMenu = [
    {
      href: articlesHref,
      label: articlesLabel,
      description:
        locale === "ar"
          ? "مقالات عملية من مشاكل حقيقية في الورش."
          : locale === "fr"
            ? "Articles pratiques issus de vrais cas atelier."
            : "Practical articles from real production cases.",
      icon: FileText,
    },
    {
      href: guidesHref,
      label: guidesLabel,
      description:
        locale === "ar"
          ? "أدلة تشخيص مباشرة للمشاكل المتكررة."
          : locale === "fr"
            ? "Guides directs pour les problemes recurrents."
            : "Direct guides for the most common issues.",
      icon: BookOpenCheck,
    },
    {
      action: () => scrollToSection("faq"),
      label: t("nav.faq"),
      description:
        locale === "ar"
          ? "إجابات سريعة قبل التواصل أو الحجز."
          : locale === "fr"
            ? "Reponses rapides avant prise de contact."
            : "Fast answers before you contact or book.",
      icon: Mail,
    },
  ] as const;

  const scrollToSection = (sectionId: string) => {
    navigateToHomeSection(locale, sectionId);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout().catch(() => {});
    setIsMenuOpen(false);
  };

  const renderDesktopDropdown = (
    title: string,
    badge: string,
    description: string,
    items: readonly {
      href?: string;
      action?: () => void;
      label: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      featured?: boolean;
    }[],
    widthClass: string,
    columnsClass = "grid-cols-1",
  ) => (
    <DropdownMenuContent
      align="center"
      sideOffset={14}
      className={`w-[min(92vw,26rem)] ${widthClass} overflow-hidden rounded-[28px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 backdrop-blur-2xl`}
    >
      <div className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_52%),linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.96)_100%)] px-5 py-4">
        <div className="text-[11px] font-black uppercase tracking-[0.26em] text-primary/75">{badge}</div>
        <div className="mt-2 text-lg font-bold text-slate-950">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className={`grid gap-2 p-3 ${columnsClass}`}>
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`group flex min-h-[84px] items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                item.featured
                  ? "border-primary/20 bg-primary/[0.06] shadow-[0_10px_25px_rgba(30,58,138,0.08)] hover:border-primary/35 hover:bg-primary/[0.09]"
                  : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  item.featured ? "bg-primary text-white" : "bg-slate-100 text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
              </span>
            </div>
          );

          if (item.href) {
            return (
              <DropdownMenuItem key={item.label} asChild className="cursor-pointer rounded-2xl p-0 focus:bg-transparent">
                <a href={item.href}>{content}</a>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={item.label}
              className="cursor-pointer rounded-2xl p-0 focus:bg-transparent"
              onSelect={(event) => {
                event.preventDefault();
                item.action?.();
              }}
            >
              {content}
            </DropdownMenuItem>
          );
        })}
      </div>
    </DropdownMenuContent>
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mt-2 rounded-[22px] border border-white/35 bg-white/88 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur-lg sm:mt-3 sm:rounded-2xl sm:bg-white/85 sm:shadow-xl sm:backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <a href={homeHref} className="flex items-center transition-opacity hover:opacity-90">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img
                  src="/logo.png"
                  alt="CV Solucion Logo"
                  width={1600}
                  height={533}
                  decoding="async"
                  className="h-9 w-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] sm:h-11 md:h-12"
                />
              </picture>
            </a>

            <nav className="hidden flex-1 items-center justify-center gap-4 xl:flex 2xl:gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-semibold text-foreground transition-all hover:bg-white/60 hover:text-primary data-[state=open]:bg-white/75 data-[state=open]:text-primary"
                  >
                    {formationsLabel}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                {renderDesktopDropdown(
                  formationsLabel,
                  locale === "ar" ? "برامج" : locale === "fr" ? "Parcours" : "Programs",
                  locale === "ar"
                    ? "اختر نوع التكوين أو الباقة الأنسب قبل بدء التنفيذ."
                    : locale === "fr"
                      ? "Choisissez le bon parcours avant de lancer votre implementation."
                      : "Choose the right path before you start implementation.",
                  trainingMenu,
                  "max-w-[28rem]",
                )}
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-semibold text-foreground transition-all hover:bg-white/60 hover:text-primary data-[state=open]:bg-white/75 data-[state=open]:text-primary"
                  >
                    {solutionsLabel}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                {renderDesktopDropdown(
                  solutionsLabel,
                  locale === "ar" ? "خدمات" : locale === "fr" ? "Services" : "Services",
                  locale === "ar"
                    ? "مسارات خدمة متخصصة حسب نوع المشكلة أو مرحلة المشروع."
                    : locale === "fr"
                      ? "Des parcours specialises selon le probleme ou l'etape du projet."
                      : "Specialized service paths based on the problem and project stage.",
                  solutionsMenu,
                  "max-w-[42rem]",
                  "grid-cols-2",
                )}
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-semibold text-foreground transition-all hover:bg-white/60 hover:text-primary data-[state=open]:bg-white/75 data-[state=open]:text-primary"
                  >
                    {resourcesLabel}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                {renderDesktopDropdown(
                  resourcesLabel,
                  locale === "ar" ? "محتوى" : locale === "fr" ? "Contenu" : "Content",
                  locale === "ar"
                    ? "مراجع ومقالات وأجوبة سريعة قبل التواصل أو الحجز."
                    : locale === "fr"
                      ? "Guides, articles et reponses rapides avant contact."
                      : "Guides, articles, and fast answers before you contact us.",
                  resourcesMenu,
                  "max-w-[29rem]",
                )}
              </DropdownMenu>

              <a href={aboutHref} className="font-semibold text-foreground transition-colors hover:text-primary">
                {aboutLabel}
              </a>
            </nav>

            <div className="hidden items-center justify-end gap-2 xl:flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 bg-white/70 px-4 backdrop-blur"
                onClick={() => scrollToSection("contact")}
              >
                <Mail className="h-4 w-4" />
                {contactLabel}
              </Button>

              <Button asChild size="sm" className="rounded-full bg-primary px-4 text-white shadow-sm hover:bg-primary/90">
                <a
                  href={bookingHref}
                  target={bookingHref.startsWith("http") ? "_blank" : undefined}
                  rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <CalendarDays className="h-4 w-4" />
                  {bookLabel}
                </a>
              </Button>

              <Button
                asChild
                variant={visibleCartCount > 0 ? "default" : "outline"}
                size="icon"
                aria-label={cartLabel}
                className={`relative h-9 w-9 rounded-full backdrop-blur ${
                  visibleCartCount > 0 ? "bg-primary text-white shadow-sm hover:bg-primary/90" : "border-slate-200 bg-white/75"
                }`}
              >
                <a href={cartHref}>
                  <ShoppingCart className="h-4 w-4" />
                  {visibleCartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                      {visibleCartCount}
                    </span>
                  ) : null}
                </a>
              </Button>

              {!isAuthed ? (
                <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-200 bg-white/70 backdrop-blur" aria-label={t("auth.signInUp")}>
                  <a href={loginHref}>
                    <UserRound className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-foreground backdrop-blur transition-colors hover:bg-white/90"
                      aria-label={profileLabel}
                    >
                      <UserRound className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-200 bg-white/95 p-2 backdrop-blur-xl">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 font-semibold">
                      <a href={dashboardHref}>
                        <UserRound className="h-4 w-4" />
                        {accountLabel}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 font-semibold">
                      <a href={cartHref}>
                        <ShoppingCart className="h-4 w-4" />
                        {cartButtonLabel}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl px-3 py-2 font-semibold"
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("auth.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div data-testid="lang-switch-desktop" className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen((value) => !value)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 text-foreground backdrop-blur transition-colors hover:bg-white/80"
                  aria-haspopup="menu"
                  aria-expanded={isLangOpen}
                  aria-label={languageAriaLabel}
                >
                  <Globe2 className="h-4 w-4" />
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
              onClick={() => {
                setIsLangOpen(false);
                setIsMenuOpen((value) => !value);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/65 transition-colors hover:bg-white/80 active:scale-[0.98] xl:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
            </button>
          </div>

          {isMenuOpen ? (
            <div className="border-t border-slate-200/70 bg-white/92 px-3 pb-4 pt-4 backdrop-blur-xl xl:hidden">
              <div className="max-h-[calc(100svh-5.75rem)] space-y-4 overflow-y-auto overscroll-contain pr-1">
              <div className="grid gap-2 sm:grid-cols-3">
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
                <Button type="button" variant="outline" className="w-full rounded-full bg-white/80" onClick={() => scrollToSection("contact")}>
                  <Mail className="h-4 w-4" />
                  {contactLabel}
                </Button>
                <Button
                  asChild
                  variant={visibleCartCount > 0 ? "default" : "outline"}
                  className={`relative w-full rounded-full ${visibleCartCount > 0 ? "bg-primary text-white hover:bg-primary/90" : "bg-white/80"}`}
                >
                  <a href={cartHref} onClick={() => setIsMenuOpen(false)}>
                    <ShoppingCart className="h-4 w-4" />
                    {cartButtonLabel}
                    {visibleCartCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                        {visibleCartCount}
                      </span>
                    ) : null}
                  </a>
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {!isAuthed ? (
                  <a
                    href={loginHref}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4" />
                    {t("auth.signInUp")}
                  </a>
                ) : (
                  <a
                    href={dashboardHref}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4" />
                    {accountLabel}
                  </a>
                )}

                <div data-testid="lang-switch-mobile" className="relative" ref={mobileLangMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsLangOpen((value) => !value)}
                    className="inline-flex w-full items-center justify-between rounded-xl border border-border bg-white/70 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/80"
                    aria-haspopup="menu"
                    aria-expanded={isLangOpen}
                    aria-label={languageAriaLabel}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe2 className="h-4 w-4" />
                      {t("nav.languageLabel")}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isLangOpen ? (
                    <div className="mt-2 w-full rounded-xl border border-border bg-white/95 p-1 shadow-lg backdrop-blur">
                      {[
                        [enHref, "en", t("nav.english")],
                        [frHref, "fr", t("nav.french")],
                        [arHref, "ar", t("nav.arabic")],
                      ].map(([href, key, label]) => (
                        <a
                          key={key}
                          href={href}
                          className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            locale === key ? "bg-primary text-white" : "text-foreground hover:bg-white/80"
                          }`}
                          onClick={() => {
                            setIsLangOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          {label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/72 p-2 shadow-sm">
                <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-500">{formationsLabel}</div>
                <a href={trainingHref} className="block rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.training")}
                </a>
                <button type="button" onClick={() => scrollToSection("packages")} className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40">
                  {t("nav.packages")}
                </button>
                <a href={designPricingHref} className="block rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.designPricing")}
                </a>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/72 p-2 shadow-sm">
                <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-500">{solutionsLabel}</div>
                <button type="button" className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40" onClick={() => scrollToSection("services")}>
                  {servicesOverviewLabel}
                </button>
                {serviceMenuLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-white/40 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/72 p-2 shadow-sm">
                <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-500">{resourcesLabel}</div>
                <a href={articlesHref} className="block rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40" onClick={() => setIsMenuOpen(false)}>
                  {articlesLabel}
                </a>
                <a href={guidesHref} className="block rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40" onClick={() => setIsMenuOpen(false)}>
                  {guidesLabel}
                </a>
                <button type="button" onClick={() => scrollToSection("faq")} className="block w-full rounded-lg px-3 py-2 text-left font-semibold transition-colors hover:bg-white/40">
                  {t("nav.faq")}
                </button>
              </div>

              <a
                href={aboutHref}
                className="block w-full rounded-xl bg-white/35 px-5 py-3 text-left font-semibold transition-colors hover:bg-white/50"
                onClick={() => setIsMenuOpen(false)}
              >
                {aboutLabel}
              </a>

              {isAuthed ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full rounded-xl bg-white/35 px-5 py-3 text-left font-semibold transition-colors hover:bg-white/50"
                >
                  {t("auth.signOut")}
                </button>
              ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
