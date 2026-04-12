import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { getArticles, type ArticleSummary } from "@/lib/articles";
import { useI18n } from "@/i18n/i18n";
import {
  SEO_KNOWLEDGE_PAGE_ORDER,
  SEO_KNOWLEDGE_PAGES,
  getSeoKnowledgePageContent,
} from "@shared/seoKnowledgePages";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default function Articles() {
  const { locale } = useI18n();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "المقالات",
        subtitle: "مقالات منظمة بعرض مريح للعين لمتابعة الأفكار والخبرة التقنية بسلاسة.",
        empty: "لا توجد مقالات منشورة بعد.",
        readMore: "قراءة المقال",
        guidesTitle: "أدلة تشخيص Cabinet Vision",
        guidesSubtitle: "صفحات عملية للمشاكل الأكثر بحثًا قبل قراءة المقالات.",
        openGuide: "افتح الدليل",
        seoTitle: "المقالات | CVsolucion",
      };
    }

    if (locale === "fr") {
      return {
        title: "Articles",
        subtitle: "Des articles structures pour lire facilement les idees, conseils et retours terrain.",
        empty: "Aucun article publie pour le moment.",
        readMore: "Lire l'article",
        guidesTitle: "Guides de diagnostic Cabinet Vision",
        guidesSubtitle: "Pages pratiques sur les problemes les plus recherches avant les articles.",
        openGuide: "Ouvrir le guide",
        seoTitle: "Articles | CVsolucion",
      };
    }

    return {
      title: "Articles",
      subtitle: "Structured articles designed for smooth reading and clear ideas from real Cabinet Vision work.",
      empty: "No published articles yet.",
      readMore: "Read article",
      guidesTitle: "Cabinet Vision troubleshooting guides",
      guidesSubtitle: "Practical pages for the most searched issues before the editorial articles.",
      openGuide: "Open guide",
      seoTitle: "Articles | CVsolucion",
    };
  }, [locale]);

  useEffect(() => {
    setLoading(true);
    getArticles(locale)
      .then((response) => setArticles(Array.isArray(response.articles) ? response.articles : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const articleBase = locale === "en" ? "/articles" : `/${locale}/articles`;
  const guidesBase = locale === "en" ? "" : `/${locale}`;
  const guides = SEO_KNOWLEDGE_PAGE_ORDER.map((key) => {
    const page = SEO_KNOWLEDGE_PAGES[key];
    const content = getSeoKnowledgePageContent(page, locale);
    return {
      href: `${guidesBase}${page.canonicalPath}`,
      title: content.shortTitle,
      description: content.metaDescription,
    };
  });

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.subtitle} type="website" />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="glass-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              Editorial
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          </div>

          <div className="mx-auto mt-12 max-w-[1220px]">
            <div className="mb-6 flex flex-col gap-2 text-center sm:text-start">
              <h2 className="text-2xl font-bold text-slate-900">{copy.guidesTitle}</h2>
              <p className="text-base text-slate-600">{copy.guidesSubtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <GlassCard key={guide.href} className="rounded-[24px] p-5">
                  <div className="flex h-full flex-col">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BookOpenCheck className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold leading-snug text-slate-900">{guide.title}</h3>
                    </div>
                    <p className="mt-3 flex-1 line-clamp-3 text-sm leading-7 text-slate-600">{guide.description}</p>
                    <Link
                      href={guide.href}
                      className="mt-5 inline-flex items-center gap-2 self-start text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      {copy.openGuide}
                      <ArrowRight className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-12 text-center text-sm text-slate-500">Loading...</div>
          ) : articles.length ? (
            <div className="mx-auto mt-14 max-w-[1220px]">
              <div className="flex flex-wrap justify-center gap-8">
                {articles.map((article) => (
                  <GlassCard key={article.id} className="w-full max-w-[560px] rounded-[32px] p-0">
                    <article className="flex h-full flex-col overflow-hidden rounded-[32px]">
                      {article.imageUrl ? (
                        <img src={article.imageUrl} alt={article.title} className="h-64 w-full object-cover" />
                      ) : null}
                      <div className="flex flex-1 flex-col p-8">
                        <div className="text-sm font-medium text-slate-500">{formatDate(article.publishedAt, locale)}</div>
                        <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900">{article.title}</h2>
                        <p className="mt-4 line-clamp-5 text-base leading-8 text-slate-600">{article.excerpt}</p>
                        <Link
                          href={`${articleBase}/${article.slug}`}
                          className="mt-6 inline-flex items-center self-start rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-primary/40 hover:text-primary"
                        >
                          {copy.readMore}
                        </Link>
                      </div>
                    </article>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-16 rounded-[28px] border border-dashed border-slate-300 bg-white/55 px-8 py-16 text-center text-slate-500">
              {copy.empty}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
