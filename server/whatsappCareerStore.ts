import path from "path";
import { getAppDataDir } from "./dataDir";
import { ensureJsonFile, readJsonFile, writeJsonFileAtomic } from "./jsonFile";

export type WhatsAppCareerStep = "level" | "goal" | "schedule" | "complete";

export type WhatsAppCareerConversation = {
  id: string;
  phone: string;
  leadId: string;
  language: string;
  step: WhatsAppCareerStep;
  answers: Partial<Record<WhatsAppCareerStep, string>>;
  createdAt: string;
  updatedAt: string;
};

type WhatsAppCareerDb = {
  conversations: WhatsAppCareerConversation[];
};

const DB_PATH = path.join(getAppDataDir(), "whatsapp-career-conversations.json");

function ensureDbFile() {
  ensureJsonFile<WhatsAppCareerDb>(DB_PATH, { conversations: [] });
}

function loadDb() {
  ensureDbFile();
  const parsed = readJsonFile<Partial<WhatsAppCareerDb>>(DB_PATH);
  return { conversations: parsed.conversations ?? [] };
}

function saveDb(db: WhatsAppCareerDb) {
  writeJsonFileAtomic(DB_PATH, db);
}

function findLatestConversationByPhone(db: WhatsAppCareerDb, phone: string) {
  return (
    db.conversations
      .filter((conversation) => conversation.phone === phone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export function getWhatsAppCareerConversationByPhone(phone: string) {
  const db = loadDb();
  return findLatestConversationByPhone(db, phone);
}

export function listWhatsAppCareerConversations() {
  const db = loadDb();
  return [...db.conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function startWhatsAppCareerConversation(input: {
  phone: string;
  leadId: string;
  language: string;
}) {
  const db = loadDb();
  const now = new Date().toISOString();
  const existing = findLatestConversationByPhone(db, input.phone);

  if (existing) {
    existing.leadId = input.leadId;
    existing.language = input.language;
    existing.step = "level";
    existing.answers = {};
    existing.updatedAt = now;
    db.conversations = db.conversations.filter(
      (conversation) => conversation.id !== existing.id,
    );
    db.conversations.unshift(existing);
    saveDb(db);
    return existing;
  }

  const conversation: WhatsAppCareerConversation = {
    id: `wa_career_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`,
    phone: input.phone,
    leadId: input.leadId,
    language: input.language,
    step: "level",
    answers: {},
    createdAt: now,
    updatedAt: now,
  };
  db.conversations.unshift(conversation);
  saveDb(db);
  return conversation;
}

export function recordWhatsAppCareerAnswer(input: {
  phone: string;
  answer: string;
  nextStep: WhatsAppCareerStep;
}) {
  const db = loadDb();
  const conversation = findLatestConversationByPhone(db, input.phone);
  if (!conversation) return null;

  conversation.answers[conversation.step] = input.answer.trim();
  conversation.step = input.nextStep;
  conversation.updatedAt = new Date().toISOString();

  db.conversations = db.conversations.filter(
    (stored) => stored.id !== conversation.id,
  );
  db.conversations.unshift(conversation);
  saveDb(db);
  return conversation;
}
