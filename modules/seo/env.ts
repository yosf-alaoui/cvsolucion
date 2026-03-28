import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const seoModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "SITE_ORIGIN",
    required: false,
    description: "Optional canonical site origin used to build absolute SEO URLs.",
    example: "https://example.com",
  },
];

export const seoModuleManifest: ReusableModuleManifest = {
  name: "seo",
  category: "seo",
  summary: "Canonical, hreflang, robots, sitemap, and fallback-render helpers for indexable pages.",
  runtime: ["client", "server"],
  env: seoModuleEnv,
  currentProject: {
    client: ["client/index.html", "client/src/components/Seo.tsx"],
    server: ["server/seo.ts", "server/index.ts"],
  },
};
