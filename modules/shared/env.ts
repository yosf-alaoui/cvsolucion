export type ModuleEnvRequirement = {
  key: string;
  required: boolean;
  description: string;
  example?: string;
};

export type ReusableModuleManifest = {
  name: string;
  category: "auth" | "email" | "chat" | "booking" | "dashboard" | "analytics";
  summary: string;
  runtime: Array<"client" | "server">;
  env: ModuleEnvRequirement[];
  currentProject: {
    client: string[];
    server: string[];
    data?: string[];
  };
};

