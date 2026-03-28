export type ArticleLocale = "en" | "fr" | "ar";

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

export type ArticleListResponse = {
  articles: LocalizedArticleRecord[];
};

export type ArticleDetailResponse = {
  article: LocalizedArticleRecord;
};

export type UpsertArticlePayload = {
  sourceLocale: ArticleLocale;
  title: string;
  body: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
};

export type UploadArticleImageResponse = {
  ok: true;
  image: {
    url: string;
    fileName: string;
  };
};
