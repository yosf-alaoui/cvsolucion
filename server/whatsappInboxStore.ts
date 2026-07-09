import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type WhatsAppInboxMessageDirection = "inbound" | "outbound";
export type WhatsAppInboxMessageType = "text" | "button" | "interactive" | "template" | "system";
export type WhatsAppInboxMessageStatus =
  | "received"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppInboxMessage = {
  id: string;
  direction: WhatsAppInboxMessageDirection;
  type: WhatsAppInboxMessageType;
  whatsappMessageId: string | null;
  body: string;
  status: WhatsAppInboxMessageStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  sentByUserId: string | null;
  sentByEmail: string | null;
};

export type WhatsAppInboxConversationStatus =
  | "needs_reply"
  | "waiting_customer"
  | "open";

export type WhatsAppInboxConversation = {
  id: string;
  phone: string;
  displayPhone: string;
  contactName: string | null;
  leadId: string | null;
  email: string | null;
  language: string | null;
  status: WhatsAppInboxConversationStatus;
  unreadCount: number;
  lastMessageAt: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: WhatsAppInboxMessage[];
};

type WhatsAppInboxDb = {
  conversations: WhatsAppInboxConversation[];
};

const DB_PATH = path.join(getAppDataDir(), "whatsapp-inbox-db.json");
const MAX_CONVERSATIONS = 500;
const MAX_MESSAGES_PER_CONVERSATION = 200;

function ensureDbFile() {
  ensureJsonFile<WhatsAppInboxDb>(DB_PATH, { conversations: [] });
}

function loadDb() {
  ensureDbFile();
  const parsed = readJsonFile<Partial<WhatsAppInboxDb>>(DB_PATH);
  return { conversations: parsed.conversations ?? [] };
}

function saveDb(db: WhatsAppInboxDb) {
  db.conversations = db.conversations
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .slice(0, MAX_CONVERSATIONS)
    .map((conversation) => ({
      ...conversation,
      messages: conversation.messages
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-MAX_MESSAGES_PER_CONVERSATION),
    }));
  writeJsonFileAtomic(DB_PATH, db);
}

function normalizePhoneDigits(value: string | null | undefined) {
  return String(value || "").replace(/[^\d]/g, "");
}

function createConversationId(phone: string) {
  return `wa_${phone}`;
}

function formatDisplayPhone(phone: string) {
  return phone ? `+${phone}` : "";
}

function createMessageId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function findConversationIndex(db: WhatsAppInboxDb, conversationId: string) {
  return db.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  );
}

function findConversationByPhone(db: WhatsAppInboxDb, phone: string) {
  const normalizedPhone = normalizePhoneDigits(phone);
  return db.conversations.find(
    (conversation) => conversation.phone === normalizedPhone,
  );
}

function getOrCreateConversation(
  db: WhatsAppInboxDb,
  input: {
    phone: string;
    contactName?: string | null;
    leadId?: string | null;
    email?: string | null;
    language?: string | null;
    timestamp: string;
  },
) {
  const phone = normalizePhoneDigits(input.phone);
  let conversation = findConversationByPhone(db, phone);
  if (!conversation) {
    conversation = {
      id: createConversationId(phone),
      phone,
      displayPhone: formatDisplayPhone(phone),
      contactName: input.contactName?.trim() || null,
      leadId: input.leadId?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      language: input.language?.trim() || null,
      status: "open",
      unreadCount: 0,
      lastMessageAt: input.timestamp,
      lastInboundAt: null,
      lastOutboundAt: null,
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
      messages: [],
    };
    db.conversations.unshift(conversation);
    return conversation;
  }

  if (input.contactName?.trim()) conversation.contactName = input.contactName.trim();
  if (input.leadId?.trim()) conversation.leadId = input.leadId.trim();
  if (input.email?.trim()) conversation.email = input.email.trim().toLowerCase();
  if (input.language?.trim()) conversation.language = input.language.trim();
  conversation.updatedAt = input.timestamp;
  return conversation;
}

