export type ModuleEnvRequirement = {
  key: string;
  required: boolean;
  description: string;
  example?: string;
};

export type ReusableModuleManifest = {
  name: string;
  category:
    | "shared"
    | "auth"
    | "email"
    | "chat"
    | "booking"
    | "dashboard"
    | "analytics"
    | "articles"
    | "seo"
    | "contact"
    | "catalog"
    | "payments"
    | "invoices"
    | "i18n"
    | "customer-profile"
    | "visitor-tracking";
  summary: string;
  runtime: Array<"client" | "server">;
  env: ModuleEnvRequirement[];
  currentProject: {
    client: string[];
    server: string[];
    data?: string[];
  };
};
