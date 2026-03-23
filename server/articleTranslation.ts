import "dotenv/config";
import type { ArticleLocale, ArticleTranslationRecord } from "./articleStore";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function getModel() {
  return process.env.OPENAI_TRANSLATION_MODEL?.trim() || process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5-mini";
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const texts: string[] = [];

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

  return JSON.parse(text.slice(first, last + 1)) as {
    translations?: Partial<Record<ArticleLocale, Partial<ArticleTranslationRecord>>>;
  };
}

async function callResponsesApi(body: Record<string, unknown>) {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new Error("OpenAI translation is not configured.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof json?.error?.message === "string" ? json.error.message : "OpenAI translation failed.";
    throw new Error(message);
  }

  return json;
}

function targetLocales(sourceLocale: ArticleLocale) {
  return (["en", "fr", "ar"] as ArticleLocale[]).filter((locale) => locale !== sourceLocale);
}

export async function translateArticleContent(input: {
  sourceLocale: ArticleLocale;
  title: string;
  body: string;
}) {
  const targets = targetLocales(input.sourceLocale);
  const translations = {
    en: { title: input.title, body: input.body },
    fr: { title: input.title, body: input.body },
    ar: { title: input.title, body: input.body },
  } satisfies Record<ArticleLocale, ArticleTranslationRecord>;

  if (!targets.length) {
    return translations;
  }

  const instructions = `
You are a senior marketing translator for CVsolucion, a Cabinet Vision consulting and support company.
Translate the provided article title and HTML body into the requested locales.

Rules:
- Keep the meaning accurate, commercially credible, and technically natural.
- Preserve the structure of the HTML body.
- Preserve all tags such as headings, paragraphs, lists, blockquotes, emphasis, links, images, code blocks, and line breaks.
- Preserve href, src, rel, target, and any URLs exactly as they are.
- Translate only human-readable text.
- Do not remove or merge paragraphs.
- Return JSON only. No markdown fences. No commentary.
- Use this exact JSON shape:
{"translations":{"fr":{"title":"...","body":"..."},"ar":{"title":"...","body":"..."}}}
`;

  const json = await callResponsesApi({
    model: getModel(),
    instructions,
    input: JSON.stringify({
      sourceLocale: input.sourceLocale,
      targetLocales: targets,
      article: {
        title: input.title,
        body: input.body,
      },
    }),
  });

  const text = extractOutputText(json);
  const parsed = parseJsonPayload(text);

  for (const locale of targets) {
    const translated = parsed.translations?.[locale];
    if (!translated?.title?.trim() || !translated?.body?.trim()) {
      throw new Error(`OpenAI translation for ${locale} was incomplete.`);
    }

    translations[locale] = {
      title: translated.title.trim(),
      body: translated.body.trim(),
    };
  }

  translations[input.sourceLocale] = {
    title: input.title.trim(),
    body: input.body.trim(),
  };

  return translations;
}
