import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { COOKIE_NAME, ONE_YEAR_MS, VISITOR_COOKIE_NAME } from "../shared/const";
import {
  consumeToken,
  createSession,
  createToken,
  createUser,
  deleteUserById,
  deleteSession,
  deleteUserSessions,
  getAdminSnapshot,
  getSession,
  getUserByEmail,
  getUserById,
  markUserEmailVerified,
  recordEvent,
  serializePublicUser,
  updateAdminUser,
  updateUserPassword,
  verifyPassword,
} from "./authStore";
import { sendAuthEmail } from "./authMailer";
import { normalizeAuthLocale, renderAuthEmailTemplate } from "./authEmailTemplates";
import { createVisitorId, getVisitorsSnapshot, trackVisitor, trackVisitorInteraction } from "./visitorStore";
import { getGa4DashboardSnapshot } from "./ga4Reporting";
import { generateAssistantReply, isChatEnabled } from "./chatAssistant";
import {
  appendConversationMessage,
  createConversation,
  getConversationById,
  getConversationMessages,
  getConversationsSnapshot,
  saveConversationSupportIntake,
  updateConversationMeta,
  upsertConversationForVisitor,
} from "./chatStore";
import { getVisitorById } from "./visitorStore";
import {
  backfillArticleTranslations,
  createArticle,
  deleteArticle,
  getArticleBySlug,
  listAdminArticles,
  listPublishedArticles,
  saveArticleImage,
  saveArticleImageBuffer,
  updateArticle,
  type ArticleLocale,
} from "./articleStore";
import { createBooking, getBookingAvailability, type BookingPriority } from "./bookingStore";
import { storeContactLead } from "./contactStore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAGIC_LINK_MS = 1000 * 60 * 20;
const VERIFY_LINK_MS = 1000 * 60 * 60 * 24;
const RESET_LINK_MS = 1000 * 60 * 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function parseCookies(cookieHeader?: string) {
  const entries = (cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  return Object.fromEntries(
    entries.map((entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex === -1) return [entry, ""];
      return [entry.slice(0, separatorIndex), decodeURIComponent(entry.slice(separatorIndex + 1))];
    })
  ) as Record<string, string>;
}

function appOrigin(req: express.Request) {
  return (process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
}

function localePrefix(locale?: string | null) {
  const resolvedLocale = normalizeAuthLocale(locale);
  if (resolvedLocale === "fr" || resolvedLocale === "ar") return `/${resolvedLocale}`;
  return "";
}

function summarizeArticle(body: string, maxLength = 180) {
  const normalized = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setSessionCookie(res: express.Response, sessionId: string) {
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });
}

function clearSessionCookie(res: express.Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function setVisitorCookie(res: express.Response, visitorId: string) {
  res.cookie(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });
}

function getCurrentUser(req: express.Request) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[COOKIE_NAME];
  if (!sessionId) return null;

  const session = getSession(sessionId);
  if (!session) return null;

  const user = getUserById(session.userId);
  if (!user) return null;
  if (!user.emailVerifiedAt) {
    deleteSession(session.id);
    return null;
  }

  return { session, user };
}

function getRequestIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || null;
}

function isAdminEmail(email: string) {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured.includes(email.toLowerCase());
  }

  return email.toLowerCase().endsWith("@cvsolucion.com");
}

function rateLimit(options: { key: string; windowMs: number; limit: number }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = getRequestIp(req) || "unknown";
    const bucketKey = `${options.key}:${ip}`;
    const now = Date.now();
    const current = rateLimitStore.get(bucketKey);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (current.count >= options.limit) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }

    current.count += 1;
    return next();
  };
}

function requireAdmin(req: express.Request, res: express.Response) {
  const auth = getCurrentUser(req);
  if (!auth) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }

  if (!isAdminEmail(auth.user.email)) {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  return auth;
}

function getOrCreateRequestVisitor(req: express.Request, res: express.Response) {
  const cookies = parseCookies(req.headers.cookie);
  const existingVisitorId = cookies[VISITOR_COOKIE_NAME];
  const visitorId = existingVisitorId || createVisitorId();
  if (!existingVisitorId) {
    setVisitorCookie(res, visitorId);
  }
  return visitorId;
}

function getChatFallback(locale: "en" | "fr" | "ar") {
  if (locale === "fr") {
    return "Je ne peux pas répondre correctement pour l'instant. Reessayez dans un instant ou contactez-nous sur WhatsApp avec votre besoin.";
  }
  if (locale === "ar") {
    return "تعذر عليّ الرد بشكل صحيح الآن. حاول بعد قليل أو تواصل معنا عبر واتساب مع تفاصيل طلبك.";
  }
  return "I could not answer properly right now. Please try again in a moment or contact us on WhatsApp with your request.";
}

