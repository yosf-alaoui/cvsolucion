import crypto from "crypto";
import fs from "fs";
import path from "path";
import { translateArticleContent } from "./articleTranslation";

export const ARTICLE_LOCALES = ["en", "fr", "ar"] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

export type ArticleTranslationRecord = {
  title: string;
  body: string;
};

export type ArticleRecord = {
  id: string;
  slug: string;
  sourceLocale: ArticleLocale;
  translations: Record<ArticleLocale, ArticleTranslationRecord>;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalizedArticleRecord = {
  id: string;
  slug: string;
  sourceLocale: ArticleLocale;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type ArticlesDb = {
  articles: ArticleRecord[];
};

type LegacyArticleRecord = {
  id?: string;
  slug?: string;
  sourceLocale?: string;
  title?: string;
  body?: string;
  translations?: Partial<Record<ArticleLocale, Partial<ArticleTranslationRecord>>>;
  imageUrl?: string | null;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const ARTICLES_DB_PATH = path.join(DATA_DIR, "articles-db.json");
const ARTICLE_UPLOADS_DIR = path.join(DATA_DIR, "uploads", "articles");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARTICLE_UPLOADS_DIR)) {
    fs.mkdirSync(ARTICLE_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARTICLES_DB_PATH)) {
    const initial: ArticlesDb = { articles: [] };
    fs.writeFileSync(ARTICLES_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 16) {
  return crypto.randomBytes(size).toString("hex");
}

function normalizeArticleLocale(value: string | null | undefined): ArticleLocale {
  if (value === "fr" || value === "ar") return value;
  return "en";
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `article-${randomId(4)}`;
}

function uniqueSlug(db: ArticlesDb, title: string, excludeId?: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (db.articles.some((item) => item.slug === candidate && item.id !== excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function sortArticles(items: ArticleRecord[]) {
  return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function fallbackTranslation(raw: LegacyArticleRecord, locale: ArticleLocale) {
  const existing = raw.translations?.[locale];
  if (existing?.title?.trim() && existing?.body?.trim()) {
    return {
      title: existing.title.trim(),
      body: existing.body.trim(),
    };
  }

  const sourceLocale = normalizeArticleLocale(raw.sourceLocale);
  const sourceExisting = raw.translations?.[sourceLocale];
  if (sourceExisting?.title?.trim() && sourceExisting?.body?.trim()) {
    return {
      title: sourceExisting.title.trim(),
      body: sourceExisting.body.trim(),
    };
  }

  return {
    title: String(raw.title || "").trim(),
    body: String(raw.body || "").trim(),
  };
}

function normalizeRecord(raw: LegacyArticleRecord, db: ArticlesDb): ArticleRecord | null {
  const sourceLocale = normalizeArticleLocale(raw.sourceLocale);
  const translations = {
    en: fallbackTranslation(raw, "en"),
    fr: fallbackTranslation(raw, "fr"),
    ar: fallbackTranslation(raw, "ar"),
  } satisfies Record<ArticleLocale, ArticleTranslationRecord>;

  const source = translations[sourceLocale];
  if (!source.title || !source.body) {
    return null;
  }

  const englishTitle = translations.en.title || source.title;
  return {
    id: raw.id?.trim() || randomId(),
    slug: raw.slug?.trim() || uniqueSlug(db, englishTitle),
    sourceLocale,
    translations,
    imageUrl: typeof raw.imageUrl === "string" && raw.imageUrl.trim() ? raw.imageUrl.trim() : null,
    publishedAt: raw.publishedAt?.trim() || nowIso(),
    createdAt: raw.createdAt?.trim() || nowIso(),
    updatedAt: raw.updatedAt?.trim() || raw.createdAt?.trim() || nowIso(),
  };
}

function loadDb(): ArticlesDb {
  ensureStorage();
  const parsed = JSON.parse(fs.readFileSync(ARTICLES_DB_PATH, "utf8")) as Partial<ArticlesDb> & {
    articles?: LegacyArticleRecord[];
  };

  const db: ArticlesDb = { articles: [] };
  let changed = false;

  for (const raw of parsed.articles ?? []) {
    const normalized = normalizeRecord(raw, db);
    if (!normalized) continue;
    db.articles.push(normalized);

    if (
      !raw.translations ||
      !raw.sourceLocale ||
      raw.title !== undefined ||
      raw.body !== undefined
    ) {
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(ARTICLES_DB_PATH, JSON.stringify(db, null, 2), "utf8");
  }

  return db;
}

function saveDb(db: ArticlesDb) {
  fs.writeFileSync(ARTICLES_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function localizeArticle(record: ArticleRecord, locale: ArticleLocale): LocalizedArticleRecord {
  const translation = record.translations[locale] || record.translations[record.sourceLocale];
  return {
    id: record.id,
    slug: record.slug,
    sourceLocale: record.sourceLocale,
    title: translation.title,
    body: translation.body,
    imageUrl: record.imageUrl,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function canonicalSlugTitle(sourceLocale: ArticleLocale, translations: Record<ArticleLocale, ArticleTranslationRecord>) {
  return (sourceLocale === "en" ? translations.en.title : translations.en.title || translations[sourceLocale].title).trim();
}

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translationNeedsBackfill(record: ArticleRecord, locale: ArticleLocale) {
  if (locale === record.sourceLocale) {
    return false;
  }

  const source = record.translations[record.sourceLocale];
  const target = record.translations[locale];
  if (!target?.title?.trim() || !target?.body?.trim()) {
    return true;
  }

  return (
    normalizeComparableText(target.title) === normalizeComparableText(source.title) &&
    normalizeComparableText(target.body) === normalizeComparableText(source.body)
  );
}

function articleNeedsTranslationBackfill(record: ArticleRecord) {
  return ARTICLE_LOCALES.some((locale) => translationNeedsBackfill(record, locale));
}

export function listAdminArticles() {
  const db = loadDb();
  return sortArticles(db.articles).map((item) => localizeArticle(item, item.sourceLocale));
}

export function listPublishedArticles(locale: ArticleLocale) {
  const db = loadDb();
  return sortArticles(db.articles).map((item) => localizeArticle(item, locale));
}

export function getArticleBySlug(slug: string, locale: ArticleLocale) {
  const db = loadDb();
  const article = db.articles.find((item) => item.slug === slug) ?? null;
  return article ? localizeArticle(article, locale) : null;
}

export function getArticleById(id: string) {
  const db = loadDb();
  const article = db.articles.find((item) => item.id === id) ?? null;
  return article ? localizeArticle(article, article.sourceLocale) : null;
}

export async function backfillArticleTranslations(articleId?: string) {
  const db = loadDb();
  let translated = 0;
  let changed = false;

  for (const article of db.articles) {
    if (articleId && article.id !== articleId) {
      continue;
    }
    if (!articleNeedsTranslationBackfill(article)) {
      continue;
    }

    try {
      const source = article.translations[article.sourceLocale];
      const translations = await translateArticleContent({
        sourceLocale: article.sourceLocale,
        title: source.title.trim(),
        body: source.body.trim(),
      });

      article.translations = translations;
      article.slug = uniqueSlug(db, canonicalSlugTitle(article.sourceLocale, translations), article.id);
      article.updatedAt = nowIso();
      translated += 1;
      changed = true;
    } catch (error) {
      console.error("[article-translation:backfill]", {
        articleId: article.id,
        slug: article.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (changed) {
    saveDb(db);
  }

  return { translated };
}

export async function createArticle(input: {
  sourceLocale: ArticleLocale;
  title: string;
  body: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const translations = await translateArticleContent({
    sourceLocale: input.sourceLocale,
    title: input.title.trim(),
    body: input.body.trim(),
  });

  const article: ArticleRecord = {
    id: randomId(),
    slug: uniqueSlug(db, canonicalSlugTitle(input.sourceLocale, translations)),
    sourceLocale: input.sourceLocale,
    translations,
    imageUrl: input.imageUrl?.trim() || null,
    publishedAt: input.publishedAt?.trim() || timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.articles.push(article);
  saveDb(db);
  return localizeArticle(article, article.sourceLocale);
}

export async function updateArticle(
  id: string,
  input: {
    sourceLocale: ArticleLocale;
    title: string;
    body: string;
    imageUrl?: string | null;
    publishedAt?: string | null;
  }
) {
  const db = loadDb();
  const article = db.articles.find((item) => item.id === id);
  if (!article) {
    throw new Error("Article not found.");
  }

  const translations = await translateArticleContent({
    sourceLocale: input.sourceLocale,
    title: input.title.trim(),
    body: input.body.trim(),
  });

  article.sourceLocale = input.sourceLocale;
  article.translations = translations;
  article.imageUrl = input.imageUrl?.trim() || null;
  article.publishedAt = input.publishedAt?.trim() || article.publishedAt;
  article.slug = uniqueSlug(db, canonicalSlugTitle(input.sourceLocale, translations), article.id);
  article.updatedAt = nowIso();

  saveDb(db);
  return localizeArticle(article, article.sourceLocale);
}

export function deleteArticle(id: string) {
  const db = loadDb();
  const article = db.articles.find((item) => item.id === id);
  if (!article) {
    throw new Error("Article not found.");
  }

  db.articles = db.articles.filter((item) => item.id !== id);
  saveDb(db);
  return article;
}

function extensionFromMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  throw new Error("Unsupported image type. Use JPG, PNG, or WebP.");
}

function buildArticleImagePath(input: { filename?: string | null; contentType: string }) {
  ensureStorage();
  const extension = extensionFromMime(input.contentType);
  const safeBase = (input.filename || "article-image")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 50) || "article-image";

  const fileName = `${Date.now()}-${safeBase}-${randomId(4)}${extension}`;
  const filePath = path.join(ARTICLE_UPLOADS_DIR, fileName);
  return { fileName, filePath };
}

export function saveArticleImage(input: {
  filename?: string | null;
  contentType: string;
  base64: string;
}) {
  const { fileName, filePath } = buildArticleImagePath(input);
  const buffer = Buffer.from(input.base64, "base64");

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/articles/${fileName}`,
    fileName,
  };
}

export function saveArticleImageBuffer(input: {
  filename?: string | null;
  contentType: string;
  buffer: Buffer;
}) {
  const { fileName, filePath } = buildArticleImagePath(input);
  fs.writeFileSync(filePath, input.buffer);

  return {
    url: `/uploads/articles/${fileName}`,
    fileName,
  };
}
