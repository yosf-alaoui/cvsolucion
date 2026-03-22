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

function renderInline(content: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${match.index}-link`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-slate-950">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      nodes.push(
        <em key={`${match.index}-em`} className="italic">
          {match[5]}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

function renderBlocks(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const isBulletList = lines.every((line) => /^[-*•]\s+/.test(line));
      const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line));
      const heading = block.match(/^(#{1,6})\s+(.+)$/);

      if (heading) {
        const level = heading[1].length;
        const title = heading[2];
        const className =
          level <= 2
            ? "mt-10 text-3xl font-bold leading-tight text-slate-950"
            : level === 3
              ? "mt-9 text-2xl font-bold leading-tight text-slate-950"
              : "mt-8 text-xl font-semibold leading-tight text-slate-950";

        return (
          <h2 key={index} className={className}>
            {renderInline(title)}
          </h2>
        );
      }

      if (isBulletList || isNumberedList) {
        const ListTag = isNumberedList ? "ol" : "ul";

        return (
          <ListTag key={index} className="my-8 space-y-3 text-lg leading-9 text-slate-700">
            {lines.map((line, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                {isNumberedList ? (
                  <span className="min-w-7 font-semibold text-primary">{itemIndex + 1}.</span>
                ) : (
                  <span className="mt-3 h-2 w-2 rounded-full bg-primary/70" />
                )}
                <span>{renderInline(line.replace(/^([-*•]|\d+\.)\s+/, ""))}</span>
              </li>
            ))}
          </ListTag>
        );
      }

      return (
        <p key={index} className="my-7 text-lg leading-9 text-slate-700">
          {renderInline(block)}
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

              <GlassCard className="overflow-hidden rounded-[36px] p-0">
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
