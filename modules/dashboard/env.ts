import type { ReusableModuleManifest } from "../shared/env";

export const dashboardModuleManifest: ReusableModuleManifest = {
  name: "dashboard",
  category: "dashboard",
  summary: "Customer and admin dashboards for profile, bookings, package management, conversations, and analytics snapshots.",
  runtime: ["client", "server"],
  env: [],
  currentProject: {
    client: [
      "client/src/lib/customer.ts",
      "client/src/lib/admin.ts",
      "client/src/pages/CustomerDashboard.tsx",
      "client/src/pages/AdminDashboard.tsx",
      "client/src/pages/Dashboard.tsx",
    ],
    server: ["server/customerProfileStore.ts", "server/catalogStore.ts", "server/index.ts"],
    data: ["data/customer-profiles-db.json", "data/catalog-db.json"],
  },
};