function hasMessage(conversation: WhatsAppInboxConversation, whatsappMessageId: string | null) {
  return Boolean(
    whatsappMessageId &&
      conversation.messages.some(
        (message) => message.whatsappMessageId === whatsappMessageId,
      ),
  );
}

export function listWhatsAppInboxConversations() {
  const db = loadDb();
  return [...db.conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export function getWhatsAppInboxConversation(conversationId: string) {
  const db = loadDb();
  return (
    db.conversations.find((conversation) => conversation.id === conversationId) ??
    null
  );
}

export function getWhatsAppInboxConversationByPhone(phone: string) {
  const db = loadDb();
  return findConversationByPhone(db, phone) ?? null;
}

export function upsertWhatsAppInboxLeadContext(input: {
  phone: string;
  contactName?: string | null;
  leadId?: string | null;
  email?: string | null;
  language?: string | null;
}) {
  const db = loadDb();
  const now = new Date().toISOString();
  const conversation = getOrCreateConversation(db, {
    phone: input.phone,
    contactName: input.contactName,
    leadId: input.leadId,
    email: input.email,
    language: input.language,
    timestamp: now,
  });
  saveDb(db);
  return conversation;
}

export function recordWhatsAppInboundMessage(input: {
  phone: string;
  contactName?: string | null;
  whatsappMessageId?: string | null;
  body: string;
  type?: WhatsAppInboxMessageType;
  occurredAt?: string | null;
}) {
  const db = loadDb();
  const timestamp = input.occurredAt || new Date().toISOString();
  const conversation = getOrCreateConversation(db, {
    phone: input.phone,
    contactName: input.contactName,
    timestamp,
  });
  const whatsappMessageId = input.whatsappMessageId?.trim() || null;
  if (hasMessage(conversation, whatsappMessageId)) {
    return { conversation, message: null, duplicate: true };
  }

  const message: WhatsAppInboxMessage = {
    id: createMessageId("wa_in"),
    direction: "inbound",
    type: input.type || "text",
    whatsappMessageId,
    body: input.body.trim(),
    status: "received",
    error: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    sentByUserId: null,
    sentByEmail: null,
  };
  conversation.messages.push(message);
  conversation.status = "needs_reply";
  conversation.unreadCount += 1;
  conversation.lastMessageAt = timestamp;
  conversation.lastInboundAt = timestamp;
  conversation.updatedAt = timestamp;
  saveDb(db);
  return { conversation, message, duplicate: false };
}

export function recordWhatsAppOutboundMessage(input: {
  phone: string;
  contactName?: string | null;
  whatsappMessageId?: string | null;
  body: string;
  type?: WhatsAppInboxMessageType;
  status?: WhatsAppInboxMessageStatus;
  error?: string | null;
  sentByUserId?: string | null;
  sentByEmail?: string | null;
  occurredAt?: string | null;
}) {
  const db = loadDb();
  const timestamp = input.occurredAt || new Date().toISOString();
  const conversation = getOrCreateConversation(db, {
    phone: input.phone,
    contactName: input.contactName,
    timestamp,
  });
  const whatsappMessageId = input.whatsappMessageId?.trim() || null;
  if (hasMessage(conversation, whatsappMessageId)) {
    return { conversation, message: null, duplicate: true };
  }

  const message: WhatsAppInboxMessage = {
    id: createMessageId("wa_out"),
    direction: "outbound",
    type: input.type || "text",
    whatsappMessageId,
    body: input.body.trim(),
    status: input.status || "sent",
    error: input.error?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    sentByUserId: input.sentByUserId || null,
    sentByEmail: input.sentByEmail || null,
  };
  conversation.messages.push(message);
  conversation.status = input.status === "failed" ? "open" : "waiting_customer";
  conversation.unreadCount = 0;
  conversation.lastMessageAt = timestamp;
  conversation.lastOutboundAt = timestamp;
  conversation.updatedAt = timestamp;
  saveDb(db);
  return { conversation, message, duplicate: false };
}

export function updateWhatsAppInboxMessageStatus(input: {
  whatsappMessageId: string;
  status: WhatsAppInboxMessageStatus;
  error?: string | null;
  occurredAt?: string | null;
}) {
  const whatsappMessageId = input.whatsappMessageId.trim();
  if (!whatsappMessageId) return null;
  const db = loadDb();
  const timestamp = input.occurredAt || new Date().toISOString();

  for (const conversation of db.conversations) {
    const message = conversation.messages.find(
      (stored) => stored.whatsappMessageId === whatsappMessageId,
    );
    if (!message) continue;
    message.status = input.status;
    message.error = input.error?.trim() || message.error;
    message.updatedAt = timestamp;
    conversation.updatedAt = timestamp;
    if (input.status === "failed") {
      conversation.status = "open";
    }
    saveDb(db);
    return { conversation, message };
  }

  return null;
}

export function markWhatsAppInboxConversationRead(conversationId: string) {
  const db = loadDb();
  const index = findConversationIndex(db, conversationId);
  if (index === -1) return null;
  db.conversations[index].unreadCount = 0;
  db.conversations[index].updatedAt = new Date().toISOString();
  saveDb(db);
  return db.conversations[index];
}

export function backfillWhatsAppInboxConversation(input: {
  phone: string;
  contactName?: string | null;
  leadId?: string | null;
  email?: string | null;
  language?: string | null;
  status?: WhatsAppInboxConversationStatus;
  messages: Array<{
    id: string;
    direction: WhatsAppInboxMessageDirection;
    type?: WhatsAppInboxMessageType;
    body: string;
    status?: WhatsAppInboxMessageStatus;
    occurredAt: string;
  }>;
}) {
  const db = loadDb();
  const sortedMessages = [...input.messages]
    .filter((message) => message.id.trim() && message.body.trim())
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const timestamp =
    sortedMessages[sortedMessages.length - 1]?.occurredAt ||
    new Date().toISOString();
  const conversation = getOrCreateConversation(db, {
    phone: input.phone,
    contactName: input.contactName,
    leadId: input.leadId,
    email: input.email,
    language: input.language,
    timestamp,
  });

  let added = 0;
  for (const item of sortedMessages) {
    const legacyMessageId = `legacy:${item.id.trim()}`;
    if (hasMessage(conversation, legacyMessageId)) continue;

    const message: WhatsAppInboxMessage = {
      id: createMessageId(item.direction === "inbound" ? "wa_legacy_in" : "wa_legacy_out"),
      direction: item.direction,
      type: item.type || "text",
      whatsappMessageId: legacyMessageId,
      body: item.body.trim(),
      status:
        item.status ||
        (item.direction === "inbound" ? "received" : "sent"),
      error: null,
      createdAt: item.occurredAt,
      updatedAt: item.occurredAt,
      sentByUserId: null,
      sentByEmail: null,
    };
    conversation.messages.push(message);
    added += 1;
  }

  if (added > 0) {
    conversation.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const inboundMessages = conversation.messages.filter(
      (message) => message.direction === "inbound",
    );
    const outboundMessages = conversation.messages.filter(
      (message) => message.direction === "outbound",
    );
    conversation.lastInboundAt =
      inboundMessages[inboundMessages.length - 1]?.createdAt ||
      conversation.lastInboundAt;
    conversation.lastOutboundAt =
      outboundMessages[outboundMessages.length - 1]?.createdAt ||
      conversation.lastOutboundAt;
    conversation.lastMessageAt =
      conversation.messages[conversation.messages.length - 1]?.createdAt ||
      conversation.lastMessageAt;
    conversation.status = input.status || conversation.status;
    conversation.updatedAt = new Date().toISOString();
    saveDb(db);
  }

  return { conversation, added };
}
