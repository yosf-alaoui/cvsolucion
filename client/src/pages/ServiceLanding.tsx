import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  ChevronDown,
  Cpu,
  Gauge,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { WHATSAPP_PHONE, getBookingHref } from "@/lib/site";
import { navigateToHomeSection } from "@/lib/sectionNavigation";
import {
  getSeoServicePageByCanonicalPath,
  type SeoServicePage,
  type SeoServicePageBlock,
  type SeoServicePageKey,
} from "@shared/seoServicePages";
import { getSeoServicePageContent } from "@shared/seoServicePageLocales";

const serviceIcons: Record<SeoServicePageKey, typeof ShieldCheck> = {
  support: ShieldCheck,
  troubleshooting: Wrench,
  "library-setup": Boxes,
  "cnc-integration": Cpu,
  "performance-optimization": Gauge,
  "install-backup-restore": Settings2,
  "custom-programming": BookOpenCheck,
};

const routeDetails = {
  en: {
    "/training": {
      title: "Training",
      description: "Remote Cabinet Vision training for designers, engineers, and production teams.",
    },
    "/design-pricing": {
      title: "Design & Pricing",
      description: "Structure quoting logic, reports, and production-ready pricing workflows.",
    },
    "/articles": {
      title: "Articles",
      description: "Read implementation lessons, troubleshooting insights, and production case studies.",
    },
    "/about": {
      title: "About",
      description: "Learn how CVsolucion works with cabinet shops on real production problems.",
    },
    "/book": {
      title: "Book consultation",
      description: "Open the booking flow and reserve a support or consulting session.",
    },
  },
  fr: {
    "/training": {
      title: "Formation",
      description: "Formation Cabinet Vision a distance pour designers, ingenieurs et production.",
    },
    "/design-pricing": {
      title: "Design & Pricing",
      description: "Structurer la logique de devis, les rapports et les sorties production.",
    },
    "/articles": {
      title: "Articles",
      description: "Consulter les retours terrain, lessons d'implementation et guides pratiques.",
    },
    "/about": {
      title: "A propos",
      description: "Comprendre comment CVsolucion intervient sur les workflows atelier reels.",
    },
    "/book": {
      title: "Reserver",
      description: "Ouvrir le booking et reserver une session de support ou de consultation.",
    },
  },
  ar: {
    "/training": {
      title: "التدريب",
      description: "تدريب Cabinet Vision عن بعد للمصممين والمهندسين وفرق الإنتاج.",
    },
    "/design-pricing": {
      title: "التصميم والتسعير",
      description: "هيكلة منطق التسعير والتقارير ومخرجات الإنتاج بشكل منظم.",
    },
    "/articles": {
      title: "المقالات",
      description: "اقرأ دروس التنفيذ وأفكار التشخيص ودراسات الحالة من أرض الواقع.",
    },
    "/about": {
      title: "من نحن",
      description: "تعرّف على طريقة عمل CVsolucion مع مصانع وورش الخزائن.",
    },
    "/book": {
      title: "احجز استشارة",
      description: "افتح نظام الحجز واحجز جلسة دعم أو استشارة مباشرة.",
    },
  },
} as const;

const uiCopy = {
  en: {
    book: "Book consultation",
    whatsapp: "Contact on WhatsApp",
    backToServices: "Back to services",
    faqTitle: "Frequently asked questions",
    relatedTitle: "Related pages",
    finalTitle: "Need a clear next step?",
    finalBody:
      "Start with a consultation or WhatsApp message and we will direct you to the right service path.",
    finalLink: "Send a request",
  },
  fr: {
    book: "Reserver une consultation",
    whatsapp: "Contacter sur WhatsApp",
    backToServices: "Retour aux services",
    faqTitle: "Questions frequentes",
    relatedTitle: "Pages liees",
    finalTitle: "Besoin d'une prochaine etape claire ?",
    finalBody:
      "Commencez par une consultation ou un message WhatsApp et nous vous orienterons vers le bon service.",
    finalLink: "Envoyer une demande",
  },
  ar: {
    book: "احجز استشارة",
    whatsapp: "تواصل عبر واتساب",
    backToServices: "العودة إلى الخدمات",
    faqTitle: "الأسئلة الشائعة",
    relatedTitle: "صفحات مرتبطة",
    finalTitle: "تحتاج إلى خطوة واضحة تالية؟",
    finalBody:
      "ابدأ بحجز استشارة أو برسالة واتساب وسنوجّهك إلى مسار الخدمة الأنسب.",
    finalLink: "أرسل طلبا",
  },
} as const;

