export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  locale: "en" | "fr" | "ar";
  status: "open" | "waiting_client" | "needs_human";
  title: string;
  leadScore: number;
  messages: ChatMessage[];
};

type ChatSessionResponse = {
  ok: true;
  enabled: boolean;
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
