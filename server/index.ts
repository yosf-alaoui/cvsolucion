import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type Stripe from "stripe";
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
import {
  applyStripeRefundUpdate,
  blockBookingSlotByAdmin,
  cancelBookingByAdmin,
  createBooking,
  getAdminBookingSlotsForDate,
  getBookingById,
  getBookingAvailability,
  listBookings,
  listBookingsByPaymentReference,
  listBookingsForUser,
  markBookingRefundPendingByAdmin,
  rescheduleBooking,
  serializeCustomerBooking,
  unblockBookingSlotByAdmin,
  type BookingPriority,
} from "./bookingStore";
import { getBookingScheduleSettings, isBookingScheduleOpen, updateBookingScheduleSettings } from "./bookingSettingsStore";
import { listContactLeads, storeContactLead } from "./contactStore";
import { buildRobotsTxt, buildSitemapXml, renderSeoHtml } from "./seo";
import { getCustomerProfile, updateCustomerProfile, upsertCustomerProfile } from "./customerProfileStore";
import { buildInvoiceFilename, renderInvoicePdf } from "./invoicePdf";
import { getInvoiceById, issueInvoicesForBookings, listInvoicesForUser, type InvoiceRecord } from "./invoiceStore";
import {
  constructStripeEvent,
  createBookingPaymentIntent,
  createBookingRefund,
  getStripePricingSnapshot,
  verifyBookingPayment,
} from "./stripeBooking";
import { hasProcessedStripeEvent, markStripeEventProcessed } from "./stripeEventStore";
import { createCatalogPackage, deleteCatalogPackage, getCatalogSnapshot, getPublicCatalog, updateCatalogBookingPrices, updateCatalogPackage } from "./catalogStore";
import { getAppDataDir } from "./dataDir";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAGIC_LINK_MS = 1000 * 60 * 20;
const VERIFY_LINK_MS = 1000 * 60 * 60 * 24;
const RESET_LINK_MS = 1000 * 60 * 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const QUEBEC_TIMEZONE = "America/Toronto";

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

function canonicalOrigin(req: express.Request) {
  const configured = process.env.APP_ORIGIN?.replace(/\/+$/, "");
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (!/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(parsed.hostname)) {
        return configured;
      }
    } catch {
      return configured;
    }
  }

  const host = String(req.get("host") || "").trim();
  const forwardedProto = String(req.get("x-forwarded-proto") || req.protocol || "https")
    .split(",")[0]
    .trim();

  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    return `${forwardedProto}://${host}`;
  }

  return "https://cvsolucion.com";
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

function parseRequestedBookingSlots(value: unknown) {
  const items = Array.isArray(value) ? value : [];
  const normalized = items
    .map((item) => {
      const slot = item as { date?: unknown; hour?: unknown };
      return {
        date: String(slot?.date || "").trim(),
        hour: Number(slot?.hour),
      };
    })
    .filter((slot) => /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && Number.isInteger(slot.hour));

  const unique = new Map<string, { date: string; hour: number }>();
  for (const slot of normalized) {
    unique.set(`${slot.date}:${slot.hour}`, slot);
  }
  return Array.from(unique.values());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeCustomerInvoice(invoice: InvoiceRecord) {
  return {
    id: invoice.id,
    bookingId: invoice.bookingId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    currency: invoice.currency,
    subtotalAmount: invoice.subtotalAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    serviceType: invoice.serviceType,
    priority: invoice.priority,
    date: invoice.date,
    hour: invoice.hour,
    downloadUrl: `/api/customer/invoices/${encodeURIComponent(invoice.id)}/download`,
  };
}

function normalizeStripeRefundStatus(status: string | null | undefined) {
  if (status === "failed") return "failed" as const;
  if (status === "canceled") return "canceled" as const;
  if (status === "succeeded") return "succeeded" as const;
  return "pending" as const;
}

function formatMoney(amount: number, currency: string | null | undefined, locale: "en" | "fr" | "ar") {
  const normalizedLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA";
  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amount / 100);
}

function formatBookingSlotForEmail(date: string, hour: number, locale: "en" | "fr" | "ar") {
  const normalizedLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA";
  const dt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(normalizedLocale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: QUEBEC_TIMEZONE,
  }).format(dt);
}