function stripLocale(pathname: string) {
  if (pathname === "/fr" || pathname === "/ar") return "/";
  if (pathname.startsWith("/fr/")) return pathname.replace(/^\/fr/, "") || "/";
  if (pathname.startsWith("/ar/")) return pathname.replace(/^\/ar/, "") || "/";
  return pathname || "/";
}

function localizePath(locale: "en" | "fr" | "ar", path: string) {
  if (locale === "fr") return path === "/" ? "/fr" : `/fr${path}`;
  if (locale === "ar") return path === "/" ? "/ar" : `/ar${path}`;
  return path;
}

function relatedLinkMeta(locale: "en" | "fr" | "ar", path: string) {
  const servicePage = getSeoServicePageByCanonicalPath(path);
  if (servicePage) {
    const content = getSeoServicePageContent(servicePage, locale);
    return {
      title: content.shortTitle,
      description: content.metaDescription,
    };
  }

  return routeDetails[locale][path as keyof (typeof routeDetails)[typeof locale]] || {
    title: path,
    description: path,
  };
}

function renderBlock(block: SeoServicePageBlock, icon: typeof ShieldCheck) {
  if (block.type === "cards") {
    const Icon = icon;
    return (
      <section key={block.title} className="pb-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: "Playfair Display" }}
            >
              {block.title}
            </h2>
            {block.intro ? <p className="mt-4 text-base leading-7 text-slate-600">{block.intro}</p> : null}
          </div>
          <div className="card-stage mt-8 grid gap-6 md:grid-cols-3">
            {block.items.map((item) => (
              <GlassCard key={item} className="rounded-[28px] p-7">
                <div className="rounded-2xl bg-primary/10 p-3 w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-5 text-base leading-7 text-slate-700">{item}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "steps") {
    return (
      <section key={block.title} className="pb-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: "Playfair Display" }}
            >
              {block.title}
            </h2>
          </div>
          <div className="card-stage mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {block.items.map((item) => (
              <GlassCard key={`${item.label}-${item.text}`} className="rounded-[28px] p-7">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {item.label}
                </div>
                <p className="mt-5 text-base leading-7 text-slate-700">{item.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "facts") {
    return (
      <section key={block.title} className="pb-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: "Playfair Display" }}
            >
              {block.title}
            </h2>
          </div>
          <div className="card-stage mt-8 grid gap-6 md:grid-cols-2">
            {block.items.map((item) => (
              <GlassCard key={item.label} className="rounded-[28px] p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">
                  {item.label}
                </div>
                <p className="mt-4 text-base leading-7 text-slate-700">{item.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section key={block.title} className="pb-10">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <GlassCard className="rounded-[32px] p-8 md:p-10">
          <h2
            className="text-3xl font-bold text-primary"
            style={{ fontFamily: "Playfair Display" }}
          >
            {block.title}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

function currentPageUrl(locale: "en" | "fr" | "ar", canonicalPath: string) {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    return url.toString();
  }
  return `https://cvsolucion.com${localizePath(locale, canonicalPath)}`;
}

export default function ServiceLanding() {
  const [location] = useLocation();
  const { locale } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const canonicalPath = stripLocale(location.replace(/\/+$/, "") || "/");
  const page = getSeoServicePageByCanonicalPath(canonicalPath);

  if (!page) {
    return null;
  }

  const Icon = serviceIcons[page.key];
  const pageContent = getSeoServicePageContent(page, locale);
  const copy = uiCopy[locale];
  const prefix = locale === "en" ? "" : `/${locale}`;
  const homeHref = prefix || "/";
  const bookingHref = getBookingHref(locale);
  const whatsappHref = buildWhatsAppLink(
    WHATSAPP_PHONE,
    locale === "fr"
      ? `Bonjour, j'ai besoin d'aide pour ${pageContent.shortTitle}.`
      : locale === "ar"
        ? `مرحبا، أحتاج مساعدة بخصوص ${pageContent.shortTitle}.`
        : `Hi, I need help with ${pageContent.shortTitle}.`
  );

  const currentUrl = currentPageUrl(locale, page.canonicalPath);
  const structuredData = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: pageContent.shortTitle,
        serviceType: pageContent.shortTitle,
        description: pageContent.metaDescription,
        provider: {
          "@type": "Organization",
          name: "CVsolucion",
          url: "https://cvsolucion.com",
        },
        areaServed: ["Canada", "United States"],
        url: currentUrl,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: pageContent.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `https://cvsolucion.com${homeHref}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: pageContent.shortTitle,
            item: currentUrl,
          },
        ],
      },
    ],
    [currentUrl, homeHref, pageContent],
  );

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo title={pageContent.seoTitle} description={pageContent.metaDescription} structuredData={structuredData} />
      <Header />

      <main className="flex-1 pt-28">
        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="glass-card-strong relative overflow-hidden rounded-[36px] px-4 sm:px-8">
              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative mx-auto max-w-4xl px-4 py-12 text-center md:px-8 md:py-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  <Icon className="h-4 w-4" />
                  {pageContent.heroBadge}
                </div>

                <h1
                  className="mt-6 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl"
                  style={{ fontFamily: "Playfair Display" }}
                >
                  {pageContent.h1}
                </h1>

                <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
                  {pageContent.heroLead}
                </p>
                <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  {pageContent.heroBody}
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-green-500 text-white hover:bg-green-600">
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      {copy.whatsapp}
                    </a>
                  </Button>
                  <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
                    <a
                      href={bookingHref}
                      target={bookingHref.startsWith("http") ? "_blank" : undefined}
                      rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      <BookOpenCheck className="h-5 w-5" />
                      {copy.book}
                    </a>
                  </Button>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => navigateToHomeSection(locale, "services")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {copy.backToServices}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {pageContent.blocks.map((block) => renderBlock(block, Icon))}

        <section className="pb-10">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-bold text-primary"
                style={{ fontFamily: "Playfair Display" }}
              >
                {copy.faqTitle}
              </h2>
            </div>
            <div className="card-stage mx-auto mt-8 max-w-4xl space-y-4">
              {pageContent.faq.map((item, index) => (
                <GlassCard key={item.question} className="overflow-hidden rounded-[24px]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-white/25"
                  >
                    <span className="text-lg font-semibold text-slate-900">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-primary transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index ? (
                    <div className="border-t border-white/20 bg-white/20 px-6 py-5 text-base leading-7 text-slate-700">
                      {item.answer}
                    </div>
                  ) : null}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-3xl font-bold text-primary"
                style={{ fontFamily: "Playfair Display" }}
              >
                {copy.relatedTitle}
              </h2>
            </div>
            <div className="card-stage mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {page.relatedPaths.map((path) => {
                const meta = relatedLinkMeta(locale, path);
                return (
                  <GlassCard key={path} className="rounded-[28px] p-7">
                    <h3 className="text-xl font-bold text-primary">{meta.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{meta.description}</p>
                    <a
                      href={localizePath(locale, path)}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {meta.title}
                    </a>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="glass-card-strong rounded-[32px] p-8 text-center md:p-10">
              <h2
                className="text-3xl font-bold text-primary"
                style={{ fontFamily: "Playfair Display" }}
              >
                {copy.finalTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {copy.finalBody}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-green-500 text-white hover:bg-green-600">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    {copy.whatsapp}
                  </a>
                </Button>
                <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
                  <a
                    href={bookingHref}
                    target={bookingHref.startsWith("http") ? "_blank" : undefined}
                    rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <BookOpenCheck className="h-5 w-5" />
                    {copy.book}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full bg-white/75"
                  onClick={() => navigateToHomeSection(locale, "contact")}
                >
                  {copy.finalLink}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
