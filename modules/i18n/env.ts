import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const i18nModuleEnv: ModuleEnvRequirement[] = [];

export const i18nModuleManifest: ReusableModuleManifest = {
  name: "i18n",
  category: "i18n",
  summary: "Localized path, direction, translation lookup, and locale switch helpers.",
  runtime: ["client"],
  env: i18nModuleEnv,
  currentProject: {
    client: ["client/src/i18n/i18n.tsx", "client/src/i18n/translations.ts"],
    server: [],
  },
};
