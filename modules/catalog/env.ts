import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const catalogModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "STRIPE_PRICE_STANDARD_CONSULTATION",
    required: false,
    description: "Optional default amount in cents for standard consultation bookings.",
    example: "14000",
  },
  {
    key: "STRIPE_PRICE_STANDARD_SUPPORT",
    required: false,
    description: "Optional default amount in cents for standard support bookings.",
    example: "14000",
  },
  {
    key: "STRIPE_PRICE_EXPRESS_CONSULTATION",
    required: false,
    description: "Optional default amount in cents for express consultation bookings.",
    example: "18000",
  },
  {
    key: "STRIPE_PRICE_EXPRESS_SUPPORT",
    required: false,
    description: "Optional default amount in cents for express support bookings.",
    example: "18000",
  },
];

export const catalogModuleManifest: ReusableModuleManifest = {
  name: "catalog",
  category: "catalog",
  summary: "Public packages plus admin-managed booking prices and package definitions.",
  runtime: ["client", "server"],
  env: catalogModuleEnv,
  currentProject: {
    client: [
      "client/src/lib/admin.ts",
      "client/src/components/admin/CatalogManager.tsx",
      "client/src/components/PackagesSection.tsx",
    ],
    server: ["server/catalogStore.ts", "server/index.ts"],
    data: ["data/catalog-db.json"],
  },
};
