export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatSupportIntake = {
  phone: string;
  email: string;
  cabinetVisionVersion: string;
  country: string;
  deviceCount: string;
  submittedAt: string;
};

export type ChatConversation = {
  id: string;
  locale: "en" | "fr" | "ar";
  assistantName: string;
  status: "open" | "waiting_client" | "needs_human";
  title: string;
  leadScore: number;
  email?: string | null;
  supportFormRequired: boolean;
  supportIntake: ChatSupportIntake | null;
  messages: ChatMessage[];
};

type ChatSessionResponse = {
  ok: true;
  enabled: boolean;
  isNew: boolean;
  conversation: ChatConversation;
};

async function chatRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Chat request failed.");
  }
  return data;
}

export function openChatSession(payload: { locale: string; path: string; sessionId?: string | null }) {
  return chatRequest<ChatSessionResponse>("/api/chat/session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startNewChatSession(payload: { locale: string; path: string; sessionId?: string | null }) {
  return chatRequest<ChatSessionResponse>("/api/chat/new-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendChatMessage(payload: {
  conversationId: string;
  locale: string;
  path: string;
  message: string;
  sessionId?: string | null;
}) {
  return chatRequest<ChatSessionResponse>("/api/chat/message", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitSupportIntake(payload: {
  conversationId: string;
  locale: string;
  path: string;
  phone: string;
  email: string;
  cabinetVisionVersion: string;
  country: string;
  deviceCount: string;
}) {
  return chatRequest<ChatSessionResponse>("/api/chat/support-intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