function renderRefundEmailTemplate(args: {
  locale: "en" | "fr" | "ar";
  name: string;
  slots: string[];
  amountLabel: string;
  status: "succeeded" | "failed" | "canceled";
  scope: "full" | "partial" | "manual" | "none";
}) {
  const slotsBlock = args.slots.length ? args.slots.join("\n") : "-";

  if (args.locale === "fr") {
    if (args.status === "succeeded") {
      return {
        subject: "Votre remboursement CVsolucion a été traité",
        text: [
          `Bonjour ${args.name},`,
          "",
          `Votre remboursement de ${args.amountLabel} a été traité.`,
          args.scope === "manual"
            ? "Le remboursement ne correspond pas exactement à des créneaux complets. Notre équipe vérifiera la mise à jour finale de votre dossier."
            : "Les créneaux remboursés ont été annulés dans votre espace client.",
          "",
          "Créneaux concernés (heure du Québec) :",
          slotsBlock,
        ].join("\n"),
      };
    }

    return {
      subject: "Mise à jour sur votre remboursement CVsolucion",
      text: [
        `Bonjour ${args.name},`,
        "",
        `Le remboursement demandé (${args.amountLabel}) est actuellement marqué comme "${args.status}".`,
        "Notre équipe vérifiera le dossier et vous recontactera si une action supplémentaire est nécessaire.",
      ].join("\n"),
    };
  }

  if (args.locale === "ar") {
    if (args.status === "succeeded") {
      return {
        subject: "تم تنفيذ استرجاع المبلغ من CVsolucion",
        text: [
          `مرحباً ${args.name}،`,
          "",
          `تم تنفيذ استرجاع بقيمة ${args.amountLabel}.`,
          args.scope === "manual"
            ? "هذا الاسترجاع لا يطابق مواعيد كاملة بشكل مباشر، لذلك سيقوم فريقنا بمراجعة الحالة النهائية يدوياً."
            : "تم إلغاء المواعيد المرتبطة بالاسترجاع داخل حسابك.",
          "",
          "المواعيد المتأثرة بتوقيت كيبيك:",
          slotsBlock,
        ].join("\n"),
      };
    }

    return {
      subject: "تحديث بخصوص استرجاع المبلغ من CVsolucion",
      text: [
        `مرحباً ${args.name}،`,
        "",
        `حالة الاسترجاع بقيمة ${args.amountLabel} هي حالياً: ${args.status}.`,
        "سيقوم فريقنا بمراجعة الحالة والتواصل معك إذا كان هناك أي إجراء إضافي.",
      ].join("\n"),
    };
  }

  if (args.status === "succeeded") {
    return {
      subject: "Your CVsolucion refund has been processed",
      text: [
        `Hello ${args.name},`,
        "",
        `Your refund of ${args.amountLabel} has been processed.`,
        args.scope === "manual"
          ? "The refunded amount does not map cleanly to whole booking slots, so our team will review the final booking status manually."
          : "The refunded appointment slots have been cancelled in your account.",
        "",
        "Affected slots (Quebec time):",
        slotsBlock,
      ].join("\n"),
    };
  }

  return {
    subject: "Update about your CVsolucion refund",
    text: [
      `Hello ${args.name},`,
      "",
      `The refund request for ${args.amountLabel} is currently marked as "${args.status}".`,
      "Our team will review it and contact you if any follow-up is needed.",
    ].join("\n"),
  };
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

  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = String(req.get("stripe-signature") || "").trim();
    if (!signature) {
      return res.status(400).send("Missing Stripe signature.");
    }

    try {
      const event = constructStripeEvent(req.body as Buffer, signature);
      if (hasProcessedStripeEvent(event.id)) {
        return res.json({ received: true, duplicate: true });
      }

      if (event.type === "payment_intent.succeeded") {
        console.log("[stripe:webhook] payment_intent.succeeded", event.data.object?.id || null);
      }

      if (event.type === "refund.created" || event.type === "refund.updated") {
        const refund = event.data.object as Stripe.Refund;
        const paymentReference =
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id || null;

        if (paymentReference) {
          const refundStatus = normalizeStripeRefundStatus(refund.status);
          const syncResult = applyStripeRefundUpdate({
            paymentReference,
            refundId: refund.id,
            refundAmount: refund.amount || 0,
            currency: refund.currency || null,
            refundStatus,
            bookingIds: String(refund.metadata?.bookingIds || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          });

          if (syncResult) {
            console.log("[stripe:webhook] refund.sync", {
              eventId: event.id,
              refundId: refund.id,
              paymentReference,
              refundStatus,
              scope: syncResult.scope,
              matchedBookings: syncResult.groupBookings.length,
              affectedBookings: syncResult.affectedBookings.length,
            });

            if (
              syncResult.customer?.email &&
              (refundStatus === "succeeded" || refundStatus === "failed" || refundStatus === "canceled")
            ) {
              const locale = syncResult.customer.locale;
              const amountLabel = formatMoney(syncResult.refundAmount, syncResult.currency, locale);
              const slots = (syncResult.affectedBookings.length ? syncResult.affectedBookings : syncResult.groupBookings)
                .map((booking) => formatBookingSlotForEmail(booking.date, booking.hour, locale));
              const template = renderRefundEmailTemplate({
                locale,
                name: syncResult.customer.name || syncResult.customer.email,
                slots,
                amountLabel,
                status: refundStatus,
                scope: syncResult.scope,
              });

              try {
                await sendAuthEmail({
                  to: syncResult.customer.email,
                  subject: template.subject,
                  text: template.text,
                  html: `
                    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
                      ${template.text
                        .split("\n")
                        .filter(Boolean)
                        .map((line) => `<p>${escapeHtml(line)}</p>`)
                        .join("")}
                    </div>
                  `,
                });
              } catch (mailError) {
                console.error("[stripe:webhook:refund-email:error]", {
                  eventId: event.id,
                  refundId: refund.id,
                  error: mailError instanceof Error ? mailError.stack || mailError.message : String(mailError),
                });
              }
            }
          }
        }
      }

      markStripeEventProcessed(event.id, event.type);
      return res.json({ received: true });
    } catch (error: any) {
      return res.status(400).send(error?.message || "Webhook verification failed.");
    }
  });

  app.use(express.json({ limit: "15mb" }));

  app.use((_req, res, next) => {
    const host = String(_req.get("host") || "").trim();
    const forwardedProto = String(_req.get("x-forwarded-proto") || _req.protocol || "https")
      .split(",")[0]
      .trim();
    const origin = host ? `${forwardedProto}://${host}` : "";
    const scriptAssetsSource = origin ? `${origin}/assets/` : "'self'";
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'unsafe-inline' ${scriptAssetsSource} https://js.stripe.com`,
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; ");

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(self)");
    res.setHeader("Cache-Control", "no-transform");
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);
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

  app.use((req, res, next) => {
    const hostHeader = String(req.get("host") || "").trim();
    if (!hostHeader) return next();

    const forwardedProto = String(req.get("x-forwarded-proto") || req.protocol || "https")
      .split(",")[0]
      .trim();

    let requestUrl: URL;
    let canonicalUrl: URL;
    try {
      requestUrl = new URL(`${forwardedProto}://${hostHeader}${req.originalUrl}`);
      canonicalUrl = new URL(canonicalOrigin(req));
    } catch {
      return next();
    }

    const requestHost = requestUrl.hostname.toLowerCase();
    const targetHost = canonicalUrl.hostname.replace(/^www\./i, "").toLowerCase();
    const targetProtocol = canonicalUrl.protocol;
    const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(requestHost);

    if (isLocalHost) return next();

    if (requestHost === `www.${targetHost}`) {
      requestUrl.hostname = targetHost;
      requestUrl.protocol = targetProtocol;
      return res.redirect(301, requestUrl.toString());
    }

    if (requestHost === targetHost && targetProtocol === "https:" && requestUrl.protocol !== "https:") {
      requestUrl.protocol = "https:";
      return res.redirect(301, requestUrl.toString());
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

  app.get("/api/customer/dashboard", rateLimit({ key: "customer-dashboard", windowMs: 1000 * 60, limit: 120 }), (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const profile =
      getCustomerProfile(auth.user.id) ??
      upsertCustomerProfile({
        userId: auth.user.id,
        email: auth.user.email,
      });

    const userBookings = listBookingsForUser(auth.user.id, auth.user.email);
    issueInvoicesForBookings(userBookings);
    const bookings = userBookings.map(serializeCustomerBooking);
    const invoices = listInvoicesForUser(auth.user.id, auth.user.email).map(serializeCustomerInvoice);

    return res.json({
      user: serializePublicUser(auth.user),
      profile,
      bookings,
      invoices,
    });
  });

  app.get(
    "/api/customer/invoices/:invoiceId/download",
    rateLimit({ key: "customer-invoice-download", windowMs: 1000 * 60, limit: 120 }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res.status(401).json({ error: "Authentication required." });
        }

        const invoiceId = String(req.params.invoiceId || "").trim();
        const invoice = getInvoiceById(invoiceId);

        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found." });
        }

        if (invoice.userId !== auth.user.id && invoice.email !== auth.user.email) {
          return res.status(403).json({ error: "You do not have access to this invoice." });
        }

        const pdf = await renderInvoicePdf(invoice);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${buildInvoiceFilename(invoice)}"`);
        return res.send(pdf);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.patch("/api/customer/profile", rateLimit({ key: "customer-profile", windowMs: 1000 * 60 * 10, limit: 40 }), (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const name = String(req.body?.name || "").trim();
    const country = String(req.body?.country || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const company = String(req.body?.company || "").trim();

    if (name.length < 2) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (country.length < 2) {
      return res.status(400).json({ error: "Country is required." });
    }
    if (phone.length < 6) {
      return res.status(400).json({ error: "A valid phone number is required." });
    }

    const profile = updateCustomerProfile({
      userId: auth.user.id,
      email: auth.user.email,
      name,
      country,
      phone,
      company,
    });

    return res.json({ ok: true, profile });
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
    const name = String(req.body?.name || "").trim();
    const country = String(req.body?.country || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim();
    const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
    const pathValue = typeof req.body?.path === "string" ? req.body.path : "/";

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation is required." });
    }
    if (!name || !country || !phone || !email) {
      return res.status(400).json({ error: "Name, country, phone, and email are required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Valid email is required." });
    }
    if (phone.length < 6) {
      return res.status(400).json({ error: "Valid phone number is required." });
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
      name,
      country,
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

  app.get("/api/catalog/public", rateLimit({ key: "catalog-public", windowMs: 1000 * 60, limit: 180 }), (req, res) => {
    const locale = normalizeAuthLocale(String(req.query.locale || "en"));
    return res.json(getPublicCatalog(locale));
  });

  app.get("/api/bookings/availability", rateLimit({ key: "booking-availability", windowMs: 1000 * 60, limit: 120 }), (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Please sign in before viewing appointment times." });
    }
    const priority = String(req.query.priority || "standard").trim() === "express" ? "express" : "standard";
    return res.json(getBookingAvailability(priority));
  });

  app.get("/api/stripe/config", rateLimit({ key: "stripe-config", windowMs: 1000 * 60, limit: 120 }), (_req, res) => {
    return res.json(getStripePricingSnapshot());
  });

  app.post("/api/stripe/booking-payment-intent", rateLimit({ key: "stripe-payment-intent", windowMs: 1000 * 60 * 10, limit: 40 }), async (req, res, next) => {
    try {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res.status(401).json({ error: "Please sign in before starting payment." });
      }

      const serviceType = String(req.body?.serviceType || "consultation").trim() === "support" ? "support" : "consultation";
      const priority = String(req.body?.priority || "standard").trim() === "express" ? "express" : "standard";
      const slots = parseRequestedBookingSlots(req.body?.slots);
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (!slots.length) {
        return res.status(400).json({ error: "Please choose at least one valid appointment time." });
      }
      if (!isBookingScheduleOpen(priority as BookingPriority)) {
        return res.status(400).json({
          error: priority === "express" ? "Express booking is currently closed." : "Standard booking is currently closed.",
        });
      }

      const intent = await createBookingPaymentIntent({
        userId: auth.user.id,
        email: auth.user.email,
        serviceType,
        priority: priority as BookingPriority,
        slots,
        locale,
      });

      return res.json({
        ok: true,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/bookings", rateLimit({ key: "bookings-create", windowMs: 1000 * 60 * 10, limit: 20 }), async (req, res, next) => {
    try {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res.status(401).json({ error: "Please sign in before booking an appointment." });
      }

      const serviceType = String(req.body?.serviceType || "consultation").trim() === "support" ? "support" : "consultation";
      const priority = String(req.body?.priority || "standard").trim() === "express" ? "express" : "standard";
      const slots = parseRequestedBookingSlots(req.body?.slots);
      const name = String(req.body?.name || "").trim();
      const email = auth.user.email;
      const phone = String(req.body?.phone || "").trim();
      const country = String(req.body?.country || "").trim();
      const company = String(req.body?.company || "").trim();
      const notes = String(req.body?.notes || "").trim();
      const packageKey = String(req.body?.packageKey || "").trim() || null;
      const paymentIntentId = String(req.body?.paymentIntentId || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (name.length < 2) {
        return res.status(400).json({ error: "Name is required." });
      }
      if (phone.length < 6) {
        return res.status(400).json({ error: "A valid phone number is required." });
      }
      if (country.length < 2) {
        return res.status(400).json({ error: "Country is required." });
      }
      if (company.length < 2) {
        return res.status(400).json({ error: "Company name is required." });
      }
      if (notes.length < 10) {
        return res.status(400).json({ error: "Please describe the issue or request." });
      }
      if (!slots.length) {
        return res.status(400).json({ error: "Please choose at least one valid appointment time." });
      }
      if (!isBookingScheduleOpen(priority as BookingPriority)) {
        return res.status(400).json({
          error: priority === "express" ? "Express booking is currently closed." : "Standard booking is currently closed.",
        });
      }

      const stripeConfig = getStripePricingSnapshot();
      let verifiedPayment: Awaited<ReturnType<typeof verifyBookingPayment>> | null = null;
      if (stripeConfig.enabled) {
        if (!paymentIntentId) {
          return res.status(400).json({ error: "Payment is required before confirming this booking." });
        }

        verifiedPayment = await verifyBookingPayment({
          paymentIntentId,
          userId: auth.user.id,
          serviceType,
          priority: priority as BookingPriority,
          slots,
        });
      }

      if (verifiedPayment?.id) {
        const existingBookings = listBookingsByPaymentReference(verifiedPayment.id).filter(
          (booking) => booking.userId === auth.user.id
        );
        if (existingBookings.length > 0) {
          upsertCustomerProfile({
            userId: auth.user.id,
            email: auth.user.email,
            name,
            country,
            phone,
            company,
          });

          return res.status(201).json({ ok: true, bookings: existingBookings, booking: existingBookings[0] });
        }
      }

      const bookings = slots.map((slot) =>
        createBooking({
          userId: auth.user.id,
          serviceType,
          priority: priority as BookingPriority,
          packageKey,
          date: slot.date,
          hour: slot.hour,
          name,
          email,
          phone,
          country,
          company,
          notes,
          locale,
          paymentStatus: verifiedPayment ? "paid" : "unpaid",
          paymentProvider: verifiedPayment ? "stripe" : null,
          paymentReference: verifiedPayment?.id || null,
        })
      );

      upsertCustomerProfile({
        userId: auth.user.id,
        email: auth.user.email,
        name,
        country,
        phone,
        company,
      });

      const slotLabel = bookings
        .map((booking) => `${booking.date} ${String(booking.hour).padStart(2, "0")}:00`)
        .join(", ");
      const destination = (process.env.CONTACT_EMAIL || "contact@cvsolucion.com").trim();
      const priorityLabel = priority === "express" ? "Express" : "Standard";
      const serviceLabel = serviceType === "support" ? "Support" : "Consultation";

      const bookingResponse = { ok: true, bookings, booking: bookings[0] };
      res.status(201).json(bookingResponse);

      void Promise.allSettled([
        sendAuthEmail({
          to: destination,
          subject: `New ${priorityLabel} booking - ${name}`,
          text: [
            `Booking IDs: ${bookings.map((booking) => booking.id).join(", ")}`,
            `Service: ${serviceLabel}`,
            `Priority: ${priorityLabel}`,
            `Slots (Quebec): ${slotLabel}`,
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            company ? `Company: ${company}` : null,
            notes ? `Notes: ${notes}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin:0 0 16px">New ${escapeHtml(priorityLabel)} booking</h2>
              <p><strong>Booking IDs:</strong> ${escapeHtml(bookings.map((booking) => booking.id).join(", "))}</p>
              <p><strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
              <p><strong>Priority:</strong> ${escapeHtml(priorityLabel)}</p>
              <p><strong>Slots (Quebec):</strong> ${escapeHtml(slotLabel)}</p>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(email)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
              ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
              ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
            </div>
          `,
        }),
        sendAuthEmail({
          to: email,
          subject: "Your CVsolucion booking request is confirmed",
          text: [
            `Hello ${name},`,
            "",
            `Your ${priorityLabel.toLowerCase()} ${serviceLabel.toLowerCase()} booking request has been recorded.`,
            `Requested slot(s) (Quebec time): ${slotLabel}`,
            "",
            "If any adjustment is needed, our team will contact you using the details you submitted.",
          ].join("\n"),
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <p>Hello ${escapeHtml(name)},</p>
              <p>Your <strong>${escapeHtml(priorityLabel.toLowerCase())}</strong> ${escapeHtml(serviceLabel.toLowerCase())} booking request has been recorded.</p>
              <p><strong>Requested slot(s) (Quebec time):</strong> ${escapeHtml(slotLabel)}</p>
              <p>If any adjustment is needed, our team will contact you using the details you submitted.</p>
            </div>
          `,
        }),
      ]).then((results) => {
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            const target = index === 0 ? "admin" : "customer";
            console.error("[booking:email:failed]", {
              target,
              bookingIds: bookings.map((booking) => booking.id),
              error: result.reason instanceof Error ? result.reason.stack || result.reason.message : String(result.reason),
            });
          }
        });
      });

      return;
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/bookings/:bookingId/reschedule", rateLimit({ key: "bookings-reschedule", windowMs: 1000 * 60 * 10, limit: 30 }), async (req, res, next) => {
    try {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res.status(401).json({ error: "Please sign in before changing an appointment." });
      }

      const bookingId = String(req.params.bookingId || "").trim();
      const date = String(req.body?.date || "").trim();
      const hour = Number(req.body?.hour);

      if (!bookingId) {
        return res.status(400).json({ error: "Booking is required." });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Please choose a valid booking date." });
      }
      if (!Number.isInteger(hour)) {
        return res.status(400).json({ error: "Please choose a valid appointment time." });
      }

      const booking = rescheduleBooking({
        bookingId,
        userId: auth.user.id,
        date,
        hour,
      });

      return res.json({ ok: true, booking: serializeCustomerBooking(booking) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/signup", rateLimit({ key: "signup", windowMs: 1000 * 60 * 10, limit: 10 }), async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const termsAccepted = Boolean(req.body?.termsAccepted);
      const termsVersion = "04/2026";

      if (!EMAIL_REGEX.test(email) || !password || password.length < 8) {
        return res.status(400).json({ error: "Email and a password of at least 8 characters are required." });
      }
      if (!termsAccepted) {
        return res.status(400).json({ error: "You must accept the Terms and Conditions before creating an account." });
      }

      const user = createUser(email, password, termsVersion);
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
    const bookings = listBookings().map(serializeCustomerBooking);
    const leads = listContactLeads();
    return res.json({
      admin: {
        email: auth.user.email,
      },
      ...getAdminSnapshot(),
      bookings,
      bookingSchedule: getBookingScheduleSettings(),
      leads,
      visitors,
      conversations: getConversationsSnapshot(visitors),
      ga4,
      chat: {
        enabled: isChatEnabled(),
      },
    });
  });

  app.get("/api/admin/catalog", rateLimit({ key: "admin-catalog-get", windowMs: 1000 * 60, limit: 120 }), (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    return res.json(getCatalogSnapshot());
  });

  app.put("/api/admin/catalog/pricing", rateLimit({ key: "admin-catalog-pricing", windowMs: 1000 * 60 * 5, limit: 50 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const pricing = updateCatalogBookingPrices({
        standardConsultation: Number(req.body?.standardConsultation),
        standardSupport: Number(req.body?.standardSupport),
        expressConsultation: Number(req.body?.expressConsultation),
        expressSupport: Number(req.body?.expressSupport),
      });

      return res.json({ ok: true, bookingPrices: pricing });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/catalog/packages", rateLimit({ key: "admin-catalog-package-create", windowMs: 1000 * 60 * 5, limit: 50 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const record = createCatalogPackage({
        active: typeof req.body?.active === "boolean" ? req.body.active : true,
        highlight: Boolean(req.body?.highlight),
        order: Number(req.body?.order),
        translations: req.body?.translations,
      });

      return res.status(201).json({ ok: true, package: record });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/catalog/packages/:packageId", rateLimit({ key: "admin-catalog-package-update", windowMs: 1000 * 60 * 5, limit: 100 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const packageId = String(req.params.packageId || "").trim();
      if (!packageId) {
        return res.status(400).json({ error: "Package is required." });
      }

      const record = updateCatalogPackage({
        id: packageId,
        active: typeof req.body?.active === "boolean" ? req.body.active : undefined,
        highlight: typeof req.body?.highlight === "boolean" ? req.body.highlight : undefined,
        order: typeof req.body?.order !== "undefined" ? Number(req.body.order) : undefined,
        translations: req.body?.translations,
      });

      return res.json({ ok: true, package: record });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/admin/catalog/packages/:packageId", rateLimit({ key: "admin-catalog-package-delete", windowMs: 1000 * 60 * 5, limit: 50 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const packageId = String(req.params.packageId || "").trim();
      if (!packageId) {
        return res.status(400).json({ error: "Package is required." });
      }

      deleteCatalogPackage(packageId);
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
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

  app.get("/api/admin/bookings/slots", rateLimit({ key: "admin-booking-slots", windowMs: 1000 * 60, limit: 180 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const date = String(req.query.date || "").trim();
      const priority = String(req.query.priority || "standard").trim() === "express" ? "express" : "standard";
      if (!date) {
        return res.status(400).json({ error: "Date is required." });
      }

      const payload = getAdminBookingSlotsForDate({
        date,
        priority: priority as BookingPriority,
      });

      return res.json({ ok: true, ...payload });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/bookings/slots/block", rateLimit({ key: "admin-booking-slot-block", windowMs: 1000 * 60 * 5, limit: 120 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const date = String(req.body?.date || "").trim();
      const hour = Number(req.body?.hour);
      const priority = String(req.body?.priority || "standard").trim() === "express" ? "express" : "standard";
      const reason = typeof req.body?.reason === "string" ? req.body.reason : null;

      if (!date || !Number.isInteger(hour)) {
        return res.status(400).json({ error: "Valid date and hour are required." });
      }

      const slot = blockBookingSlotByAdmin({
        date,
        hour,
        priority: priority as BookingPriority,
        reason,
        adminUserId: auth.user.id,
      });

      recordEvent({
        type: "admin_booking_slot_blocked",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:booking-slot-block:${date}:${hour}:${priority}`,
      });

      const slots = getAdminBookingSlotsForDate({
        date,
        priority: priority as BookingPriority,
      });

      return res.json({ ok: true, slot, ...slots });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/bookings/slots/unblock", rateLimit({ key: "admin-booking-slot-unblock", windowMs: 1000 * 60 * 5, limit: 120 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const date = String(req.body?.date || "").trim();
      const hour = Number(req.body?.hour);
      const priority = String(req.body?.priority || "standard").trim() === "express" ? "express" : "standard";

      if (!date || !Number.isInteger(hour)) {
        return res.status(400).json({ error: "Valid date and hour are required." });
      }

      const slot = unblockBookingSlotByAdmin({
        date,
        hour,
        priority: priority as BookingPriority,
      });
      if (!slot) {
        return res.status(404).json({ error: "Blocked slot not found." });
      }

      recordEvent({
        type: "admin_booking_slot_unblocked",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:booking-slot-unblock:${date}:${hour}:${priority}`,
      });

      const slots = getAdminBookingSlotsForDate({
        date,
        priority: priority as BookingPriority,
      });

      return res.json({ ok: true, slot, ...slots });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/bookings/:bookingId/cancel", rateLimit({ key: "admin-booking-cancel", windowMs: 1000 * 60 * 5, limit: 80 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const bookingId = String(req.params.bookingId || "").trim();
      if (!bookingId) {
        return res.status(400).json({ error: "Booking is required." });
      }

      const booking = cancelBookingByAdmin({ bookingId });

      recordEvent({
        type: "admin_booking_cancelled",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:booking-cancel:${booking.id}`,
      });

      return res.json({ ok: true, booking: serializeCustomerBooking(booking) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/admin/bookings/:bookingId/refund", rateLimit({ key: "admin-booking-refund", windowMs: 1000 * 60 * 5, limit: 40 }), async (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const bookingId = String(req.params.bookingId || "").trim();
      if (!bookingId) {
        return res.status(400).json({ error: "Booking is required." });
      }

      const booking = getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found." });
      }

      if (!booking.paymentReference || booking.paymentProvider !== "stripe") {
        return res.status(400).json({ error: "This booking has no Stripe payment to refund." });
      }

      if (booking.paymentStatus === "refunded") {
        return res.status(400).json({ error: "This booking has already been refunded." });
      }

      const refund = await createBookingRefund({
        paymentIntentId: booking.paymentReference,
        amount: booking.unitAmount,
        bookingIds: [booking.id],
      });

      const updated = markBookingRefundPendingByAdmin({
        bookingId: booking.id,
        refundId: refund.id,
        refundAmount: refund.amount || booking.unitAmount,
      });

      recordEvent({
        type: "admin_booking_refund_requested",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:booking-refund:${booking.id}:${refund.id}`,
      });

      return res.json({
        ok: true,
        booking: serializeCustomerBooking(updated),
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/bookings/schedule", rateLimit({ key: "admin-booking-schedule", windowMs: 1000 * 60 * 5, limit: 60 }), (req, res, next) => {
    try {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const settings = updateBookingScheduleSettings({
        standardOpen: typeof req.body?.standardOpen === "boolean" ? req.body.standardOpen : undefined,
        expressOpen: typeof req.body?.expressOpen === "boolean" ? req.body.expressOpen : undefined,
      });

      recordEvent({
        type: "admin_booking_schedule_updated",
        userId: auth.user.id,
        email: auth.user.email,
        locale: "admin",
        ip: getRequestIp(req),
        userAgent: `admin:booking-schedule:${settings.standardOpen}:${settings.expressOpen}`,
      });

      return res.json({ ok: true, schedule: settings });
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

  const indexPath = path.join(staticPath, "index.html");
  const indexTemplate = fs.readFileSync(indexPath, "utf8");

  app.get("/robots.txt", (req, res) => {
    const body = buildRobotsTxt(canonicalOrigin(req));
    res.setHeader("Content-Type", "text/plain; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(body);
  });

  app.get("/BingSiteAuth.xml", (_req, res) => {
    const customXml = String(process.env.BING_SITE_AUTH_XML || "").trim();
    const token = String(process.env.BING_SITE_AUTH_TOKEN || process.env.BING_SITE_VERIFICATION || "").trim();

    if (customXml) {
      const body = customXml.startsWith("<?xml") ? customXml : `<?xml version="1.0"?>\n${customXml}`;
      res.setHeader("Content-Type", "application/xml; charset=UTF-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).send(body);
    }

    if (token) {
      const body = `<?xml version="1.0"?>\n<users>\n  <user>${escapeHtml(token)}</user>\n</users>\n`;
      res.setHeader("Content-Type", "application/xml; charset=UTF-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).send(body);
    }

    return res.status(404).send("Bing verification is not configured.");
  });

  app.get("/sitemap.xml", (req, res) => {
    const body = buildSitemapXml(canonicalOrigin(req));
    res.setHeader("Content-Type", "application/xml; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(body);
  });

  app.use(
    express.static(staticPath, {
      index: false,
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

  app.use("/uploads", express.static(path.join(getAppDataDir(), "uploads"), { maxAge: "30d", etag: true, lastModified: true }));

  app.get("*", (req, res) => {
    try {
      const html = renderSeoHtml(indexTemplate, req.path, canonicalOrigin(req));
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(200).send(html);
    } catch {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.sendFile(indexPath);
    }
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
