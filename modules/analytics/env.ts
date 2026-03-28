import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const analyticsModuleEnv: ModuleEnvRequirement[] = [
  { key: "VITE_GTM_ID", required: false, description: "Optional Google Tag Manager container id." },
  { key: "VITE_GA4_ID", required: false, description: "Optional GA4 browser tag id." },
  { key: "GA4_PROPERTY_ID", required: true, description: "GA4 property id for reporting.", example: "123456789" },
  {
    key: "GA4_SERVICE_ACCOUNT_PATH",
    required: false,
    description: "Path to the GA4 service account file when not using inline JSON.",
  },
  {
    key: "GA4_SERVICE_ACCOUNT_JSON",
    required: false,
    description: "Inline service account JSON when file-based secrets are not used.",
  },
];

export const analyticsModuleManifest: ReusableModuleManifest = {
  name: "analytics",
  category: "analytics",
  summary: "Client event tracking plus GA4 dashboard reporting and visitor telemetry.",
  runtime: ["client", "server"],
  env: analyticsModuleEnv,
  currentProject: {
    client: ["client/src/components/Analytics.tsx"],
    server: ["server/ga4Reporting.ts", "server/visitorStore.ts", "server/index.ts"],
    data: ["data/visitors-db.json"],
  },
};

