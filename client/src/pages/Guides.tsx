import { Link } from "wouter";
import { ArrowRight, BookOpenCheck, SearchCheck } from "lucide-react";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { useI18n } from "@/i18n/i18n";
import {
  SEO_KNOWLEDGE_PAGE_ORDER,
  SEO_KNOWLEDGE_PAGES,
  getSeoKnowledgePageContent,
} from "@shared/seoKnowledgePages";

const copy = {
  en: {
    badge: "Cabinet Vision guides",
    title: "Cabinet Vision Troubleshooting Guides",
    subtitle:
      "Practical guides for the Cabinet Vision problems clients search for most: S2M output, slow files, database errors, reports, and CNC handoff.",
    readMore: "Open guide",
    ctaTitle: "Need this reviewed on your real setup?",
    ctaBody: "Book a focused Cabinet Vision session so we can diagnose the issue against your actual library, reports, and CNC workflow.",
    book: "Book consultation",
    seoTitle: "Cabinet Vision Troubleshooting Guides | CVsolucion",
    seoDescription:
      "Browse Cabinet Vision troubleshooting guides for S2M output, slow performance, database errors, report errors, and CNC output problems.",
  },
  fr: {
    badge: "Guides Cabinet Vision",
    title: "Guides de diagnostic Cabinet Vision",
    subtitle:
      "Guides pratiques sur les problemes les plus recherches: sortie S2M, lenteurs, erreurs de base de donnees, rapports et sortie CNC.",
    readMore: "Ouvrir le guide",
    ctaTitle: "Besoin de verifier votre vrai setup ?",
    ctaBody:
      "Reservez une session Cabinet Vision ciblee pour diagnostiquer le probleme sur votre bibliotheque, vos rapports et votre workflow CNC.",
    book: "Reserver une consultation",
    seoTitle: "Guides de diagnostic Cabinet Vision | CVsolucion",
    seoDescription:
      "Guides Cabinet Vision pour diagnostiquer S2M, lenteurs, erreurs de base de donnees, rapports et sortie CNC.",
  },
  ar: {
    badge: "أدلة Cabinet Vision",
    title: "أدلة تشخيص مشاكل Cabinet Vision",
    subtitle:
      "أدلة عملية للمشاكل التي يبحث عنها العملاء: مخرجات S2M، بطء الملفات، أخطاء قاعدة البيانات، التقارير، وتسليم ملفات CNC.",
    readMore: "افتح الدليل",
    ctaTitle: "تحتاج فحص المشكلة على إعدادك الحقيقي؟",
    ctaBody:
      "احجز جلسة مركزة في Cabinet Vision حتى نفحص المشكلة داخل مكتبتك وتقاريرك وسير عمل CNC الفعلي.",
    book: "احجز استشارة",
    seoTitle: "أدلة تشخيص Cabinet Vision | CVsolucion",
    seoDescription:
      "تصفح أدلة تشخيص Cabinet Vision لمشاكل S2M، بطء الأداء، أخطاء قاعدة البيانات، أخطاء التقارير، ومخرجات CNC.",
  },
} as const;

function localizePath(locale: "en" | "fr" | "ar", path: string) {
  if (locale === "fr") return path === "/" ? "/fr" : `/fr${path}`;
  if (locale === "ar") return path === "/" ? "/ar" : `/ar${path}`;
  return path;
}

export default function Guides() {
  const { locale } = useI18n();
  const pageCopy = copy[locale];
  const guides = SEO_KNOWLEDGE_PAGE_ORDER.map((key) => {
    const page = SEO_KNOWLEDGE_PAGES[key];
    const content = getSeoKnowledgePageContent(page, locale);
    return {
      href: localizePath(locale, page.canonicalPath),
      title: content.shortTitle,
      description: content.metaDescription,
      badge: content.heroBadge,
    };
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageCopy.title,
    description: pageCopy.seoDescription,
    hasPart: guides.map((guide) => ({
      "@type": "TechArticle",
      headline: guide.title,
      description: guide.description,
      url: `https://cvsolucion.com${guide.href}`,
    })),
  };

  return (
    <div className="site-page min-h-screen bg-transparent" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Seo
        title={pageCopy.seoTitle}
        description={pageCopy.seoDescription}
        type="website"
        structuredData={structuredData}
      />
      <Header />
      <main className="pb-20 pt-32">
        <section className="container">
          <div className="mx-auto max-w-4xl text-center">
            <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <SearchCheck className="h-4 w-4 text-primary" />
              {pageCopy.badge}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{pageCopy.title}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">{pageCopy.subtitle}</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[1180px] gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <GlassCard key={guide.href} className="group rounded-[30px] p-7">
                <article className="flex h-full flex-col">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BookOpenCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{guide.badge}</div>
                      <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-900">{guide.title}</h2>
                    </div>
                  </div>
                  <p className="mt-5 flex-1 text-base leading-8 text-slate-600">{guide.description}</p>
                  <Link
                    href={guide.href}
                    className="mt-7 inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white/75 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-primary/50 hover:text-primary"
                  >
                    {pageCopy.readMore}
                    <ArrowRight className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`} />
                  </Link>
                </article>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="mx-auto mt-12 max-w-[1180px] rounded-[30px] p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{pageCopy.ctaTitle}</h2>
                <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{pageCopy.ctaBody}</p>
              </div>
              <Link
                href={localizePath(locale, "/book")}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
              >
                {pageCopy.book}
              </Link>
            </div>
          </GlassCard>
        </section>
      </main>
      <Footer />
    </div>
  );
}
