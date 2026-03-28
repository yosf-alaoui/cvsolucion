import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const customerProfileModuleEnv: ModuleEnvRequirement[] = [];

export const customerProfileModuleManifest: ReusableModuleManifest = {
  name: "customer-profile",
  category: "customer-profile",
  summary: "Reusable customer profile storage and update flows for dashboards and checkout autofill.",
  runtime: ["client", "server"],
  env: customerProfileModuleEnv,
  currentProject: {
    client: [
      "client/src/lib/customer.ts",
      "client/src/pages/CustomerDashboard.tsx",
      "client/src/pages/BookingCheckout.tsx",
    ],
    server: ["server/customerProfileStore.ts", "server/index.ts"],
    data: ["data/customer-profiles-db.json"],
  },
};
