import type { ModuleEnvRequirement, ReusableModuleManifest } from "../shared/env";

export const chatModuleEnv: ModuleEnvRequirement[] = [
  { key: "OPENAI_API_KEY", required: true, description: "OpenAI key used by the chat assistant." },
  { key: "OPENAI_CHAT_MODEL", required: false, description: "Optional chat model override.", example: "gpt-4.1" },
  {
    key: "OPENAI_CHAT_SYSTEM_PROMPT",
    required: false,
    description: "Optional system prompt override when the chat should not use the built-in default.",
  },
];

export const chatModuleManifest: ReusableModuleManifest = {
  name: "chat",
  category: "chat",
  summary: "Lead-capture and support chat module backed by OpenAI and a required support-intake handoff.",
  runtime: ["client", "server"],
  env: chatModuleEnv,
  currentProject: {
    client: ["client/src/lib/chat.ts", "client/src/components/ChatWidget.tsx"],
    server: ["server/chatAssistant.ts", "server/chatStore.ts", "server/index.ts"],
    data: ["data/chat-db.json", "data/visitors-db.json"],
  },
};

