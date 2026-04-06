import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const emailModuleEnv: ModuleEnvRequirement[] = [
  { key: "SMTP_HOST", required: true, description: "SMTP server hostname.", example: "smtp.hostinger.com" },
  { key: "SMTP_PORT", required: true, description: "SMTP server port.", example: "465" },
  { key: "SMTP_USER", required: true, description: "SMTP username." },
  { key: "SMTP_PASS", required: true, description: "SMTP password or app password." },
  { key: "SMTP_FROM", required: false, description: "Optional sender display name or verified sender address." },
];

export const emailModuleManifest: ReusableModuleManifest = {
  name: "email",
  category: "email",
  summary: "SMTP email delivery layer for auth, refunds, contact forms, and transactional notifications.",
  runtime: ["server"],
  env: emailModuleEnv,
  currentProject: {
    client: [],
    server: ["server/authMailer.ts", "server/index.ts"],
  },
};
