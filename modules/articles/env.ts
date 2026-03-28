import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const articlesModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "OPENAI_API_KEY",
    required: true,
    description: "OpenAI API key used to translate articles into the remaining locales on save.",
  },
  {
    key: "OPENAI_TRANSLATION_MODEL",
    required: false,
    description: "Optional model override for article translation.",
    example: "gpt-5-mini",
  },
];

export const articlesModuleManifest: ReusableModuleManifest = {
  name: "articles",
  category: "articles",
  summary: "Localized article publishing with auto-translation, admin CRUD, and image upload helpers.",
  runtime: ["client", "server"],
  env: articlesModuleEnv,
  currentProject: {
    client: [
      "client/src/lib/articles.ts",
      "client/src/lib/articleBody.ts",
      "client/src/pages/Articles.tsx",
      "client/src/pages/ArticleDetail.tsx",
      "client/src/components/admin/ArticlesManager.tsx",
    ],
    server: ["server/articleStore.ts", "server/articleTranslation.ts", "server/index.ts"],
    data: ["data/articles-db.json", "data/uploads/articles"],
  },
};
