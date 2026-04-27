import crypto from "crypto";
import type { ChatConversationSnapshot } from "./contracts";

export type ChatSupportIntakeRuleOptions = {
  triggerKeywords?: string[];
  minMessagesBeforePrompt?: number;
};

function normalizedLocale(locale: string) {
  if (locale === "fr" || locale === "ar") return locale;
  return "en";
}

export function buildChatSystemPrompt(
  basePrompt: string,
  options: {
    bookingUrl?: string;
    supportEmail?: string;
    maxWords?: number;
  } = {}
) {
  const prompt = [basePrompt.trim()];
  if (options.maxWords) {
    prompt.push(`Keep each answer under ${options.maxWords} words.`);
  }
  if (options.bookingUrl) {
    prompt.push(`Booking link: ${options.bookingUrl}`);
  }
  if (options.supportEmail) {
    prompt.push(`Support email: ${options.supportEmail}`);
  }
  return prompt.filter(Boolean).join("\n\n");
}

export function shouldRequireSupportIntake(
  input: {
    message: string;
    messageCount: number;
    alreadyRequired?: boolean;
  },
  options: ChatSupportIntakeRuleOptions = {}
) {
  if (input.alreadyRequired) return true;
  const message = String(input.message || "").toLowerCase();
  const triggerKeywords = (
    options.triggerKeywords || [
      "book",
      "booking",
      "consultation",
      "support",
      "contact",
      "email",
      "phone",
      "call",
      "quote",
      "price",
    ]
  ).map((item) => item.toLowerCase());

  return (
    input.messageCount >= (options.minMessagesBeforePrompt ?? 2) ||
    triggerKeywords.some((keyword) => message.includes(keyword))
  );
}

export function createChatConversationSeed(input: {
  locale: string;
  assistantName?: string;
  title?: string;
}): ChatConversationSnapshot {
  return {
    id: crypto.randomBytes(12).toString("hex"),
    locale: normalizedLocale(input.locale),
    assistantName: input.assistantName?.trim() || "CVsolucion",
    status: "open",
    title: input.title?.trim() || "New conversation",
    leadScore: 0,
    email: null,
    supportFormRequired: false,
    supportIntake: null,
    messages: [],
  };
}
