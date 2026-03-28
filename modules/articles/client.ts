import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  ArticleDetailResponse,
  ArticleListResponse,
  ArticleLocale,
  LocalizedArticleRecord,
  UpsertArticlePayload,
  UploadArticleImageResponse,
} from "./contracts";

type CreateArticlesModuleClientOptions = JsonHttpClientOptions & {
  imageUploadPath?: string;
};

export function createArticlesModuleClient(options: CreateArticlesModuleClientOptions = {}) {
  const request = createJsonHttpClient(options);
  const imageUploadPath = options.imageUploadPath || "/api/admin/article-images";

  return {
    getArticles(locale: ArticleLocale) {
      return request<ArticleListResponse>(`/api/articles?locale=${encodeURIComponent(locale)}`, { method: "GET" });
    },
    getArticle(slug: string, locale: ArticleLocale) {
      return request<ArticleDetailResponse>(
        `/api/articles/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
        { method: "GET" }
      );
    },
    getAdminArticles() {
      return request<ArticleListResponse>("/api/admin/articles", { method: "GET" });
    },
    createArticle(payload: UpsertArticlePayload) {
      return request<{ ok: true; article: LocalizedArticleRecord }>("/api/admin/articles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    updateArticle(articleId: string, payload: UpsertArticlePayload) {
      return request<{ ok: true; article: LocalizedArticleRecord }>(
        `/api/admin/articles/${encodeURIComponent(articleId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
    },
    deleteArticle(articleId: string) {
      return request<{ ok: true }>(`/api/admin/articles/${encodeURIComponent(articleId)}`, {
        method: "DELETE",
      });
    },
    uploadImage(file: File) {
      return request<UploadArticleImageResponse>(imageUploadPath, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
          "X-Upload-Filename": encodeURIComponent(file.name),
        },
      });
    },
  };
}
