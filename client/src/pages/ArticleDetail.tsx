import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import { getArticle, type ArticleDetail } from "@/lib/articles";
import { useI18n } from "@/i18n/i18n";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "long",
  }).format(new Date(value));
}

function renderBlocks(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const isList = lines.every((line) => /^[-*•]\s+/.test(line));

      if (isList) {
        return (
          <ul key={index} className="my-8 space-y-3 text-lg leading-9 text-slate-700">
            {lines.map((line, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="mt-3 h-2 w-2 rounded-full bg-primary/70" />
                <span>{line.replace(/^[-*•]\s+/, "")}</span>
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={index} className="my-7 text-lg leading-9 text-slate-700">
          {block}
        </p>
      );
    });
}

export default function ArticleDetailPage() {
  const [location] = useLocation();
  const { locale } = useI18n();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return { back: "العودة إلى المقالات", notFound: "المقال غير موجود." };
    }
    if (locale === "fr") {
      return { back: "Retour aux articles", notFound: "Article introuvable." };
    }
    return { back: "Back to articles", notFound: "Article not found." };
  }, [locale]);

  useEffect(() => {
    const cleaned = location.replace(/^\/(fr|ar)/, "");
    const slug = cleaned.replace(/^\/articles\//, "").replace(/\/+$/, "");

    if (!slug) {
      setLoading(false);
      return;
    }

    getArticle(slug)
      .then((response) => setArticle(response.article))
      .finally(() => setLoading(false));
  }, [location]);

  const articlesHref = locale === "en" ? "/articles" : `/${locale}/articles`;

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Header />
      <main className="pt-32 pb-24">
        <section className="container">
          {loading ? (
            <div className="text-center text-sm text-slate-500">Loading...</div>
          ) : !article ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-8 py-16 text-center text-slate-500">
              {copy.notFound}
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <a href={articlesHref} className="mb-8 inline-flex text-sm font-semibold text-slate-600 hover:text-primary">
                {copy.back}
              </a>

              <GlassCard className="rounded-[36px] p-0 overflow-hidden">
                <article>
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="h-[340px] w-full object-cover sm:h-[420px]" />
                  ) : null}
                  <div className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                    <div className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                      {formatDate(article.publishedAt, locale)}
                    </div>
                    <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">{article.title}</h1>
                    <div className="mt-10 border-t border-slate-200/70 pt-4" />
                    <div className="mx-auto max-w-3xl">{renderBlocks(article.body)}</div>
                  </div>
                </article>
              </GlassCard>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

