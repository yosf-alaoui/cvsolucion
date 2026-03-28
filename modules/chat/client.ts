import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type {
  ChatConversationSnapshot,
  ChatSendPayload,
  ChatSessionPayload,
  ChatSupportIntakePayload,
} from "./contracts";

type ChatSessionResponse = {
  ok: true;
  enabled: boolean;
  isNew: boolean;
  conversation: ChatConversationSnapshot;
};

export function createChatModuleClient(options: JsonHttpClientOptions = {}) {
  const request = createJsonHttpClient(options);

  return {
    openSession(payload: ChatSessionPayload) {
      return request<ChatSessionResponse>("/api/chat/session", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    startNewSession(payload: ChatSessionPayload) {
      return request<ChatSessionResponse>("/api/chat/new-session", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    sendMessage(payload: ChatSendPayload) {
      return request<ChatSessionResponse>("/api/chat/message", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    submitSupportIntake(payload: ChatSupportIntakePayload) {
      return request<ChatSessionResponse>("/api/chat/support-intake", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

