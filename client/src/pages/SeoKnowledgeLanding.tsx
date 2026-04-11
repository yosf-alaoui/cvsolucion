import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, BookOpenCheck, ChevronDown, CircleCheck, SearchCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";
import {
  getSeoKnowledgePageByCanonicalPath,
  getSeoKnowledgePageContent,
} from "@shared/seoKnowledgePages";
import { getSeoServicePageByCanonicalPath } from "@shared/seoServicePages";
import { getSeoServicePageContent } from "@shared/seoServicePageLocales";

const uiCopy = {
  en: {
    book: "Book consultation",
    faqTitle: "Frequently asked questions",
    relatedTitle: "Related pages",
    ctaTitle: "Need help with this Cabinet Vision issue?",
    ctaBody: "Book a focused session and we will review the real setup instead of guessing from symptoms.",
    readMore: "Open page",
  },
  fr: {
    book: "Reserver une consultation",
    faqTitle: "Questions frequentes",
    relatedTitle: "Pages liees",
    ctaTitle: "Besoin d'aide sur ce probleme Cabinet Vision ?",
    ctaBody: "Reservez une session ciblee et nous reviserons le vrai setup au lieu de deviner depuis les symptomes.",
    readMore: "Ouvrir la page",
  },
  ar: {
    book: "احجز استشارة",
    faqTitle: "الأسئلة الشائعة",
    relatedTitle: "صفحات مرتبطة",
    ctaTitle: "تحتاج مساعدة في هذه المشكلة داخل Cabinet Vision؟",
    ctaBody: "احجز جلسة مركزة وسنراجع الإعداد الحقيقي بدل التخمين من الأعراض فقط.",
    readMore: "افتح الصفحة",
  },
} as const;

const routeDetails = {
  en: {
    "/training": {
      title: "Cabinet Vision Training",
      description: "Remote training for designers, engineers, and production teams.",
    },
    "/design-pricing": {
      title: "Design & Pricing",
      description: "Quoting logic, reports, and production-ready pricing workflow setup.",
    },
    "/book": {
      title: "Book consultation",
      description: "Reserve a Cabinet Vision support or consulting session.",
    },
  },
  fr: {
    "/training": {
      title: "Formation Cabinet Vision",
      description: "Formation a distance pour designers, ingenieurs et production.",
    },
    "/design-pricing": {
      title: "Design & Pricing",
      description: "Logique de devis, rapports et workflow de pricing pret production.",
    },
    "/book": {
      title: "Reserver une consultation",
      description: "Reserver une session support ou consulting Cabinet Vision.",
    },
  },
  ar: {
    "/training": {
      title: "تدريب Cabinet Vision",
      description: "تدريب عن بعد للمصممين والمهندسين وفرق الإنتاج.",
    },
    "/design-pricing": {
      title: "التصميم والتسعير",
      description: "تنظيم منطق التسعير والتقارير وسير العمل الجاهز للإنتاج.",
    },
    "/book": {
      title: "احجز استشارة",
      description: "احجز جلسة دعم أو استشارة Cabinet Vision.",
    },
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
  const knowledgePage = getSeoKnowledgePageByCanonicalPath(path);
  if (knowledgePage) {
    const content = getSeoKnowledgePageContent(knowledgePage, locale);
    return { title: content.shortTitle, description: content.metaDescription };
  }

  const servicePage = getSeoServicePageByCanonicalPath(path);
  if (servicePage) {
    const content = getSeoServicePageContent(servicePage, locale);
    return { title: content.shortTitle, description: content.metaDescription };
  }

  return routeDetails[locale][path as keyof (typeof routeDetails)[typeof locale]] || {
    title: path,
    description: path,
  };
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

export default function SeoKnowledgeLanding() {
  const [location] = useLocation();
  const { locale } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const canonicalPath = stripLocale(location.replace(/\/+$/, "") || "/");
  const page = getSeoKnowledgePageByCanonicalPath(canonicalPath);

  if (!page) {
    return null;
  }

  const copy = uiCopy[locale];
  const pageContent = getSeoKnowledgePageContent(page, locale);
  const currentUrl = currentPageUrl(locale, page.canonicalPath);
  const bookingHref = getBookingHref(locale);
  const structuredData = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: pageContent.h1,
        description: pageContent.metaDescription,
        inLanguage: locale,
        mainEntityOfPage: currentUrl,
        publisher: {
          "@type": "Organization",
          name: "CVsolucion",
          url: "https://cvsolucion.com",
        },
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
    ],
    [currentUrl, locale, pageContent],
  );

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title={pageContent.seoTitle}
        description={pageContent.metaDescription}
        type="article"
        structuredData={structuredData}
      />
      <Header />

      <main className="flex-1 pt-28">
        <section className="pb-12">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <GlassCard className="relative overflow-hidden rounded-[36px] p-8 md:p-12">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative mx-auto max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                  <SearchCheck className="h-4 w-4" />
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
                  {pageContent.intro}
                </p>
                <div className="mt-8">
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
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="pb-10">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="space-y-6">
              {pageContent.blocks.map((item) => (
                <GlassCard key={item.title} className="rounded-[30px] p-7 md:p-9">
                  <h2
                    className="text-2xl font-bold text-primary md:text-3xl"
                    style={{ fontFamily: "Playfair Display" }}
                  >
                    {item.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
                    {item.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {item.bullets ? (
                    <ul className="mt-6 grid gap-3 md:grid-cols-2">
                      {item.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-3 rounded-2xl border border-primary/10 bg-white/45 p-4 text-sm leading-6 text-slate-700"
                        >
                          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-center text-3xl font-bold text-primary"
              style={{ fontFamily: "Playfair Display" }}
            >
              {copy.faqTitle}
            </h2>
            <div className="mt-8 space-y-4">
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
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-center text-3xl font-bold text-primary"
              style={{ fontFamily: "Playfair Display" }}
            >
              {copy.relatedTitle}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                      {copy.readMore}
                    </a>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <GlassCard className="rounded-[32px] p-8 text-center md:p-10">
              <h2
                className="text-3xl font-bold text-primary"
                style={{ fontFamily: "Playfair Display" }}
              >
                {copy.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {copy.ctaBody}
              </p>
              <Button asChild className="mt-8 rounded-full bg-primary text-white hover:bg-primary/90">
                <a
                  href={bookingHref}
                  target={bookingHref.startsWith("http") ? "_blank" : undefined}
                  rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <BookOpenCheck className="h-5 w-5" />
                  {copy.book}
                </a>
              </Button>
            </GlassCard>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
