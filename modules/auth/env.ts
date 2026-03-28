import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const authModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "SESSION_COOKIE_NAME",
    required: false,
    description: "Optional cookie name override if you do not want the default auth cookie key.",
    example: "cvs_session",
  },
];

export const authModuleManifest: ReusableModuleManifest = {
  name: "auth",
  category: "auth",
  summary: "Email/password authentication with sessions, verification, and password reset.",
  runtime: ["client", "server"],
  env: authModuleEnv,
  currentProject: {
    client: ["client/src/lib/auth.ts", "client/src/contexts/AuthContext.tsx", "client/src/pages/Login.tsx"],
    server: ["server/authStore.ts", "server/index.ts", "server/authEmailTemplates.ts", "server/authMailer.ts"],
    data: ["data/auth-db.json"],
  },
};

