import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import { getArticles, type ArticleSummary } from "@/lib/articles";
import { useI18n } from "@/i18n/i18n";

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
      };
    }
    if (locale === "fr") {
      return {
        title: "Articles",
        subtitle: "Des articles structures pour lire facilement les idees, conseils et retours terrain.",
        empty: "Aucun article publie pour le moment.",
        readMore: "Lire l'article",
      };
    }
    return {
      title: "Articles",
      subtitle: "Structured articles designed for smooth reading and clear ideas from real Cabinet Vision work.",
      empty: "No published articles yet.",
      readMore: "Read article",
    };
  }, [locale]);

  useEffect(() => {
    getArticles()
      .then((response) => setArticles(Array.isArray(response.articles) ? response.articles : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const articleBase = locale === "en" ? "/articles" : `/${locale}/articles`;

  return (
    <div className="site-page min-h-screen bg-transparent">
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

          {loading ? (
            <div className="mt-12 text-center text-sm text-slate-500">Loading...</div>
          ) : articles.length ? (
            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {articles.map((article) => (
                <GlassCard key={article.id} className="rounded-[32px] p-0">
                  <article className="overflow-hidden rounded-[32px]">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} alt={article.title} className="h-64 w-full object-cover" />
                    ) : null}
                    <div className="p-8">
                      <div className="text-sm font-medium text-slate-500">{formatDate(article.publishedAt, locale)}</div>
                      <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900">{article.title}</h2>
                      <p className="mt-4 text-base leading-8 text-slate-600">{article.excerpt}</p>
                      <a
                        href={`${articleBase}/${article.slug}`}
                        className="mt-6 inline-flex items-center rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-primary/40 hover:text-primary"
                      >
                        {copy.readMore}
                      </a>
                    </div>
                  </article>
                </GlassCard>
              ))}
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
