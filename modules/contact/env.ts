import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const contactModuleEnv: ModuleEnvRequirement[] = [
  {
    key: "CONTACT_NOTIFICATION_EMAIL",
    required: false,
    description: "Optional internal inbox that receives a copy of every submitted lead.",
    example: "info@example.com",
  },
];

export const contactModuleManifest: ReusableModuleManifest = {
  name: "contact",
  category: "contact",
  summary: "Lead capture module for contact forms and sales/support inquiry storage.",
  runtime: ["client", "server"],
  env: contactModuleEnv,
  currentProject: {
    client: ["client/src/lib/contact.ts", "client/src/components/ContactSection.tsx"],
    server: ["server/contactStore.ts", "server/index.ts"],
    data: ["data/contact-leads.json"],
  },
};
