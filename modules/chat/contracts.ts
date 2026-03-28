export type ChatModuleRole = "user" | "assistant";

export type ChatModuleMessage = {
  id: string;
  role: ChatModuleRole;
  content: string;
  createdAt: string;
};

export type ChatSupportIntake = {
  name: string;
  country: string;
  phone: string;
  email: string;
  submittedAt: string;
};

export type ChatConversationSnapshot = {
  id: string;
  locale: "en" | "fr" | "ar";
  assistantName: string;
  status: "open" | "waiting_client" | "needs_human";
  title: string;
  leadScore: number;
  email?: string | null;
  supportFormRequired: boolean;
  supportIntake: ChatSupportIntake | null;
  messages: ChatModuleMessage[];
};

export type ChatSessionPayload = {
  locale: string;
  path: string;
  sessionId?: string | null;
};

export type ChatSendPayload = ChatSessionPayload & {
  conversationId: string;
  message: string;
};

export type ChatSupportIntakePayload = ChatSessionPayload & {
  conversationId: string;
  name: string;
  country: string;
  phone: string;
  email: string;
};

