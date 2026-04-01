import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "./dataDir";
import type { VisitorRecord } from "./visitorStore";

export type ChatMessageRole = "user" | "assistant";

export type ChatMessageRecord = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export type ChatConversationStatus = "open" | "waiting_client" | "needs_human";

export type ChatSupportIntake = {
  name: string;
  country: string;
  phone: string;
  email: string;
  submittedAt: string;
};

export type ChatConversationRecord = {
  id: string;
  visitorId: string;
  userId: string | null;
  email: string | null;
  locale: "en" | "fr" | "ar";
  assistantName: string;
  status: ChatConversationStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastPath: string | null;
  latestResponseId: string | null;
  messageCount: number;
  leadScore: number;
  supportFormRequired: boolean;
  supportIntake: ChatSupportIntake | null;
  messages: ChatMessageRecord[];
};

type ChatDb = {
  conversations: ChatConversationRecord[];
};

export type ChatConversationSnapshot = {
  id: string;
  visitorId: string;
  userId: string | null;
  email: string | null;
  locale: "en" | "fr" | "ar";
  status: ChatConversationStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastPath: string | null;
  latestResponseId: string | null;
  messageCount: number;
  leadScore: number;
  supportFormRequired: boolean;
  supportIntake: ChatSupportIntake | null;
  messages: ChatMessageRecord[];
  visitor: {
    id: string;
    email: string | null;
    isRegistered: boolean;
    ip: string | null;
    deviceType: VisitorRecord["deviceType"];
    locale: string;
    landingPath: string;
    lastPath: string;
    browserLanguage: string | null;
    timezone: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    gclid: string | null;
    fbclid: string | null;
    totalSessions: number;
    totalPageViews: number;
    whatsappClicks: number;
    emailClicks: number;
    ctaClicks: number;
    lastSeenAt: string;
  } | null;
};

const DATA_DIR = getAppDataDir();
const DB_PATH = path.join(DATA_DIR, "chat-db.json");

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ conversations: [] }, null, 2), "utf8");
  }
}

function loadDb(): ChatDb {
  ensureDbFile();
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<ChatDb>;
  return { conversations: parsed.conversations ?? [] };
}

function saveDb(db: ChatDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(size = 12) {
  return crypto.randomBytes(size).toString("hex");
}

function buildConversationTitle(locale: ChatConversationRecord["locale"]) {
  if (locale === "fr") return "Nouvelle conversation";
  if (locale === "ar") return "محادثة جديدة";
  return "New conversation";
}

function pickAssistantName(locale: ChatConversationRecord["locale"]) {
  const names =
    locale === "fr"
      ? ["Karim", "Sami", "Adam", "Youssef", "Nabil", "Amine"]
      : locale === "ar"
        ? ["يوسف", "أمين", "كريم", "سامي", "آدم", "نادر"]
        : ["Adam", "Daniel", "Sam", "Karim", "Youssef", "Nabil"];
  return names[Math.floor(Math.random() * names.length)];
}

function buildIntroMessages(locale: ChatConversationRecord["locale"], assistantName: string) {
  return [];
}

function computeLeadScore(conversation: ChatConversationRecord, visitor?: VisitorRecord | null) {
  let score = 0;
  score += Math.min(conversation.messageCount * 8, 40);
  if (conversation.userId) score += 15;
  if (visitor?.whatsappClicks) score += Math.min(visitor.whatsappClicks * 12, 24);
  if (visitor?.emailClicks) score += Math.min(visitor.emailClicks * 10, 20);
  if (visitor?.ctaClicks) score += Math.min(visitor.ctaClicks * 8, 16);
  if (visitor?.utmCampaign) score += 5;
  if ((visitor?.totalPageViews ?? 0) >= 4) score += 8;
  return Math.min(score, 100);
}

export function getConversationById(conversationId: string) {
  const db = loadDb();
  return db.conversations.find((item) => item.id === conversationId) ?? null;
}

export function getVisitorConversation(input: {
  visitorId: string;
  locale: ChatConversationRecord["locale"];
  userId?: string | null;
}) {
  const db = loadDb();
  const now = Date.now();
  const twelveHoursAgo = now - 1000 * 60 * 60 * 12;
  return (
    db.conversations
      .filter((item) => item.visitorId === input.visitorId && item.locale === input.locale)
      .filter((item) => (input.userId ? item.userId === input.userId || !item.userId : true))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .find((item) => new Date(item.updatedAt).getTime() >= twelveHoursAgo) ?? null
  );
}

export function createConversation(input: {
  visitorId: string;
  userId?: string | null;
  email?: string | null;
  locale: ChatConversationRecord["locale"];
  path?: string | null;
  visitor?: VisitorRecord | null;
}) {
  const db = loadDb();
  const timestamp = nowIso();
  const conversation: ChatConversationRecord = {
    id: randomId(12),
    visitorId: input.visitorId,
    userId: input.userId ?? null,
    email: input.email ?? null,
    locale: input.locale,
    assistantName: pickAssistantName(input.locale),
    status: "waiting_client",
    title: buildConversationTitle(input.locale),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastMessageAt: timestamp,
    lastPath: input.path ?? null,
    latestResponseId: null,
    messageCount: 0,
    leadScore: 0,
    supportFormRequired: false,
    supportIntake: null,
    messages: [],
  };

  conversation.messages = buildIntroMessages(input.locale, conversation.assistantName);
  conversation.messageCount = conversation.messages.length;
  conversation.lastMessageAt = conversation.messages[conversation.messages.length - 1]?.createdAt ?? timestamp;
  conversation.leadScore = computeLeadScore(conversation, input.visitor);

  db.conversations.push(conversation);
  db.conversations = db.conversations
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 1500);
  saveDb(db);
  return conversation;
}

