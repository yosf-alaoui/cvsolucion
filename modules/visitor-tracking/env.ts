import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const visitorTrackingModuleEnv: ModuleEnvRequirement[] = [];

export const visitorTrackingModuleManifest: ReusableModuleManifest = {
  name: "visitor-tracking",
  category: "visitor-tracking",
  summary: "First-party visitor pageview and interaction telemetry for dashboards and funnels.",
  runtime: ["client", "server"],
  env: visitorTrackingModuleEnv,
  currentProject: {
    client: ["client/src/components/Analytics.tsx", "client/src/components/ChatWidget.tsx"],
    server: ["server/visitorStore.ts", "server/index.ts"],
    data: ["data/visitors-db.json"],
  },
};
