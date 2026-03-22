import crypto from "crypto";
import fs from "fs";
import path from "path";

export type ArticleRecord = {
  id: string;
  slug: string;
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

function loadDb(): ArticlesDb {
  ensureStorage();
  const parsed = JSON.parse(fs.readFileSync(ARTICLES_DB_PATH, "utf8")) as Partial<ArticlesDb>;
  return {
    articles: parsed.articles ?? [],
  };
}

function saveDb(db: ArticlesDb) {
  fs.writeFileSync(ARTICLES_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 16) {
  return crypto.randomBytes(size).toString("hex");
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

export function listAdminArticles() {
  const db = loadDb();
  return sortArticles(db.articles);
}

export function listPublishedArticles() {
  const db = loadDb();
  return sortArticles(db.articles);
}

export function getArticleBySlug(slug: string) {
  const db = loadDb();
  return db.articles.find((item) => item.slug === slug) ?? null;
}

export function getArticleById(id: string) {
  const db = loadDb();
  return db.articles.find((item) => item.id === id) ?? null;
}

export function createArticle(input: {
  title: string;
  body: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const article: ArticleRecord = {
    id: randomId(),
    slug: uniqueSlug(db, input.title),
    title: input.title.trim(),
    body: input.body.trim(),
    imageUrl: input.imageUrl?.trim() || null,
    publishedAt: input.publishedAt?.trim() || timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.articles.push(article);
  saveDb(db);
  return article;
}

export function updateArticle(
  id: string,
  input: {
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

  article.title = input.title.trim();
  article.body = input.body.trim();
  article.imageUrl = input.imageUrl?.trim() || null;
  article.publishedAt = input.publishedAt?.trim() || article.publishedAt;
  article.slug = uniqueSlug(db, article.title, article.id);
  article.updatedAt = nowIso();

  saveDb(db);
  return article;
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

export function saveArticleImage(input: {
  filename?: string | null;
  contentType: string;
  base64: string;
}) {
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
  const buffer = Buffer.from(input.base64, "base64");

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/articles/${fileName}`,
    fileName,
  };
}

