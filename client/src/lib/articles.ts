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

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
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
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, payload = ""] = result.split(",");
      resolve(payload);
    };
    reader.readAsDataURL(file);
  });

  return request<{ ok: true; image: { url: string; fileName: string } }>("/api/admin/article-images", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      base64,
    }),
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

