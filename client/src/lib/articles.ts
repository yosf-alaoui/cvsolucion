export type ArticleSummary = {
  id: string;
  slug: string;
  sourceLocale: "en" | "fr" | "ar";
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
const MAX_IMAGE_DIMENSION = 2400;
const MAX_IMAGE_UPLOAD_TARGET_BYTES = 2.5 * 1024 * 1024;

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

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    image.src = url;
  });
}

async function normalizeArticleImage(file: File) {
  if (!ARTICLE_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, or WebP.");
  }

  if (file.size > MAX_ARTICLE_UPLOAD_BYTES) {
    throw new Error("Image is too large. Use an image smaller than 8 MB.");
  }

  if (file.size <= MAX_IMAGE_UPLOAD_TARGET_BYTES) {
    return file;
  }

  const image = await loadImageElement(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  // Flatten onto white so large PNG photos can be converted to JPEG efficiently.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const outputType = "image/jpeg";
  const qualities = [0.86, 0.78, 0.7, 0.62, 0.54];

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), outputType, quality);
    });

    if (!blob) continue;

    if (blob.size <= MAX_IMAGE_UPLOAD_TARGET_BYTES || quality === qualities[qualities.length - 1]) {
      const extension = ".jpg";
      return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, extension), { type: outputType });
    }
  }

  throw new Error("Failed to optimize image.");
}

export async function getArticles(locale: "en" | "fr" | "ar") {
  return request<{ articles: ArticleSummary[] }>(`/api/articles?locale=${encodeURIComponent(locale)}`, { method: "GET" });
}

export async function getArticle(slug: string, locale: "en" | "fr" | "ar") {
  return request<{ article: ArticleDetail }>(
    `/api/articles/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
    { method: "GET" }
  );
}

export async function getAdminArticles() {
  return request<{ articles: ArticleSummary[] }>("/api/admin/articles", { method: "GET" });
}

export async function uploadArticleImage(file: File) {
  const preparedFile = await normalizeArticleImage(file);

  return request<{ ok: true; image: { url: string; fileName: string } }>("/api/admin/article-images", {
    method: "POST",
    body: preparedFile,
    headers: {
      "Content-Type": preparedFile.type,
      "X-Upload-Filename": encodeURIComponent(preparedFile.name),
    },
  });
}

export function createAdminArticle(payload: {
  sourceLocale: "en" | "fr" | "ar";
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
    sourceLocale: "en" | "fr" | "ar";
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
