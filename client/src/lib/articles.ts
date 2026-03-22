export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleDetail = ArticleSummary;

const ARTICLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_ARTICLE_UPLOAD_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 45_000;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      credentials: "include",
      signal: init?.signal ?? controller.signal,
      headers: {
        ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch (error: any) {
    window.clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw new Error("The request took too long. Try a smaller image.");
    }
    throw error;
  }

  window.clearTimeout(timeoutId);

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function validateArticleImage(file: File) {
  if (!ARTICLE_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, or WebP.");
  }

  if (file.size > MAX_ARTICLE_UPLOAD_BYTES) {
    throw new Error("Image is too large. Use an image smaller than 8 MB.");
  }
}

export async function getArticles() {
  return request<{ articles: ArticleSummary[] }>("/api/articles", { method: "GET" });
}

export async function getArticle(slug: string) {
  return request<{ article: ArticleDetail }>(`/api/articles/${encodeURIComponent(slug)}`, { method: "GET" });
}

export async function getAdminArticles() {
  return request<{ articles: ArticleSummary[] }>("/api/admin/articles", { method: "GET" });
}

export async function uploadArticleImage(file: File) {
  validateArticleImage(file);

  return request<{ ok: true; image: { url: string; fileName: string } }>("/api/admin/article-images", {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": file.type,
      "X-Upload-Filename": encodeURIComponent(file.name),
    },
  });
}

export function createAdminArticle(payload: {
  title: string;
  body: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
}) {
  return request<{ ok: true; article: ArticleSummary }>("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminArticle(
  articleId: string,
  payload: {
    title: string;
    body: string;
    imageUrl?: string | null;
    publishedAt?: string | null;
  }
) {
  return request<{ ok: true; article: ArticleSummary }>(`/api/admin/articles/${articleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminArticle(articleId: string) {
  return request<{ ok: true }>(`/api/admin/articles/${articleId}`, {
    method: "DELETE",
  });
}
