import type { ArticleLocale, ArticleRecord, ArticleTranslationRecord } from "./contracts";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

export type CreateArticleTranslationModuleOptions = {
  apiKey: string;
  model?: string;
  endpoint?: string;
};

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "article";
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts: string[] = [];
  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    const contents = Array.isArray(item?.content) ? item.content : [];
    for (const content of contents) {
      if (typeof content?.text === "string" && content.text.trim()) {
        texts.push(content.text.trim());
      }
      if (typeof content?.output_text === "string" && content.output_text.trim()) {
        texts.push(content.output_text.trim());
      }
    }
  }

  return texts.join("\n\n").trim();
}

function parseJsonPayload(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Translation response was not valid JSON.");
  }

  return JSON.parse(text.slice(first, last + 1)) as Partial<ArticleTranslationRecord>;
}

async function callResponsesApi(
  options: CreateArticleTranslationModuleOptions,
  body: Record<string, unknown>
) {
  const response = await fetch(options.endpoint || OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof (json as any)?.error?.message === "string"
        ? (json as any).error.message
        : "OpenAI translation failed.";
    throw new Error(message);
  }

  return json;
}

function localizeArticle(record: ArticleRecord, locale: ArticleLocale) {
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

function sortArticles(records: ArticleRecord[]) {
  return [...records].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function uniqueSlug(records: ArticleRecord[], title: string, excludeId?: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (records.some((item) => item.slug === candidate && item.id !== excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function createArticleTranslationModule(options: CreateArticleTranslationModuleOptions) {
  const model = options.model || "gpt-5-mini";

  async function translateLocale(input: {
    sourceLocale: ArticleLocale;
    targetLocale: ArticleLocale;
    title: string;
    body: string;
  }) {
    const instructions = `
You are a senior marketing translator for a Cabinet Vision consulting company.
Translate the provided article title and HTML body into the target locale.

Rules:
- Preserve HTML structure and all links.
- Translate only human-readable text.
- Return JSON only with {"title":"...","body":"..."}.
`;

    const json = await callResponsesApi(options, {
      model,
      max_output_tokens: 24000,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      instructions,
      input: `Return JSON only. ${JSON.stringify(input)}`,
    });

    const text = extractOutputText(json);
    const parsed = parseJsonPayload(text);
    if (!parsed.title?.trim() || !parsed.body?.trim()) {
      throw new Error(`Translation for ${input.targetLocale} was incomplete.`);
    }

    return {
      title: parsed.title.trim(),
      body: parsed.body.trim(),
    };
  }

  return {
    localizeArticle,
    sortArticles,
    uniqueSlug,
    async translateArticle(input: {
      sourceLocale: ArticleLocale;
      title: string;
      body: string;
    }) {
      const locales: ArticleLocale[] = ["en", "fr", "ar"];
      const translations = {
        en: { title: input.title.trim(), body: input.body.trim() },
        fr: { title: input.title.trim(), body: input.body.trim() },
        ar: { title: input.title.trim(), body: input.body.trim() },
      } satisfies Record<ArticleLocale, ArticleTranslationRecord>;

      for (const locale of locales) {
        if (locale === input.sourceLocale) continue;
        translations[locale] = await translateLocale({
          sourceLocale: input.sourceLocale,
          targetLocale: locale,
          title: input.title.trim(),
          body: input.body.trim(),
        });
      }

      return translations;
    },
  };
}