async function sendLinkEmail(args: {
  email: string;
  locale?: string;
  type: "verify" | "magic" | "reset";
  url: string;
}) {
  const emailTemplate = renderAuthEmailTemplate({
    email: args.email,
    locale: args.locale,
    type: args.type,
    url: args.url,
  });

  await sendAuthEmail({
    to: args.email,
    subject: emailTemplate.subject,
    text: emailTemplate.text,
    html: emailTemplate.html,
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.set("trust proxy", true);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "15mb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
    next();
  });

  app.use((req, res, next) => {
    if (req.path.endsWith(".map")) {
      return res.status(404).send("Not Found");
    }
    return next();
  });

  const blockedPaths = [
    "/.env",
    "/.git",
    "/.htaccess",
    "/package.json",
    "/package-lock.json",
    "/pnpm-lock.yaml",
    "/yarn.lock",
    "/node_modules",
    "/tsconfig.json",
    "/vite.config.ts",
  ];

  app.use((req, res, next) => {
    const lowerPath = req.path.toLowerCase();
    if (blockedPaths.some((blocked) => lowerPath.startsWith(blocked))) {
      return res.status(404).send("Not Found");
    }
    return next();
  });

  app.get("/api/auth/me", (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      clearSessionCookie(res);
      return res.json({ user: null });
    }
    return res.json({ user: serializePublicUser(auth.user), isAdmin: isAdminEmail(auth.user.email) });
  });

  app.post("/api/visitor/track", rateLimit({ key: "visitor-track", windowMs: 1000 * 60, limit: 240 }), (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const existingVisitorId = cookies[VISITOR_COOKIE_NAME];
    const visitorId = existingVisitorId || createVisitorId();
    const auth = getCurrentUser(req);
    const payload = req.body || {};

    const visitor = trackVisitor({
      visitorId,
      path: String(payload.path || "/"),
      search: typeof payload.search === "string" ? payload.search : "",
      sessionId: typeof payload.sessionId === "string" ? payload.sessionId : null,
      locale: normalizeAuthLocale(String(payload.locale || "en")),
      title: typeof payload.title === "string" ? payload.title : null,
      referrer: typeof payload.referrer === "string" ? payload.referrer : null,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
      browserLanguage: typeof payload.browserLanguage === "string" ? payload.browserLanguage : null,
      timezone: typeof payload.timezone === "string" ? payload.timezone : null,
      screen: typeof payload.screen === "string" ? payload.screen : null,
      userId: auth?.user?.id ?? null,
      email: auth?.user?.email ?? null,
    });

    if (!existingVisitorId) {
      setVisitorCookie(res, visitorId);
    }

    return res.json({
      ok: true,
      visitor: {
        id: visitor.id,
        isRegistered: visitor.isRegistered,
      },
    });
  });

  app.post("/api/visitor/event", rateLimit({ key: "visitor-event", windowMs: 1000 * 60, limit: 300 }), (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const visitorId = cookies[VISITOR_COOKIE_NAME];
    if (!visitorId) {
      return res.json({ ok: true });
    }

    const payload = req.body || {};
    const eventType = String(payload.type || "");
    if (!["session_start", "session_end", "whatsapp_click", "email_click", "cta_click", "chat_open", "chat_message"].includes(eventType)) {
      return res.status(400).json({ error: "Unsupported visitor event." });
    }

    const visitor = trackVisitorInteraction({
      visitorId,
      type: eventType as any,
      path: String(payload.path || "/"),
      label: typeof payload.label === "string" ? payload.label : null,
      href: typeof payload.href === "string" ? payload.href : null,
      sessionId: typeof payload.sessionId === "string" ? payload.sessionId : null,
      durationMs: typeof payload.durationMs === "number" ? payload.durationMs : null,
      pageCount: typeof payload.pageCount === "number" ? payload.pageCount : null,
    });

    return res.json({ ok: true, tracked: Boolean(visitor) });
  });

  app.post("/api/chat/session", rateLimit({ key: "chat-session", windowMs: 1000 * 60 * 10, limit: 80 }), (req, res) => {
    const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
    const pathValue = typeof req.body?.path === "string" ? req.body.path : req.path;
    const auth = getCurrentUser(req);
    const visitorId = getOrCreateRequestVisitor(req, res);
    const visitor =
      getVisitorById(visitorId) ??
      trackVisitor({
        visitorId,
        path: pathValue,
        search: "",
        sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
        locale,
        title: null,
        referrer: req.get("referer") || null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
        browserLanguage: null,
        timezone: null,
        screen: null,
        userId: auth?.user?.id ?? null,
        email: auth?.user?.email ?? null,
      });

    const { conversation, isNew } = upsertConversationForVisitor({
      visitorId,
      userId: auth?.user?.id ?? null,
      email: auth?.user?.email ?? null,
      locale,
      path: pathValue,
      visitor,
    });

    trackVisitorInteraction({
      visitorId,
      type: "chat_open",
      path: pathValue,
      label: "chat_widget",
      href: null,
      sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
    });

    return res.json({
      ok: true,
      enabled: isChatEnabled(),
      isNew,
      conversation: {
        id: conversation.id,
        email: conversation.email,
        locale: conversation.locale,
        assistantName: conversation.assistantName,
        status: conversation.status,
        title: conversation.title,
        messages: conversation.messages,
        leadScore: conversation.leadScore,
        supportFormRequired: conversation.supportFormRequired,
        supportIntake: conversation.supportIntake,
      },
    });
  });

  app.post("/api/chat/new-session", rateLimit({ key: "chat-new-session", windowMs: 1000 * 60 * 10, limit: 40 }), (req, res) => {
    const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
    const pathValue = typeof req.body?.path === "string" ? req.body.path : req.path;
    const auth = getCurrentUser(req);
    const visitorId = getOrCreateRequestVisitor(req, res);
    const visitor =
      getVisitorById(visitorId) ??
      trackVisitor({
        visitorId,
        path: pathValue,
        search: "",
        sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
        locale,
        title: null,
        referrer: req.get("referer") || null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
        browserLanguage: null,
        timezone: null,
        screen: null,
        userId: auth?.user?.id ?? null,
        email: auth?.user?.email ?? null,
      });

    const conversation = createConversation({
      visitorId,
      userId: auth?.user?.id ?? null,
      email: auth?.user?.email ?? null,
      locale,
      path: pathValue,
      visitor,
    });

    trackVisitorInteraction({
      visitorId,
      type: "chat_open",
      path: pathValue,
      label: "chat_widget_new_session",
      href: null,
      sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
    });

    return res.json({
      ok: true,
      enabled: isChatEnabled(),
      isNew: true,
      conversation: {
        id: conversation.id,
        email: conversation.email,
        locale: conversation.locale,
        assistantName: conversation.assistantName,
        status: conversation.status,
        title: conversation.title,
        messages: conversation.messages,
        leadScore: conversation.leadScore,
        supportFormRequired: conversation.supportFormRequired,
        supportIntake: conversation.supportIntake,
      },
    });
  });

  app.post("/api/chat/message", rateLimit({ key: "chat-message", windowMs: 1000 * 60 * 10, limit: 120 }), async (req, res) => {
    const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
    const pathValue = typeof req.body?.path === "string" ? req.body.path : "/";
    const rawMessage = String(req.body?.message || "").trim();
    const conversationId = String(req.body?.conversationId || "").trim();

    if (!rawMessage) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (rawMessage.length > 2000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const auth = getCurrentUser(req);
    const visitorId = getOrCreateRequestVisitor(req, res);
    const visitor =
      getVisitorById(visitorId) ??
      trackVisitor({
        visitorId,
        path: pathValue,
        search: "",
        sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
        locale,
        title: null,
        referrer: req.get("referer") || null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
        browserLanguage: null,
        timezone: null,
        screen: null,
        userId: auth?.user?.id ?? null,
        email: auth?.user?.email ?? null,
      });

    let conversation =
      (conversationId ? getConversationById(conversationId) : null) ??
      upsertConversationForVisitor({
        visitorId,
        userId: auth?.user?.id ?? null,
        email: auth?.user?.email ?? null,
        locale,
        path: pathValue,
        visitor,
      }).conversation;

    if (conversation.visitorId !== visitorId) {
      return res.status(403).json({ error: "Conversation access denied." });
    }
    if (auth?.user?.id && conversation.userId && conversation.userId !== auth.user.id) {
      return res.status(403).json({ error: "Conversation access denied." });
    }

    appendConversationMessage({
      conversationId: conversation.id,
      role: "user",
      content: rawMessage,
      path: pathValue,
      visitor,
    });
    trackVisitorInteraction({
      visitorId,
      type: "chat_message",
      path: pathValue,
      label: "user_message",
      href: null,
      sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
    });

    conversation = getConversationById(conversation.id)!;
    const messages = getConversationMessages(conversation.id);

    let assistantText = getChatFallback(locale);
    let responseId: string | null = null;
    let status: "open" | "waiting_client" | "needs_human" = "open";
    let supportFormRequired = conversation.supportFormRequired;

    if (isChatEnabled()) {
      try {
        const reply = await generateAssistantReply({
          locale,
          conversation,
          messages,
          visitor,
          latestUserMessage: rawMessage,
        });
        assistantText = reply.text;
        responseId = reply.responseId;
        status = reply.status;
        supportFormRequired = reply.supportFormRequired;
      } catch (error) {
        console.error("[chat-assistant]", error);
        status = "needs_human";
      }
    }

    appendConversationMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: assistantText,
      path: pathValue,
      visitor,
    });

    const updatedConversation = updateConversationMeta({
      conversationId: conversation.id,
      latestResponseId: responseId,
      status,
      path: pathValue,
      visitor,
      supportFormRequired,
    });

    return res.json({
      ok: true,
      enabled: isChatEnabled(),
      isNew: false,
      conversation: {
        id: updatedConversation.id,
        email: updatedConversation.email,
        locale: updatedConversation.locale,
        assistantName: updatedConversation.assistantName,
        status: updatedConversation.status,
        title: updatedConversation.title,
        leadScore: updatedConversation.leadScore,
        messages: updatedConversation.messages,
        supportFormRequired: updatedConversation.supportFormRequired,
        supportIntake: updatedConversation.supportIntake,
      },
    });
  });

  app.post("/api/chat/support-intake", rateLimit({ key: "chat-support-intake", windowMs: 1000 * 60 * 10, limit: 40 }), (req, res) => {
    const conversationId = String(req.body?.conversationId || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim();
    const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
    const pathValue = typeof req.body?.path === "string" ? req.body.path : "/";

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation is required." });
    }
    if (!phone || !email) {
      return res.status(400).json({ error: "Phone and email are required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Valid email is required." });
    }

    const auth = getCurrentUser(req);
    const visitorId = getOrCreateRequestVisitor(req, res);
    const visitor = getVisitorById(visitorId);
    const conversation = getConversationById(conversationId);

    if (!conversation || conversation.visitorId !== visitorId) {
      return res.status(403).json({ error: "Conversation access denied." });
    }
    if (auth?.user?.id && conversation.userId && conversation.userId !== auth.user.id) {
      return res.status(403).json({ error: "Conversation access denied." });
    }

    const updatedConversation = saveConversationSupportIntake({
      conversationId,
      phone,
      email,
      visitor,
    });

    const confirmation =
      locale === "fr"
        ? "Merci. Les informations sont recues. Un membre de l'equipe reviendra vers vous."
        : locale === "ar"
          ? "شكرًا. تم استلام المعلومات، وسيتواصل معك أحد أفراد الفريق."
          : "Thanks. Your details are received, and a team member will follow up.";

    appendConversationMessage({
      conversationId,
      role: "assistant",
      content: confirmation,
      path: pathValue,
      visitor,
    });

    const finalConversation = getConversationById(conversationId)!;

    return res.json({
      ok: true,
      enabled: isChatEnabled(),
      isNew: false,
      conversation: {
        id: finalConversation.id,
        email: finalConversation.email,
        locale: finalConversation.locale,
        assistantName: finalConversation.assistantName,
        status: finalConversation.status,
        title: finalConversation.title,
        leadScore: finalConversation.leadScore,
        messages: finalConversation.messages,
        supportFormRequired: finalConversation.supportFormRequired,
        supportIntake: finalConversation.supportIntake,
      },
    });
  });

  app.post("/api/contact", rateLimit({ key: "contact", windowMs: 1000 * 60 * 10, limit: 20 }), async (req, res, next) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const company = String(req.body?.company || "").trim();
      const phone = String(req.body?.phone || "").trim();
      const interest = String(req.body?.interest || "").trim();
      const message = String(req.body?.message || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (name.length < 2) {
        return res.status(400).json({ error: "Name is required." });
      }
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "A valid email is required." });
      }
      if (message.length < 10) {
        return res.status(400).json({ error: "Please provide a little more context in your message." });
      }

      const lead = storeContactLead({ name, email, company, phone, interest, message });
      const destination = (process.env.CONTACT_EMAIL || "contact@cvsolucion.com").trim();
      const source = req.get("referer") || appOrigin(req);

      const lines = [
        `Lead ID: ${lead.id}`,
        `Name: ${lead.name}`,
        `Email: ${lead.email}`,
        lead.company ? `Company: ${lead.company}` : null,
        lead.phone ? `Phone: ${lead.phone}` : null,
        lead.interest ? `Interest: ${lead.interest}` : null,
        `Locale: ${locale}`,
        `Source: ${source}`,
        "",
        lead.message,
      ].filter(Boolean);

      await sendAuthEmail({
        to: destination,
        subject: `New CVsolucion contact request - ${lead.name}`,
        text: lines.join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2 style="margin:0 0 16px">New CVsolucion contact request</h2>
            <p><strong>Lead ID:</strong> ${escapeHtml(lead.id)}</p>
            <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
            ${lead.company ? `<p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>` : ""}
            ${lead.phone ? `<p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>` : ""}
            ${lead.interest ? `<p><strong>Interest:</strong> ${escapeHtml(lead.interest)}</p>` : ""}
            <p><strong>Locale:</strong> ${escapeHtml(locale)}</p>
            <p><strong>Source:</strong> ${escapeHtml(source)}</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #cbd5e1" />
            <p style="white-space:pre-wrap">${escapeHtml(lead.message)}</p>
          </div>
        `,
      });

      return res.status(201).json({ ok: true, leadId: lead.id });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/bookings/availability", rateLimit({ key: "booking-availability", windowMs: 1000 * 60, limit: 120 }), (req, res) => {
    const priority = String(req.query.priority || "standard").trim() === "express" ? "express" : "standard";
    return res.json(getBookingAvailability(priority));
  });

  app.post("/api/bookings", rateLimit({ key: "bookings-create", windowMs: 1000 * 60 * 10, limit: 20 }), async (req, res, next) => {
    try {
      const serviceType = String(req.body?.serviceType || "consultation").trim() === "support" ? "support" : "consultation";
      const priority = String(req.body?.priority || "standard").trim() === "express" ? "express" : "standard";
      const date = String(req.body?.date || "").trim();
      const hour = Number(req.body?.hour);
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const phone = String(req.body?.phone || "").trim();
      const company = String(req.body?.company || "").trim();
      const notes = String(req.body?.notes || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (name.length < 2) {
        return res.status(400).json({ error: "Name is required." });
      }
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "A valid email is required." });
      }
      if (phone.length < 6) {
        return res.status(400).json({ error: "A valid phone number is required." });
      }
      if (company.length < 2) {
        return res.status(400).json({ error: "Company name is required." });
      }
      if (notes.length < 10) {
        return res.status(400).json({ error: "Please describe the issue or request." });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Please choose a valid booking date." });
      }
      if (!Number.isInteger(hour)) {
        return res.status(400).json({ error: "Please choose a valid appointment time." });
      }

      const booking = createBooking({
        serviceType,
        priority: priority as BookingPriority,
        date,
        hour,
        name,
        email,
        phone,
        company,
        notes,
        locale,
      });

      const slotLabel = `${booking.date} ${String(booking.hour).padStart(2, "0")}:00`;
      const destination = (process.env.CONTACT_EMAIL || "contact@cvsolucion.com").trim();
      const priorityLabel = booking.priority === "express" ? "Express" : "Standard";
      const serviceLabel = booking.serviceType === "support" ? "Support" : "Consultation";

      await sendAuthEmail({
        to: destination,
        subject: `New ${priorityLabel} booking - ${booking.name}`,
        text: [
          `Booking ID: ${booking.id}`,
          `Service: ${serviceLabel}`,
          `Priority: ${priorityLabel}`,
          `Slot (Quebec): ${slotLabel}`,
          `Name: ${booking.name}`,
          `Email: ${booking.email}`,
          `Phone: ${booking.phone}`,
          booking.company ? `Company: ${booking.company}` : null,
          booking.notes ? `Notes: ${booking.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2 style="margin:0 0 16px">New ${escapeHtml(priorityLabel)} booking</h2>
            <p><strong>Booking ID:</strong> ${escapeHtml(booking.id)}</p>
            <p><strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
            <p><strong>Priority:</strong> ${escapeHtml(priorityLabel)}</p>
            <p><strong>Slot (Quebec):</strong> ${escapeHtml(slotLabel)}</p>
            <p><strong>Name:</strong> ${escapeHtml(booking.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>
            ${booking.company ? `<p><strong>Company:</strong> ${escapeHtml(booking.company)}</p>` : ""}
            ${booking.notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ""}
          </div>
        `,
      });

      await sendAuthEmail({
        to: booking.email,
        subject: "Your CVsolucion booking request is confirmed",
        text: [
          `Hello ${booking.name},`,
          "",
          `Your ${priorityLabel.toLowerCase()} ${serviceLabel.toLowerCase()} booking request has been recorded.`,
          `Requested slot (Quebec time): ${slotLabel}`,
          "",
          "If any adjustment is needed, our team will contact you using the details you submitted.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <p>Hello ${escapeHtml(booking.name)},</p>
            <p>Your <strong>${escapeHtml(priorityLabel.toLowerCase())}</strong> ${escapeHtml(serviceLabel.toLowerCase())} booking request has been recorded.</p>
            <p><strong>Requested slot (Quebec time):</strong> ${escapeHtml(slotLabel)}</p>
            <p>If any adjustment is needed, our team will contact you using the details you submitted.</p>
          </div>
        `,
      });

      return res.status(201).json({ ok: true, booking });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/signup", rateLimit({ key: "signup", windowMs: 1000 * 60 * 10, limit: 10 }), async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (!EMAIL_REGEX.test(email) || !password || password.length < 8) {
        return res.status(400).json({ error: "Email and a password of at least 8 characters are required." });
      }

      const user = createUser(email, password);
      const { rawToken } = createToken(user.id, "verify_email", VERIFY_LINK_MS);
      const verifyUrl = `${appOrigin(req)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;

      recordEvent({
        type: "signup",
        userId: user.id,
        email: user.email,
        locale,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
      });
      await sendLinkEmail({ email: user.email, locale, type: "verify", url: verifyUrl });

      return res.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/login", rateLimit({ key: "login", windowMs: 1000 * 60 * 15, limit: 20 }), (req, res) => {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const user = getUserByEmail(email);

    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ error: "Invalid login credentials." });
    }
    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: "Please confirm your email before signing in." });
    }

    const session = createSession(user.id, ONE_YEAR_MS);
    setSessionCookie(res, session.id);
    recordEvent({
      type: "login",
      userId: user.id,
      email: user.email,
      locale: null,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    return res.json({
      user: serializePublicUser(user),
      isAdmin: isAdminEmail(user.email),
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const auth = getCurrentUser(req);
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[COOKIE_NAME];
    if (sessionId) {
      deleteSession(sessionId);
    }
    recordEvent({
      type: "logout",
      userId: auth?.user?.id ?? null,
      email: auth?.user?.email ?? null,
      locale: null,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    clearSessionCookie(res);
    return res.json({ ok: true });
  });

  app.post("/api/auth/magic-link", rateLimit({ key: "magic", windowMs: 1000 * 60 * 15, limit: 12 }), (req, res) => {
    console.warn("[auth:magic-link:disabled]", {
      email: String(req.body?.email || "").trim() || null,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    return res.status(410).json({ error: "Magic link sign-in has been removed. Use your password or reset it if needed." });
  });

  app.post("/api/auth/forgot-password", rateLimit({ key: "forgot", windowMs: 1000 * 60 * 15, limit: 12 }), async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const user = getUserByEmail(email);

      if (!user) {
        return res.json({ ok: true });
      }

      const { rawToken } = createToken(user.id, "reset_password", RESET_LINK_MS);
      const resetUrl = `${appOrigin(req)}${localePrefix(locale)}/login?recovery=1&token=${encodeURIComponent(rawToken)}`;

      recordEvent({
        type: "password_reset_requested",
        userId: user.id,
        email: user.email,
        locale,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
      });
      await sendLinkEmail({ email: user.email, locale, type: "reset", url: resetUrl });
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/reset-password", rateLimit({ key: "reset", windowMs: 1000 * 60 * 15, limit: 12 }), (req, res) => {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: "A valid token and a password of at least 8 characters are required." });
    }

    const tokenRecord = consumeToken(token, "reset_password");
    if (!tokenRecord) {
      return res.status(400).json({ error: "Reset link expired. Please request a new one." });
    }

    updateUserPassword(tokenRecord.userId, password);
    const user = getUserById(tokenRecord.userId);
    recordEvent({
      type: "password_reset_completed",
      userId: tokenRecord.userId,
      email: user?.email ?? null,
      locale: null,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    return res.json({ ok: true });
  });

  app.get("/api/auth/verify-email", (req, res) => {
    const token = String(req.query.token || "");
    const locale = normalizeAuthLocale(String(req.query.locale || "en"));
    const tokenRecord = consumeToken(token, "verify_email");
    const redirectUrl = `${appOrigin(req)}${localePrefix(locale)}/`;

    if (!tokenRecord) {
      return res.redirect(302, redirectUrl);
    }

    const user = markUserEmailVerified(tokenRecord.userId);
    const session = createSession(user.id, ONE_YEAR_MS);
    setSessionCookie(res, session.id);
    recordEvent({
      type: "email_verified",
      userId: user.id,
      email: user.email,
      locale,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    return res.redirect(302, redirectUrl);
  });

  app.get("/api/auth/magic-login", (req, res) => {
    const locale = normalizeAuthLocale(String(req.query.locale || "en"));
    return res.redirect(302, `${appOrigin(req)}${localePrefix(locale)}/login?magic=disabled`);
  });

  app.get("/api/admin/dashboard", rateLimit({ key: "admin-dashboard", windowMs: 1000 * 60, limit: 120 }), async (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    res.setHeader("Cache-Control", "no-store");
    const ga4 = await getGa4DashboardSnapshot();
    const visitors = getVisitorsSnapshot();
    return res.json({
      admin: {
        email: auth.user.email,
      },
      ...getAdminSnapshot(),
      visitors,
      conversations: getConversationsSnapshot(visitors),
      ga4,
      chat: {
        enabled: isChatEnabled(),
      },
    });
  });

  app.patch("/api/admin/users/:userId", rateLimit({ key: "admin-user-patch", windowMs: 1000 * 60 * 5, limit: 60 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const userId = String(req.params.userId || "").trim();
      const email = req.body?.email;
      const password = req.body?.password;
      const emailVerified = req.body?.emailVerified;

      const user = updateAdminUser({
        userId,
        email: typeof email === "string" ? email : undefined,
        password: typeof password === "string" ? password : undefined,
        emailVerified: typeof emailVerified === "boolean" ? emailVerified : undefined,
      });

      recordEvent({
        type: "admin_user_updated",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:update:${user.email}`,
      });

      return res.json({ ok: true, user });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/admin/users/:userId", rateLimit({ key: "admin-user-delete", windowMs: 1000 * 60 * 5, limit: 25 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const userId = String(req.params.userId || "").trim();
      if (userId === auth.user.id) {
        return res.status(400).json({ error: "You cannot delete your own admin account." });
      }

      const deletedUser = deleteUserById(userId);
      recordEvent({
        type: "admin_user_deleted",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:delete:${deletedUser.email}`,
      });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/users/:userId/send-verification", rateLimit({ key: "admin-send-verification", windowMs: 1000 * 60 * 5, limit: 30 }), async (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const userId = String(req.params.userId || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const user = getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.emailVerifiedAt) {
        return res.status(400).json({ error: "This email is already verified." });
      }

      const { rawToken } = createToken(user.id, "verify_email", VERIFY_LINK_MS);
      const verifyUrl = `${appOrigin(req)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;
      await sendLinkEmail({ email: user.email, locale, type: "verify", url: verifyUrl });

      recordEvent({
        type: "admin_verification_sent",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:verify:${user.email}`,
      });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/admin/sessions/:sessionId", rateLimit({ key: "admin-session-delete", windowMs: 1000 * 60 * 5, limit: 80 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const sessionId = String(req.params.sessionId || "").trim();
      deleteSession(sessionId);
      recordEvent({
        type: "admin_session_revoked",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:session:${sessionId}`,
      });
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/admin/users/:userId/sessions", rateLimit({ key: "admin-user-sessions-delete", windowMs: 1000 * 60 * 5, limit: 40 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const userId = String(req.params.userId || "").trim();
      const revoked = deleteUserSessions(userId);
      recordEvent({
        type: "admin_all_sessions_revoked",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:user-sessions:${userId}:${revoked}`,
      });
      return res.json({ ok: true, revoked });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/articles", (req, res) => {
    const locale = normalizeAuthLocale(String(req.query.locale || "en")) as ArticleLocale;
    const articles = listPublishedArticles(locale).map((item) => ({
      ...item,
      excerpt: summarizeArticle(item.body),
    }));
    return res.json({ articles });
  });

  app.get("/api/articles/:slug", (req, res) => {
    const slug = String(req.params.slug || "").trim();
    const locale = normalizeAuthLocale(String(req.query.locale || "en")) as ArticleLocale;
    const article = getArticleBySlug(slug, locale);
    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    return res.json({
      article: {
        ...article,
        excerpt: summarizeArticle(article.body),
      },
    });
  });

  app.get("/api/admin/articles", rateLimit({ key: "admin-articles", windowMs: 1000 * 60, limit: 120 }), (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const articles = listAdminArticles().map((item) => ({
      ...item,
      excerpt: summarizeArticle(item.body),
    }));
    return res.json({ articles });
  });

  app.post(
    "/api/admin/article-images",
    express.raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "12mb" }),
    rateLimit({ key: "admin-article-images", windowMs: 1000 * 60 * 5, limit: 40 }),
    (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const rawContentType = String(req.headers["content-type"] || "").trim().toLowerCase();
      const binaryTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

      if (binaryTypes.has(rawContentType)) {
        const rawFilename = String(req.headers["x-upload-filename"] || "").trim();
        const filename = rawFilename ? decodeURIComponent(rawFilename) : "";
        const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (!buffer.length) {
          return res.status(400).json({ error: "Image content is required." });
        }

        const image = saveArticleImageBuffer({ filename, contentType: rawContentType, buffer });
        return res.json({ ok: true, image });
      }

      const filename = String(req.body?.filename || "").trim();
      const contentType = String(req.body?.contentType || "").trim().toLowerCase();
      const base64 = String(req.body?.base64 || "").trim();
      if (!contentType || !base64) {
        return res.status(400).json({ error: "Image content is required." });
      }

      const image = saveArticleImage({ filename, contentType, base64 });
      return res.json({ ok: true, image });
    } catch (error) {
      return next(error);
    }
    }
  );

  app.post("/api/admin/articles", rateLimit({ key: "admin-articles-create", windowMs: 1000 * 60 * 5, limit: 40 }), async (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const title = String(req.body?.title || "").trim();
      const body = String(req.body?.body || "").trim();
      const sourceLocale = normalizeAuthLocale(String(req.body?.sourceLocale || "en")) as ArticleLocale;
      const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;
      const publishedAt = typeof req.body?.publishedAt === "string" ? req.body.publishedAt : null;

      if (!title || !body) {
        return res.status(400).json({ error: "Title and article body are required." });
      }

      const article = await createArticle({ sourceLocale, title, body, imageUrl, publishedAt });
      return res.json({ ok: true, article: { ...article, excerpt: summarizeArticle(article.body) } });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/articles/:articleId", rateLimit({ key: "admin-articles-update", windowMs: 1000 * 60 * 5, limit: 80 }), async (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const articleId = String(req.params.articleId || "").trim();
      const title = String(req.body?.title || "").trim();
      const body = String(req.body?.body || "").trim();
      const sourceLocale = normalizeAuthLocale(String(req.body?.sourceLocale || "en")) as ArticleLocale;
      const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;
      const publishedAt = typeof req.body?.publishedAt === "string" ? req.body.publishedAt : null;

      if (!title || !body) {
        return res.status(400).json({ error: "Title and article body are required." });
      }

      const article = await updateArticle(articleId, { sourceLocale, title, body, imageUrl, publishedAt });
      return res.json({ ok: true, article: { ...article, excerpt: summarizeArticle(article.body) } });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/admin/articles/:articleId", rateLimit({ key: "admin-articles-delete", windowMs: 1000 * 60 * 5, limit: 40 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const articleId = String(req.params.articleId || "").trim();
      deleteArticle(articleId);
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(
    express.static(staticPath, {
      maxAge: "1y",
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        } else if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
      },
    })
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), "data", "uploads"), { maxAge: "30d", etag: true, lastModified: true }));

  app.get("*", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    const wantsFr = req.path === "/fr" || req.path.startsWith("/fr/");
    const wantsAr = req.path === "/ar" || req.path.startsWith("/ar/");

    if (wantsFr || wantsAr) {
      try {
        const html = fs.readFileSync(indexPath, "utf8");
        const lang = wantsFr ? "fr" : "ar";
        const dir = wantsAr ? ' dir="rtl"' : "";
        const patched = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"${dir}`);
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.status(200);
        return res.end(patched);
      } catch {
        return res.sendFile(indexPath);
      }
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.sendFile(indexPath);
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log("Security headers enabled");
    void backfillArticleTranslations()
      .then(({ translated }) => {
        if (translated > 0) {
          console.log(`[articles] backfilled translations for ${translated} article(s)`);
        }
      })
      .catch((error) => {
        console.error("[articles] translation backfill failed", error);
      });
  });
}

startServer().catch(console.error);