export function upsertConversationForVisitor(input: {
  visitorId: string;
  userId?: string | null;
  email?: string | null;
  locale: ChatConversationRecord["locale"];
  path?: string | null;
  visitor?: VisitorRecord | null;
}) {
  const existing = getVisitorConversation({
    visitorId: input.visitorId,
    locale: input.locale,
    userId: input.userId ?? null,
  });

  if (existing) {
    const db = loadDb();
    const conversation = db.conversations.find((item) => item.id === existing.id)!;
    conversation.userId = input.userId ?? conversation.userId;
    conversation.email = input.email ?? conversation.email;
    conversation.lastPath = input.path ?? conversation.lastPath;
    conversation.updatedAt = nowIso();
    conversation.leadScore = computeLeadScore(conversation, input.visitor);
    saveDb(db);
    return { conversation, isNew: false };
  }

  return { conversation: createConversation(input), isNew: true };
}

export function appendConversationMessage(input: {
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  path?: string | null;
  visitor?: VisitorRecord | null;
}) {
  const db = loadDb();
  const conversation = db.conversations.find((item) => item.id === input.conversationId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const message: ChatMessageRecord = {
    id: randomId(10),
    role: input.role,
    content: input.content.trim(),
    createdAt: nowIso(),
  };

  conversation.messages.push(message);
  conversation.messages = conversation.messages.slice(-60);
  conversation.messageCount = conversation.messages.length;
  conversation.lastMessageAt = message.createdAt;
  conversation.updatedAt = message.createdAt;
  conversation.lastPath = input.path ?? conversation.lastPath;

  if (conversation.title === buildConversationTitle(conversation.locale) && input.role === "user") {
    conversation.title = input.content.trim().slice(0, 70);
  }

  conversation.leadScore = computeLeadScore(conversation, input.visitor);
  saveDb(db);
  return { conversation, message };
}

export function updateConversationMeta(input: {
  conversationId: string;
  latestResponseId?: string | null;
  status?: ChatConversationStatus;
  path?: string | null;
  visitor?: VisitorRecord | null;
  supportFormRequired?: boolean;
}) {
  const db = loadDb();
  const conversation = db.conversations.find((item) => item.id === input.conversationId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  conversation.updatedAt = nowIso();
  conversation.lastPath = input.path ?? conversation.lastPath;
  if (typeof input.latestResponseId !== "undefined") {
    conversation.latestResponseId = input.latestResponseId;
  }
  if (typeof input.status !== "undefined") {
    conversation.status = input.status;
  }
  if (typeof input.supportFormRequired !== "undefined") {
    conversation.supportFormRequired = input.supportFormRequired;
  }
  conversation.leadScore = computeLeadScore(conversation, input.visitor);
  saveDb(db);
  return conversation;
}

export function saveConversationSupportIntake(input: {
  conversationId: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  visitor?: VisitorRecord | null;
}) {
  const db = loadDb();
  const conversation = db.conversations.find((item) => item.id === input.conversationId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  conversation.supportIntake = {
    name: input.name.trim(),
    country: input.country.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    submittedAt: nowIso(),
  };
  conversation.email = input.email.trim();
  conversation.supportFormRequired = false;
  conversation.status = "needs_human";
  conversation.updatedAt = nowIso();
  conversation.leadScore = computeLeadScore(conversation, input.visitor);
  saveDb(db);
  return conversation;
}

export function getConversationMessages(conversationId: string) {
  return getConversationById(conversationId)?.messages ?? [];
}

export function getConversationsSnapshot(visitors: VisitorRecord[]): ChatConversationSnapshot[] {
  const visitorMap = new Map(visitors.map((item) => [item.id, item]));
  const db = loadDb();

  return db.conversations
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((conversation) => {
      const visitor = visitorMap.get(conversation.visitorId) ?? null;
      return {
        ...conversation,
        messages: conversation.messages.slice(-20),
        leadScore: computeLeadScore(conversation, visitor),
        visitor: visitor
          ? {
              id: visitor.id,
              email: visitor.email,
              isRegistered: visitor.isRegistered,
              ip: visitor.ip,
              deviceType: visitor.deviceType,
              locale: visitor.locale,
              landingPath: visitor.landingPath,
              lastPath: visitor.lastPath,
              browserLanguage: visitor.browserLanguage,
              timezone: visitor.timezone,
              utmSource: visitor.utmSource,
              utmMedium: visitor.utmMedium,
              utmCampaign: visitor.utmCampaign,
              gclid: visitor.gclid,
              fbclid: visitor.fbclid,
              totalSessions: visitor.totalSessions,
              totalPageViews: visitor.totalPageViews,
              whatsappClicks: visitor.whatsappClicks,
              emailClicks: visitor.emailClicks,
              ctaClicks: visitor.ctaClicks,
              lastSeenAt: visitor.lastSeenAt,
            }
          : null,
      };
    });
}
