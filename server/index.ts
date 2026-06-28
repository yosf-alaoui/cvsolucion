import "dotenv/config";
import crypto from "crypto";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type Stripe from "stripe";
import { getCountry as getTimezoneCountry } from "countries-and-timezones";
import { COOKIE_NAME, ONE_YEAR_MS, VISITOR_COOKIE_NAME } from "../shared/const";
import {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
} from "../shared/passwordPolicy";
import { TRAINING_BLUEPRINT } from "../shared/trainingBlueprint";
import {
  consumeToken,
  createSession,
  createToken,
  createUser,
  deleteUserById,
  deleteSession,
  deleteUserSessions,
  getUserRole,
  getAdminSnapshot,
  getSession,
  getUserByEmail,
  getUserById,
  isAdminEmailAddress,
  markUserEmailVerified,
  recordEvent,
  serializePublicUser,
  type AuthUserRole,
  updateAdminUser,
  updateUserPassword,
  verifyPassword,
} from "./authStore";
import { RecipientEmailRejectedError, sendAuthEmail } from "./authMailer";
import {
  normalizeAuthLocale,
  renderAuthEmailTemplate,
} from "./authEmailTemplates";
import {
  createVisitorId,
  getVisitorsSnapshot,
  trackVisitor,
  trackVisitorInteraction,
} from "./visitorStore";
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
  assignBookingDesigner,
  blockBookingSlotByAdmin,
  cancelBookingByAdmin,
  createBooking,
  getAdminBookingSlotsForDate,
  getBookingById,
  getBookingAvailability,
  listBookingsForDesigner,
  listBookings,
  listBookingsByPaymentReference,
  listBookingsForUser,
  markBookingRefundPendingByAdmin,
  rescheduleBooking,
  serializeCustomerBooking,
  unblockBookingSlotByAdmin,
  unassignDesignerFromBookings,
  type BookingPriority,
} from "./bookingStore";
import {
  getBookingScheduleSettings,
  isBookingScheduleOpen,
  updateBookingScheduleSettings,
} from "./bookingSettingsStore";
import {
  listContactLeads,
  storeContactLead,
  type ContactLead,
} from "./contactStore";
import {
  createPendingContactLead,
  getPendingContactLeadByToken,
  markPendingContactLeadConfirmed,
  type PendingContactLead,
} from "./contactVerificationStore";
import {
  buildRobotsTxt,
  buildSitemapXml,
  isKnownPublicSeoPath,
  renderSeoHtml,
} from "./seo";
import {
  getCustomerProfile,
  updateCustomerProfile,
  upsertCustomerProfile,
} from "./customerProfileStore";
import { buildInvoiceFilename, renderInvoicePdf } from "./invoicePdf";
import {
  getInvoiceById,
  issueInvoicesForBookings,
  listInvoicesForUser,
  type InvoiceRecord,
} from "./invoiceStore";
import {
  constructStripeEvent,
  createBookingPaymentIntent,
  createBookingRefund,
  createTrainingPaymentIntent,
  getBookingPrice,
  getStripePricingSnapshot,
  getTrainingPricingSnapshot,
  type TrainingPriceKey,
  verifyBookingPayment,
  verifyTrainingPayment,
} from "./stripeBooking";
import {
  hasProcessedStripeEvent,
  markStripeEventProcessed,
} from "./stripeEventStore";
import {
  createCatalogPackage,
  createCatalogTrainingProgram,
  deleteCatalogCountryPriceOverride,
  deleteCatalogPackage,
  deleteCatalogTrainingProgram,
  getCatalogSnapshot,
  getCatalogTrainingProgram,
  getPublicCatalog,
  getPublicTrainingPrograms,
  updateCatalogBookingPrices,
  upsertCatalogCountryPriceOverride,
  updateCatalogPackage,
  updateCatalogTrainingPrices,
  updateCatalogTrainingProgram,
} from "./catalogStore";
import { getAppDataDir } from "./dataDir";
import {
  createDesignerTask,
  deleteDesignerProfile,
  deleteDesignerTask,
  getDesignerProfile,
  listDesignerProfiles,
  listDesignerTasks,
  upsertDesignerProfile,
  updateDesignerTask,
  type DesignerTaskPriority,
  type DesignerTaskStatus,
} from "./designerStore";
import {
  buildTrainingEnrollmentView,
  createTrainingEnrollment,
  deactivateTrainerProfile,
  ensureTrainingEnrollmentFromPurchase,
  getTrainingEnrollment,
  getTrainerProfile,
  listTrainerProfiles,
  listTrainingEnrollments,
  listTrainingEnrollmentsForTrainer,
  listTrainingEnrollmentsForUser,
  unassignTrainerFromEnrollments,
  updateTrainingEnrollment,
  updateTrainingSessionProgress,
  upsertTrainerProfile,
  type TrainingEnrollmentStatus,
  type TrainingSessionProgressStatus,
} from "./trainingStore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAGIC_LINK_MS = 1000 * 60 * 20;
const VERIFY_LINK_MS = 1000 * 60 * 60 * 24;
const CONTACT_CONFIRM_LINK_MS = 1000 * 60 * 60 * 24 * 3;
const RESET_LINK_MS = 1000 * 60 * 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX_BUCKETS = 10000;
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
      return [
        entry.slice(0, separatorIndex),
        decodeURIComponent(entry.slice(separatorIndex + 1)),
      ];
    }),
  ) as Record<string, string>;
}

function appOrigin(req: express.Request) {
  return (
    process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`
  ).replace(/\/+$/, "");
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
  const forwardedProto = String(
    req.get("x-forwarded-proto") || req.protocol || "https",
  )
    .split(",")[0]
    .trim();

  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    return `${forwardedProto}://${host}`;
  }

  return "https://cvsolucion.com";
}

function getCookieDomain(req: express.Request) {
  const configured = String(process.env.SESSION_COOKIE_DOMAIN || "")
    .trim()
    .replace(/^\./, "")
    .toLowerCase();
  if (configured) return configured;

  const host = String(req.get("host") || "")
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();

  if (!host || /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(host)) {
    return undefined;
  }

  if (host === "cvsolucion.com" || host.endsWith(".cvsolucion.com")) {
    return "cvsolucion.com";
  }

  return undefined;
}

function localePrefix(locale?: string | null) {
  const resolvedLocale = normalizeAuthLocale(locale);
  if (resolvedLocale === "fr" || resolvedLocale === "ar")
    return `/${resolvedLocale}`;
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
    .filter(
      (slot) =>
        /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && Number.isInteger(slot.hour),
    );

  const unique = new Map<string, { date: string; hour: number }>();
  for (const slot of normalized) {
    unique.set(`${slot.date}:${slot.hour}`, slot);
  }
  return Array.from(unique.values());
}

function parseTrainingLevel(value: unknown): TrainingPriceKey | null {
  const level = String(value || "").trim();
  return level ? level : null;
}

function parseTrainingEnrollmentStatus(
  value: unknown,
): TrainingEnrollmentStatus | undefined {
  return value === "pending" ||
    value === "active" ||
    value === "completed" ||
    value === "paused" ||
    value === "cancelled"
    ? value
    : undefined;
}

function parseTrainingSessionStatus(
  value: unknown,
): TrainingSessionProgressStatus | undefined {
  return value === "pending" ||
    value === "completed" ||
    value === "repeat_required"
    ? value
    : undefined;
}

function normalizeCountryCode(value: unknown) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function getRequestCountryCode(req: express.Request) {
  const headerCandidates = [
    req.get("cf-ipcountry"),
    req.get("x-vercel-ip-country"),
    req.get("cloudfront-viewer-country"),
    req.get("x-country-code"),
    req.get("x-appengine-country"),
  ];

  for (const candidate of headerCandidates) {
    const countryCode = normalizeCountryCode(candidate);
    if (countryCode && countryCode !== "XX") return countryCode;
  }

  return null;
}

function getProfileCountryCode(userId: string) {
  const profile = getCustomerProfile(userId);
  return (
    normalizeCountryCode(profile?.countryCode) ||
    normalizeCountryCode(profile?.country) ||
    null
  );
}

function getPricingCountryCode(req: express.Request) {
  const explicit = normalizeCountryCode(
    req.query?.countryCode ?? req.body?.countryCode,
  );
  if (explicit) return explicit;

  const auth = getCurrentUser(req);
  if (auth) {
    const profileCountryCode = getProfileCountryCode(auth.user.id);
    if (profileCountryCode) return profileCountryCode;
  }

  return getRequestCountryCode(req);
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

function fallbackDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || email;
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function serializeDesignerTaskForApi(
  task: ReturnType<typeof listDesignerTasks>[number],
  bookingMap: Map<string, ReturnType<typeof serializeCustomerBooking>>,
) {
  return {
    ...task,
    booking: task.bookingId ? (bookingMap.get(task.bookingId) ?? null) : null,
  };
}

function localizeTrainingProgram(
  programKey: string,
  locale: "en" | "fr" | "ar",
) {
  const program = getCatalogTrainingProgram(programKey);
  const translated = program?.translations?.[locale]?.title
    ? program.translations[locale]
    : program?.translations?.en || null;

  return {
    id: program?.id || null,
    key: programKey,
    title: translated?.title || programKey,
    badge: translated?.badge || programKey,
    hours: translated?.hours || null,
    duration: translated?.duration || null,
  };
}

function serializeTrainingEnrollmentForApi(
  enrollmentId: string,
  locale: "en" | "fr" | "ar",
  usersById?: Map<string, ReturnType<typeof serializePublicUser>>,
  trainerNamesById?: Map<string, string>,
) {
  const view = buildTrainingEnrollmentView(enrollmentId);
  if (!view) return null;

  const trainer =
    view.trainerUserId && usersById ? usersById.get(view.trainerUserId) : null;
  const trainerProfile = view.trainerUserId
    ? getTrainerProfile(view.trainerUserId)
    : null;

  return {
    ...view,
    program: localizeTrainingProgram(view.programKey, locale),
    trainer:
      view.trainerUserId && trainer
        ? {
            userId: view.trainerUserId,
            email: trainer.email,
            displayName:
              trainerNamesById?.get(view.trainerUserId) ||
              trainerProfile?.displayName ||
              fallbackDisplayNameFromEmail(trainer.email),
            title: trainerProfile?.title || null,
            active: trainerProfile?.active ?? true,
          }
        : null,
    customer: {
      userId: view.userId,
      email: view.userEmail,
      name: view.customerName,
      company: view.company,
      country: view.country,
      countryCode: view.countryCode,
    },
    sessions: view.sessions.map((session) => ({
      id: session.id,
      sessionCode: session.sessionCode,
      levelKey: session.levelKey,
      order: session.order,
      status: session.status,
      score: session.score,
      passed: session.passed,
      trainerNotes: session.trainerNotes,
      traineeNotes: session.traineeNotes,
      evidence: session.evidence,
      confirmedByUserId: session.confirmedByUserId,
      confirmedAt: session.confirmedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      template: session.template,
    })),
  };
}

function normalizeStripeRefundStatus(status: string | null | undefined) {
  if (status === "failed") return "failed" as const;
  if (status === "canceled") return "canceled" as const;
  if (status === "succeeded") return "succeeded" as const;
  return "pending" as const;
}

function formatMoney(
  amount: number,
  currency: string | null | undefined,
  locale: "en" | "fr" | "ar",
) {
  const normalizedLocale =
    locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA";
  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amount / 100);
}

function formatBookingSlotForEmail(
  date: string,
  hour: number,
  locale: "en" | "fr" | "ar",
) {
  const normalizedLocale =
    locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA";
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

function setSessionCookie(
  req: express.Request,
  res: express.Response,
  sessionId: string,
) {
  const domain = getCookieDomain(req);
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_MS,
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

function clearSessionCookie(req: express.Request, res: express.Response) {
  const domain = getCookieDomain(req);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

function setVisitorCookie(
  req: express.Request,
  res: express.Response,
  visitorId: string,
) {
  const domain = getCookieDomain(req);
  res.cookie(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_MS,
    path: "/",
    ...(domain ? { domain } : {}),
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

function createCsrfToken(auth: NonNullable<ReturnType<typeof getCurrentUser>>) {
  return crypto
    .createHash("sha256")
    .update(
      `${auth.session.id}:${auth.user.passwordHash}:${auth.user.updatedAt}`,
    )
    .digest("hex");
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function requiresCsrf(req: express.Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS")
    return false;

  const protectedPrefixes = [
    "/api/admin",
    "/api/customer",
    "/api/designer",
    "/api/trainer",
  ];
  const protectedExactPaths = [
    "/api/auth/logout",
    "/api/bookings",
    "/api/stripe/booking-payment-intent",
    "/api/stripe/training-payment-intent",
    "/api/training/purchases",
  ];

  return (
    protectedExactPaths.includes(req.path) ||
    protectedPrefixes.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    ) ||
    /^\/api\/bookings\/[^/]+\/reschedule$/.test(req.path)
  );
}

function getRequestIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || null;
}

function isRoleAllowed(role: AuthUserRole, allowed: AuthUserRole[]) {
  return allowed.includes(role);
}

function requireAuthenticatedUser(req: express.Request, res: express.Response) {
  const auth = getCurrentUser(req);
  if (!auth) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return auth;
}

function pruneRateLimitStore(now = Date.now()) {
  if (rateLimitStore.size < RATE_LIMIT_MAX_BUCKETS) return;
  rateLimitStore.forEach((value, key) => {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

function hashRateLimitScope(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function requestBodyFieldScope(field: string) {
  return (req: express.Request) => {
    const value = String(req.body?.[field] || "")
      .trim()
      .toLowerCase();
    return value ? hashRateLimitScope(value) : null;
  };
}

function rateLimit(options: {
  key: string;
  windowMs: number;
  limit: number;
  scope?: (req: express.Request) => string | null;
}) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const ip = getRequestIp(req) || "unknown";
    const scope = options.scope?.(req);
    const bucketKey = `${options.key}:${scope || ip}`;
    const now = Date.now();
    pruneRateLimitStore(now);
    const current = rateLimitStore.get(bucketKey);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (current.count >= options.limit) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((current.resetAt - now) / 1000)),
      );
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again shortly." });
    }

    current.count += 1;
    return next();
  };
}

function requireAdmin(req: express.Request, res: express.Response) {
  const auth = requireAuthenticatedUser(req, res);
  if (!auth) {
    return null;
  }

  if (getUserRole(auth.user) !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  return auth;
}

function requireUserRole(
  req: express.Request,
  res: express.Response,
  allowed: AuthUserRole[],
) {
  const auth = requireAuthenticatedUser(req, res);
  if (!auth) return null;

  const role = getUserRole(auth.user);
  if (!isRoleAllowed(role, allowed)) {
    res.status(403).json({ error: "Access denied for this account." });
    return null;
  }

  return { ...auth, role };
}

function getOrCreateRequestVisitor(
  req: express.Request,
  res: express.Response,
) {
  const cookies = parseCookies(req.headers.cookie);
  const existingVisitorId = cookies[VISITOR_COOKIE_NAME];
  const visitorId = existingVisitorId || createVisitorId();
  if (!existingVisitorId) {
    setVisitorCookie(req, res, visitorId);
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

function isMissingStaticAssetRequest(pathname: string) {
  return /\.[a-z0-9]{2,8}$/i.test(pathname);
}

function isAdminShellRequest(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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

function authEmailDeliveryMessage(
  locale: string,
  kind: "recipient_rejected" | "delivery_failed",
) {
  if (locale === "ar") {
    return kind === "recipient_rejected"
      ? "هذا البريد الإلكتروني لا يمكنه استقبال الرسائل. تحقق من كتابته أو استخدم بريدًا آخر."
      : "تعذر إرسال الرسالة الآن. حاول مرة أخرى بعد قليل.";
  }

  if (locale === "fr") {
    return kind === "recipient_rejected"
      ? "Cette adresse email ne peut pas recevoir de messages. Verifiez l'adresse ou utilisez une autre boite."
      : "Impossible d'envoyer l'email pour le moment. Reessayez dans un instant.";
  }

  return kind === "recipient_rejected"
    ? "This email address cannot receive messages. Check the spelling or use a different inbox."
    : "We couldn't send the email right now. Please try again in a moment.";
}

type ContactSourceType = "contact" | "career_evaluation";

function renderContactConfirmationEmail(args: {
  name: string;
  locale: "en" | "fr" | "ar";
  url: string;
  sourceType: ContactSourceType;
}) {
  const copy = {
    en: {
      subject:
        args.sourceType === "career_evaluation"
          ? "Confirm your free career evaluation request"
          : "Confirm your CVsolucion contact request",
      title: "Confirm your email to complete your request",
      body:
        "We received your request. Please confirm your email address so our team can review it and contact you.",
      cta: "Confirm my email",
      fallback: "If the button does not work, open this link:",
      expiry: "This confirmation link expires in 3 days.",
    },
    fr: {
      subject:
        args.sourceType === "career_evaluation"
          ? "Confirmez votre demande d'evaluation gratuite"
          : "Confirmez votre demande CVsolucion",
      title: "Confirmez votre email pour finaliser la demande",
      body:
        "Nous avons recu votre demande. Confirmez votre adresse email pour que notre equipe puisse l'examiner et vous contacter.",
      cta: "Confirmer mon email",
      fallback: "Si le bouton ne fonctionne pas, ouvrez ce lien :",
      expiry: "Ce lien de confirmation expire dans 3 jours.",
    },
    ar: {
      subject: "تأكيد بريدك لإكمال الطلب",
      title: "أكد بريدك الإلكتروني لإكمال الطلب",
      body:
        "توصلنا بطلبك. يرجى تأكيد البريد الإلكتروني حتى يتمكن فريقنا من مراجعته والتواصل معك.",
      cta: "تأكيد البريد الإلكتروني",
      fallback: "إذا لم يعمل الزر، افتح هذا الرابط:",
      expiry: "رابط التأكيد صالح لمدة 3 أيام.",
    },
  }[args.locale];

  const dir = args.locale === "ar" ? "rtl" : "ltr";
  const align = args.locale === "ar" ? "right" : "left";
  const greeting =
    args.locale === "fr"
      ? `Bonjour ${args.name},`
      : args.locale === "ar"
        ? `مرحبا ${args.name}،`
        : `Hello ${args.name},`;
  const text = [
    greeting,
    "",
    copy.body,
    "",
    args.url,
    "",
    copy.expiry,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a;direction:${dir};text-align:${align}">
      <h2 style="margin:0 0 16px">${escapeHtml(copy.title)}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(copy.body)}</p>
      <p>
        <a href="${escapeHtml(args.url)}" style="display:inline-block;padding:12px 18px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:10px">
          ${escapeHtml(copy.cta)}
        </a>
      </p>
      <p style="margin:18px 0 6px;color:#475569">${escapeHtml(copy.fallback)}</p>
      <p style="word-break:break-all;color:#475569">${escapeHtml(args.url)}</p>
      <p style="color:#64748b">${escapeHtml(copy.expiry)}</p>
    </div>
  `;

  return { subject: copy.subject, text, html };
}

async function sendContactLeadNotification(args: {
  lead: ContactLead;
  sourceType: ContactSourceType;
  locale: "en" | "fr" | "ar";
  source: string;
  tracking: Record<string, string>;
}) {
  const destination = (process.env.CONTACT_EMAIL || "contact@cvsolucion.com")
    .trim();
  const trackingLines = Object.entries(args.tracking).map(
    ([key, value]) => `${key}: ${value}`,
  );

  const lines = [
    `Lead ID: ${args.lead.id}`,
    `Name: ${args.lead.name}`,
    `Email: ${args.lead.email}`,
    args.lead.company ? `Company: ${args.lead.company}` : null,
    args.lead.phone ? `Phone: ${args.lead.phone}` : null,
    args.lead.interest ? `Interest: ${args.lead.interest}` : null,
    `Locale: ${args.locale}`,
    `Source: ${args.source}`,
    ...(trackingLines.length ? ["", "Tracking:", ...trackingLines] : []),
    "",
    args.lead.message,
  ].filter(Boolean);

  await sendAuthEmail({
    to: destination,
    subject:
      args.sourceType === "career_evaluation"
        ? `New Career Evaluation Request - ${args.lead.name}`
        : `New CVsolucion contact request - ${args.lead.name}`,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 16px">${
          args.sourceType === "career_evaluation"
            ? "New Free Career Evaluation Request"
            : "New CVsolucion contact request"
        }</h2>
        <p><strong>Lead ID:</strong> ${escapeHtml(args.lead.id)}</p>
        <p><strong>Name:</strong> ${escapeHtml(args.lead.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(args.lead.email)}</p>
        ${args.lead.company ? `<p><strong>Company:</strong> ${escapeHtml(args.lead.company)}</p>` : ""}
        ${args.lead.phone ? `<p><strong>Phone:</strong> ${escapeHtml(args.lead.phone)}</p>` : ""}
        ${args.lead.interest ? `<p><strong>Interest:</strong> ${escapeHtml(args.lead.interest)}</p>` : ""}
        <p><strong>Locale:</strong> ${escapeHtml(args.locale)}</p>
        <p><strong>Source:</strong> ${escapeHtml(args.source)}</p>
        ${
          trackingLines.length
            ? `<h3 style="margin:24px 0 8px">Tracking</h3>${Object.entries(
                args.tracking,
              )
                .map(
                  ([key, value]) =>
                    `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`,
                )
                .join("")}`
            : ""
        }
        <hr style="margin:24px 0;border:none;border-top:1px solid #cbd5e1" />
        <p style="white-space:pre-wrap">${escapeHtml(args.lead.message)}</p>
      </div>
    `,
  });
}

function storeConfirmedContactLead(pendingLead: PendingContactLead) {
  return storeContactLead({
    name: pendingLead.name,
    email: pendingLead.email,
    company: pendingLead.company,
    phone: pendingLead.phone,
    interest: pendingLead.interest,
    message: pendingLead.message,
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.set("trust proxy", true);
  app.disable("x-powered-by");

  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
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
          console.log(
            "[stripe:webhook] payment_intent.succeeded",
            event.data.object?.id || null,
          );
        }

        if (
          event.type === "refund.created" ||
          event.type === "refund.updated"
        ) {
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
                (refundStatus === "succeeded" ||
                  refundStatus === "failed" ||
                  refundStatus === "canceled")
              ) {
                const locale = syncResult.customer.locale;
                const amountLabel = formatMoney(
                  syncResult.refundAmount,
                  syncResult.currency,
                  locale,
                );
                const slots = (
                  syncResult.affectedBookings.length
                    ? syncResult.affectedBookings
                    : syncResult.groupBookings
                ).map((booking) =>
                  formatBookingSlotForEmail(booking.date, booking.hour, locale),
                );
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
                    error:
                      mailError instanceof Error
                        ? mailError.stack || mailError.message
                        : String(mailError),
                  });
                }
              }
            }
          }
        }

        markStripeEventProcessed(event.id, event.type);
        return res.json({ received: true });
      } catch (error: any) {
        return res
          .status(400)
          .send(error?.message || "Webhook verification failed.");
      }
    },
  );

  app.use(express.json({ limit: "15mb" }));

  app.use((_req, res, next) => {
    const host = String(_req.get("host") || "").trim();
    const forwardedProto = String(
      _req.get("x-forwarded-proto") || _req.protocol || "https",
    )
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
      `script-src 'unsafe-inline' ${scriptAssetsSource} https://js.stripe.com https://analytics.ahrefs.com`,
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; ");

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(self)",
    );
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

    const forwardedProto = String(
      req.get("x-forwarded-proto") || req.protocol || "https",
    )
      .split(",")[0]
      .trim();

    let requestUrl: URL;
    let canonicalUrl: URL;
    try {
      requestUrl = new URL(
        `${forwardedProto}://${hostHeader}${req.originalUrl}`,
      );
      canonicalUrl = new URL(canonicalOrigin(req));
    } catch {
      return next();
    }

    const requestHost = requestUrl.hostname.toLowerCase();
    const targetHost = canonicalUrl.hostname
      .replace(/^www\./i, "")
      .toLowerCase();
    const targetProtocol = canonicalUrl.protocol;
    const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(requestHost);

    if (isLocalHost) return next();

    if (requestHost === `www.${targetHost}`) {
      requestUrl.hostname = targetHost;
      requestUrl.protocol = targetProtocol;
      return res.redirect(301, requestUrl.toString());
    }

    if (
      requestHost === targetHost &&
      targetProtocol === "https:" &&
      requestUrl.protocol !== "https:"
    ) {
      requestUrl.protocol = "https:";
      return res.redirect(301, requestUrl.toString());
    }

    return next();
  });

  app.use((req, res, next) => {
    if (!requiresCsrf(req)) return next();

    const auth = getCurrentUser(req);
    if (!auth) return next();

    const expectedToken = createCsrfToken(auth);
    const providedToken = String(req.get("x-csrf-token") || "").trim();

    if (
      !providedToken ||
      !timingSafeStringEqual(providedToken, expectedToken)
    ) {
      return res.status(403).json({
        error: "Security token expired. Refresh the page and try again.",
      });
    }

    return next();
  });

  app.get("/api/auth/me", (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      clearSessionCookie(req, res);
      return res.json({ user: null });
    }
    const role = getUserRole(auth.user);
    return res.json({
      user: serializePublicUser(auth.user),
      role,
      isAdmin: role === "admin",
      isDesigner: role === "designer",
      isTrainer: role === "trainer",
      csrfToken: createCsrfToken(auth),
    });
  });

  app.get(
    "/api/geo/country",
    rateLimit({ key: "geo-country", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = getCurrentUser(req);
      const profileCountryCode = auth
        ? getProfileCountryCode(auth.user.id)
        : null;
      const requestCountryCode = getRequestCountryCode(req);
      return res.json({
        countryCode: profileCountryCode || requestCountryCode || null,
        source: profileCountryCode
          ? "profile"
          : requestCountryCode
            ? "request"
            : "unknown",
      });
    },
  );

  app.get(
    "/api/customer/dashboard",
    rateLimit({ key: "customer-dashboard", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
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
      const invoices = listInvoicesForUser(auth.user.id, auth.user.email).map(
        serializeCustomerInvoice,
      );

      return res.json({
        user: serializePublicUser(auth.user),
        profile,
        bookings,
        invoices,
      });
    },
  );

  app.get(
    "/api/customer/training",
    rateLimit({ key: "customer-training", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const locale = normalizeAuthLocale(String(req.query.locale || "en"));
      const enrollments = listTrainingEnrollmentsForUser(auth.user.id)
        .map((enrollment) =>
          serializeTrainingEnrollmentForApi(enrollment.id, locale),
        )
        .filter(Boolean);

      return res.json({
        blueprint: {
          key: TRAINING_BLUEPRINT.key,
          title: TRAINING_BLUEPRINT.title,
          totalHours: TRAINING_BLUEPRINT.totalHours,
          totalSessions: TRAINING_BLUEPRINT.totalSessions,
          passThreshold: TRAINING_BLUEPRINT.passThreshold,
          levels: TRAINING_BLUEPRINT.levels,
          rubric: TRAINING_BLUEPRINT.rubric,
        },
        enrollments,
      });
    },
  );

  app.get(
    "/api/customer/invoices/:invoiceId/download",
    rateLimit({
      key: "customer-invoice-download",
      windowMs: 1000 * 60,
      limit: 120,
    }),
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

        if (
          invoice.userId !== auth.user.id &&
          invoice.email !== auth.user.email
        ) {
          return res
            .status(403)
            .json({ error: "You do not have access to this invoice." });
        }

        const pdf = await renderInvoicePdf(invoice);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${buildInvoiceFilename(invoice)}"`,
        );
        return res.send(pdf);
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/customer/profile",
    rateLimit({ key: "customer-profile", windowMs: 1000 * 60 * 10, limit: 40 }),
    (req, res) => {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const name = String(req.body?.name || "").trim();
      const countryCode = normalizeCountryCode(req.body?.countryCode);
      const countryRecord = countryCode
        ? getTimezoneCountry(countryCode)
        : null;
      const country =
        countryRecord?.name || String(req.body?.country || "").trim();
      const phone = String(req.body?.phone || "").trim();
      const company = String(req.body?.company || "").trim();

      if (name.length < 2) {
        return res.status(400).json({ error: "Name is required." });
      }
      if (!countryCode || !countryRecord) {
        return res
          .status(400)
          .json({ error: "Select a valid country from the list." });
      }
      if (phone.length < 6) {
        return res
          .status(400)
          .json({ error: "A valid phone number is required." });
      }

      const profile = updateCustomerProfile({
        userId: auth.user.id,
        email: auth.user.email,
        name,
        country,
        countryCode,
        phone,
        company,
      });

      return res.json({ ok: true, profile });
    },
  );

  app.get(
    "/api/designer/dashboard",
    rateLimit({ key: "designer-dashboard", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireUserRole(req, res, ["designer"]);
      if (!auth) return;

      const profile =
        getDesignerProfile(auth.user.id) ??
        upsertDesignerProfile({
          userId: auth.user.id,
          email: auth.user.email,
          displayName: fallbackDisplayNameFromEmail(auth.user.email),
        });

      const assignedBookings = listBookingsForDesigner(auth.user.id).map(
        serializeCustomerBooking,
      );
      const bookingMap = new Map(
        assignedBookings.map((booking) => [booking.id, booking]),
      );
      const tasks = listDesignerTasks(auth.user.id).map((task) =>
        serializeDesignerTaskForApi(task, bookingMap),
      );

      return res.json({
        user: serializePublicUser(auth.user),
        profile,
        bookings: assignedBookings,
        tasks,
      });
    },
  );

  app.get(
    "/api/trainer/dashboard",
    rateLimit({ key: "trainer-dashboard", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireUserRole(req, res, ["trainer"]);
      if (!auth) return;

      const locale = normalizeAuthLocale(String(req.query.locale || "en"));
      const profile =
        getTrainerProfile(auth.user.id) ??
        upsertTrainerProfile({
          userId: auth.user.id,
          email: auth.user.email,
          displayName: fallbackDisplayNameFromEmail(auth.user.email),
        });

      const adminSnapshot = getAdminSnapshot();
      const usersById = new Map(
        adminSnapshot.users.map((user) => [
          user.id,
          {
            id: user.id,
            email: user.email,
            role: user.role,
            emailVerifiedAt: user.emailVerifiedAt,
          },
        ]),
      );
      const trainerNamesById = new Map(
        listTrainerProfiles().map((trainer) => [
          trainer.userId,
          trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
        ]),
      );

      const enrollments = listTrainingEnrollmentsForTrainer(auth.user.id)
        .map((enrollment) =>
          serializeTrainingEnrollmentForApi(
            enrollment.id,
            locale,
            usersById,
            trainerNamesById,
          ),
        )
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      return res.json({
        user: serializePublicUser(auth.user),
        profile,
        enrollments,
        stats: {
          activeEnrollments: enrollments.filter(
            (item) => item.status === "active",
          ).length,
          completedEnrollments: enrollments.filter(
            (item) => item.status === "completed",
          ).length,
          pendingReviewSessions: enrollments.reduce(
            (total, enrollment) =>
              total +
              enrollment.sessions.filter(
                (session) => session.status !== "completed",
              ).length,
            0,
          ),
        },
      });
    },
  );

  app.patch(
    "/api/trainer/enrollments/:enrollmentId/sessions/:sessionCode",
    rateLimit({
      key: "trainer-session-update",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireUserRole(req, res, ["trainer"]);
        if (!auth) return;

        const enrollmentId = String(req.params.enrollmentId || "").trim();
        const sessionCode = String(req.params.sessionCode || "").trim();
        const enrollment = getTrainingEnrollment(enrollmentId);
        if (!enrollment || enrollment.trainerUserId !== auth.user.id) {
          return res
            .status(404)
            .json({ error: "Training enrollment not found." });
        }

        const status = parseTrainingSessionStatus(req.body?.status);
        if (!status) {
          return res
            .status(400)
            .json({ error: "Select a valid session status." });
        }

        updateTrainingSessionProgress({
          enrollmentId,
          sessionCode,
          updatedByUserId: auth.user.id,
          status,
          score:
            typeof req.body?.score === "number" ||
            typeof req.body?.score === "string"
              ? Number(req.body.score)
              : null,
          trainerNotes:
            typeof req.body?.trainerNotes === "string"
              ? req.body.trainerNotes
              : null,
          traineeNotes:
            typeof req.body?.traineeNotes === "string"
              ? req.body.traineeNotes
              : null,
          evidence:
            typeof req.body?.evidence === "string" ? req.body.evidence : null,
        });

        recordEvent({
          type: "trainer_training_session_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "trainer",
          ip: getRequestIp(req),
          userAgent: `trainer:session:${enrollmentId}:${sessionCode}:${status}`,
        });

        const adminSnapshot = getAdminSnapshot();
        const usersById = new Map(
          adminSnapshot.users.map((user) => [
            user.id,
            {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt,
            },
          ]),
        );
        const trainerNamesById = new Map(
          listTrainerProfiles().map((trainer) => [
            trainer.userId,
            trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
          ]),
        );
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const serialized = serializeTrainingEnrollmentForApi(
          enrollmentId,
          locale,
          usersById,
          trainerNamesById,
        );

        return res.json({ ok: true, enrollment: serialized });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/designer/tasks/:taskId",
    rateLimit({
      key: "designer-task-update",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
      try {
        const auth = requireUserRole(req, res, ["designer"]);
        if (!auth) return;

        const taskId = String(req.params.taskId || "").trim();
        const task = listDesignerTasks(auth.user.id).find(
          (item) => item.id === taskId,
        );
        if (!task) {
          return res.status(404).json({ error: "Task not found." });
        }

        const status = req.body?.status;
        if (
          status !== "todo" &&
          status !== "in_progress" &&
          status !== "done"
        ) {
          return res
            .status(400)
            .json({ error: "Valid task status is required." });
        }

        const updatedTask = updateDesignerTask({ taskId, status });
        const bookingMap = new Map(
          listBookingsForDesigner(auth.user.id).map((booking) => [
            booking.id,
            serializeCustomerBooking(booking),
          ]),
        );
        return res.json({
          ok: true,
          task: serializeDesignerTaskForApi(updatedTask, bookingMap),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/visitor/track",
    rateLimit({ key: "visitor-track", windowMs: 1000 * 60, limit: 240 }),
    (req, res) => {
      const cookies = parseCookies(req.headers.cookie);
      const existingVisitorId = cookies[VISITOR_COOKIE_NAME];
      const visitorId = existingVisitorId || createVisitorId();
      const auth = getCurrentUser(req);
      const payload = req.body || {};

      const visitor = trackVisitor({
        visitorId,
        path: String(payload.path || "/"),
        search: typeof payload.search === "string" ? payload.search : "",
        sessionId:
          typeof payload.sessionId === "string" ? payload.sessionId : null,
        locale: normalizeAuthLocale(String(payload.locale || "en")),
        title: typeof payload.title === "string" ? payload.title : null,
        referrer:
          typeof payload.referrer === "string" ? payload.referrer : null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
        browserLanguage:
          typeof payload.browserLanguage === "string"
            ? payload.browserLanguage
            : null,
        timezone:
          typeof payload.timezone === "string" ? payload.timezone : null,
        screen: typeof payload.screen === "string" ? payload.screen : null,
        userId: auth?.user?.id ?? null,
        email: auth?.user?.email ?? null,
        msclkid: typeof payload.msclkid === "string" ? payload.msclkid : null,
        ttclid: typeof payload.ttclid === "string" ? payload.ttclid : null,
        liFatId:
          typeof payload.li_fat_id === "string" ? payload.li_fat_id : null,
        wbraid: typeof payload.wbraid === "string" ? payload.wbraid : null,
        gbraid: typeof payload.gbraid === "string" ? payload.gbraid : null,
        navigationType:
          typeof payload.navigationType === "string"
            ? payload.navigationType
            : null,
        secFetchSite: req.get("sec-fetch-site") || null,
      });

      if (!existingVisitorId) {
        setVisitorCookie(req, res, visitorId);
      }

      return res.json({
        ok: true,
        visitor: {
          id: visitor.id,
          isRegistered: visitor.isRegistered,
        },
      });
    },
  );

  app.post(
    "/api/visitor/event",
    rateLimit({ key: "visitor-event", windowMs: 1000 * 60, limit: 300 }),
    (req, res) => {
      const cookies = parseCookies(req.headers.cookie);
      const visitorId = cookies[VISITOR_COOKIE_NAME];
      if (!visitorId) {
        return res.json({ ok: true });
      }

      const payload = req.body || {};
      const eventType = String(payload.type || "");
      if (
        ![
          "session_start",
          "session_end",
          "whatsapp_click",
          "email_click",
          "cta_click",
          "chat_open",
          "chat_message",
        ].includes(eventType)
      ) {
        return res.status(400).json({ error: "Unsupported visitor event." });
      }

      const visitor = trackVisitorInteraction({
        visitorId,
        type: eventType as any,
        path: String(payload.path || "/"),
        label: typeof payload.label === "string" ? payload.label : null,
        href: typeof payload.href === "string" ? payload.href : null,
        sessionId:
          typeof payload.sessionId === "string" ? payload.sessionId : null,
        durationMs:
          typeof payload.durationMs === "number" ? payload.durationMs : null,
        pageCount:
          typeof payload.pageCount === "number" ? payload.pageCount : null,
      });

      return res.json({ ok: true, tracked: Boolean(visitor) });
    },
  );

  app.post(
    "/api/chat/session",
    rateLimit({ key: "chat-session", windowMs: 1000 * 60 * 10, limit: 80 }),
    (req, res) => {
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const pathValue =
        typeof req.body?.path === "string" ? req.body.path : req.path;
      const auth = getCurrentUser(req);
      const visitorId = getOrCreateRequestVisitor(req, res);
      const visitor =
        getVisitorById(visitorId) ??
        trackVisitor({
          visitorId,
          path: pathValue,
          search: "",
          sessionId:
            typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
        sessionId:
          typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
    },
  );

  app.post(
    "/api/chat/new-session",
    rateLimit({ key: "chat-new-session", windowMs: 1000 * 60 * 10, limit: 40 }),
    (req, res) => {
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const pathValue =
        typeof req.body?.path === "string" ? req.body.path : req.path;
      const auth = getCurrentUser(req);
      const visitorId = getOrCreateRequestVisitor(req, res);
      const visitor =
        getVisitorById(visitorId) ??
        trackVisitor({
          visitorId,
          path: pathValue,
          search: "",
          sessionId:
            typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
        sessionId:
          typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
    },
  );

  app.post(
    "/api/chat/message",
    rateLimit({ key: "chat-message", windowMs: 1000 * 60 * 10, limit: 120 }),
    async (req, res) => {
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const pathValue =
        typeof req.body?.path === "string" ? req.body.path : "/";
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
          sessionId:
            typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
      if (
        auth?.user?.id &&
        conversation.userId &&
        conversation.userId !== auth.user.id
      ) {
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
        sessionId:
          typeof req.body?.sessionId === "string" ? req.body.sessionId : null,
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
    },
  );

  app.post(
    "/api/chat/support-intake",
    rateLimit({
      key: "chat-support-intake",
      windowMs: 1000 * 60 * 10,
      limit: 40,
    }),
    (req, res) => {
      const conversationId = String(req.body?.conversationId || "").trim();
      const name = String(req.body?.name || "").trim();
      const country = String(req.body?.country || "").trim();
      const phone = String(req.body?.phone || "").trim();
      const email = String(req.body?.email || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const pathValue =
        typeof req.body?.path === "string" ? req.body.path : "/";

      if (!conversationId) {
        return res.status(400).json({ error: "Conversation is required." });
      }
      if (!name || !country || !phone || !email) {
        return res
          .status(400)
          .json({ error: "Name, country, phone, and email are required." });
      }
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Valid email is required." });
      }
      if (phone.length < 6) {
        return res
          .status(400)
          .json({ error: "Valid phone number is required." });
      }

      const auth = getCurrentUser(req);
      const visitorId = getOrCreateRequestVisitor(req, res);
      const visitor = getVisitorById(visitorId);
      const conversation = getConversationById(conversationId);

      if (!conversation || conversation.visitorId !== visitorId) {
        return res.status(403).json({ error: "Conversation access denied." });
      }
      if (
        auth?.user?.id &&
        conversation.userId &&
        conversation.userId !== auth.user.id
      ) {
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
    },
  );

  app.post(
    "/api/contact",
    rateLimit({ key: "contact", windowMs: 1000 * 60 * 10, limit: 20 }),
    async (req, res, next) => {
      try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim();
        const company = String(req.body?.company || "").trim();
        const phone = String(req.body?.phone || "").trim();
        const interest = String(req.body?.interest || "").trim();
        const message = String(req.body?.message || "").trim();
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const sourceType: ContactSourceType =
          String(req.body?.source || "").trim() === "career_evaluation"
            ? "career_evaluation"
            : "contact";
        const rawTracking =
          req.body?.tracking && typeof req.body.tracking === "object"
            ? req.body.tracking
            : {};
        const trackingKeys = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
          "fbclid",
          "landing_page",
        ] as const;
        const tracking = trackingKeys.reduce<Record<string, string>>(
          (result, key) => {
            const value = String(rawTracking[key] || "").trim().slice(0, 1000);
            if (value) result[key] = value;
            return result;
          },
          {},
        );

        if (name.length < 2) {
          return res.status(400).json({ error: "Name is required." });
        }
        if (!EMAIL_REGEX.test(email)) {
          return res.status(400).json({ error: "A valid email is required." });
        }
        if (message.length < 10) {
          return res.status(400).json({
            error: "Please provide a little more context in your message.",
          });
        }

        const source = req.get("referer") || appOrigin(req);
        const auth = getCurrentUser(req);

        if (sourceType === "career_evaluation" && !auth) {
          const { rawToken } = createPendingContactLead(
            {
              name,
              email,
              company,
              phone,
              interest,
              message,
              locale,
              sourceType,
              source,
              tracking,
            },
            CONTACT_CONFIRM_LINK_MS,
          );
          const confirmUrl = `${appOrigin(req)}/api/contact/confirm?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;
          const confirmationEmail = renderContactConfirmationEmail({
            name,
            locale,
            url: confirmUrl,
            sourceType,
          });

          try {
            await sendAuthEmail({
              to: email,
              subject: confirmationEmail.subject,
              text: confirmationEmail.text,
              html: confirmationEmail.html,
            });
          } catch (error) {
            if (error instanceof RecipientEmailRejectedError) {
              return res.status(400).json({
                error: authEmailDeliveryMessage(locale, "recipient_rejected"),
              });
            }
            return res.status(502).json({
              error: authEmailDeliveryMessage(locale, "delivery_failed"),
            });
          }

          return res.status(202).json({
            ok: true,
            pendingEmailVerification: true,
            email: email.toLowerCase(),
          });
        }

        const lead = storeContactLead({
          name,
          email,
          company,
          phone,
          interest,
          message,
        });
        await sendContactLeadNotification({
          lead,
          sourceType,
          locale,
          source,
          tracking,
        });

        return res.status(201).json({ ok: true, leadId: lead.id });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.get(
    "/api/contact/confirm",
    rateLimit({ key: "contact-confirm", windowMs: 1000 * 60 * 10, limit: 30 }),
    async (req, res, next) => {
      try {
        const token = String(req.query.token || "");
        const locale = normalizeAuthLocale(String(req.query.locale || "en"));
        const pendingLead = getPendingContactLeadByToken(token);
        const fallbackUrl = `${appOrigin(req)}${localePrefix(locale)}/training/career?confirmation=expired`;

        if (!pendingLead) {
          return res.redirect(302, fallbackUrl);
        }

        const lead = storeConfirmedContactLead(pendingLead);
        markPendingContactLeadConfirmed(pendingLead.id);
        void sendContactLeadNotification({
          lead,
          sourceType: pendingLead.sourceType,
          locale: pendingLead.locale,
          source: pendingLead.source,
          tracking: pendingLead.tracking,
        }).catch((error) => {
          console.error("[contact-confirm:admin-email-error]", {
            leadId: lead.id,
            error: error instanceof Error ? error.stack || error.message : String(error),
          });
        });

        return res.redirect(
          302,
          `${appOrigin(req)}${localePrefix(pendingLead.locale)}/training/career/thank-you?confirmed=1&lead=${encodeURIComponent(lead.id)}`,
        );
      } catch (error) {
        return next(error);
      }
    },
  );

  app.get(
    "/api/catalog/public",
    rateLimit({ key: "catalog-public", windowMs: 1000 * 60, limit: 180 }),
    (req, res) => {
      const locale = normalizeAuthLocale(String(req.query.locale || "en"));
      const countryCode = getPricingCountryCode(req);
      return res.json(getPublicCatalog(locale, countryCode));
    },
  );

  app.get(
    "/api/bookings/availability",
    rateLimit({ key: "booking-availability", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: "Please sign in before viewing appointment times." });
      }
      const priority =
        String(req.query.priority || "standard").trim() === "express"
          ? "express"
          : "standard";
      return res.json(getBookingAvailability(priority));
    },
  );

  app.get(
    "/api/stripe/config",
    rateLimit({ key: "stripe-config", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      return res.json(getStripePricingSnapshot(getPricingCountryCode(req)));
    },
  );

  app.get(
    "/api/training/programs",
    rateLimit({ key: "training-programs", windowMs: 1000 * 60, limit: 180 }),
    (_req, res) => {
      return res.json({ programs: getPublicTrainingPrograms() });
    },
  );

  app.get(
    "/api/training/pricing",
    rateLimit({ key: "training-pricing", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = getCurrentUser(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: "Please sign in to view training prices." });
      }
      return res.json(getTrainingPricingSnapshot(getPricingCountryCode(req)));
    },
  );

  app.post(
    "/api/stripe/training-payment-intent",
    rateLimit({
      key: "stripe-training-payment-intent",
      windowMs: 1000 * 60 * 10,
      limit: 30,
    }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Please sign in before starting payment." });
        }

        const level = parseTrainingLevel(
          req.body?.programId ?? req.body?.level,
        );
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const countryCode = getPricingCountryCode(req);

        if (!level) {
          return res
            .status(400)
            .json({ error: "Please choose a valid training program." });
        }

        const intent = await createTrainingPaymentIntent({
          userId: auth.user.id,
          email: auth.user.email,
          level,
          countryCode,
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
    },
  );

  app.post(
    "/api/training/purchases",
    rateLimit({
      key: "training-purchase",
      windowMs: 1000 * 60 * 10,
      limit: 30,
    }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Please sign in before confirming training." });
        }

        const level = parseTrainingLevel(
          req.body?.programId ?? req.body?.level,
        );
        const paymentIntentId = String(req.body?.paymentIntentId || "").trim();
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const countryCode = getPricingCountryCode(req);

        if (!level) {
          return res
            .status(400)
            .json({ error: "Please choose a valid training program." });
        }
        if (!paymentIntentId) {
          return res
            .status(400)
            .json({ error: "Payment reference is required." });
        }

        const payment = await verifyTrainingPayment({
          paymentIntentId,
          userId: auth.user.id,
          level,
          countryCode,
        });

        const program = getCatalogTrainingProgram(level);
        const customerProfile = getCustomerProfile(auth.user.id);
        const enrollment = ensureTrainingEnrollmentFromPurchase({
          userId: auth.user.id,
          userEmail: auth.user.email,
          customerName: customerProfile?.name,
          company: customerProfile?.company,
          country: customerProfile?.country,
          countryCode: customerProfile?.countryCode,
          programKey: level,
          programId: program?.id || null,
          paymentIntentId: payment.id,
          purchaseAmount: payment.amount,
          currency: payment.currency,
        });
        const levelLabel =
          program?.translations?.en?.title || program?.key || level;
        const amountLabel = new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: payment.currency.toUpperCase(),
        }).format(payment.amount / 100);

        const lead = storeContactLead({
          name: auth.user.email,
          email: auth.user.email,
          interest: `Training purchase - ${levelLabel}`,
          message: [
            `Paid training purchase.`,
            `Training: ${levelLabel}`,
            `Amount: ${amountLabel}`,
            `Payment intent: ${payment.id}`,
            `Locale: ${locale}`,
          ].join("\n"),
        });

        const destination = (
          process.env.CONTACT_EMAIL || "contact@cvsolucion.com"
        ).trim();
        res.status(201).json({ ok: true, lead, enrollmentId: enrollment.id });

        void Promise.allSettled([
          sendAuthEmail({
            to: destination,
            subject: `New training purchase - ${levelLabel}`,
            text: [
              `Training: ${levelLabel}`,
              `Amount: ${amountLabel}`,
              `Payment intent: ${payment.id}`,
              `Customer: ${auth.user.email}`,
            ].join("\n"),
            html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin:0 0 16px">New training purchase</h2>
              <p><strong>Training:</strong> ${escapeHtml(levelLabel)}</p>
              <p><strong>Amount:</strong> ${escapeHtml(amountLabel)}</p>
              <p><strong>Payment intent:</strong> ${escapeHtml(payment.id)}</p>
              <p><strong>Customer:</strong> ${escapeHtml(auth.user.email)}</p>
            </div>
          `,
          }),
          sendAuthEmail({
            to: auth.user.email,
            subject: "Your CVsolucion training payment is confirmed",
            text: [
              "Your training payment has been confirmed.",
              `Training: ${levelLabel}`,
              `Amount: ${amountLabel}`,
              "",
              "We will contact you with the next steps.",
            ].join("\n"),
            html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <p>Your training payment has been confirmed.</p>
              <p><strong>Training:</strong> ${escapeHtml(levelLabel)}</p>
              <p><strong>Amount:</strong> ${escapeHtml(amountLabel)}</p>
              <p>We will contact you with the next steps.</p>
            </div>
          `,
          }),
        ]).then((results) => {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              console.error("[training:email:failed]", {
                target: index === 0 ? "admin" : "customer",
                paymentIntentId: payment.id,
                error:
                  result.reason instanceof Error
                    ? result.reason.stack || result.reason.message
                    : String(result.reason),
              });
            }
          });
        });

        return;
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/stripe/booking-payment-intent",
    rateLimit({
      key: "stripe-payment-intent",
      windowMs: 1000 * 60 * 10,
      limit: 40,
    }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Please sign in before starting payment." });
        }

        const serviceType =
          String(req.body?.serviceType || "consultation").trim() === "support"
            ? "support"
            : "consultation";
        const priority =
          String(req.body?.priority || "standard").trim() === "express"
            ? "express"
            : "standard";
        const slots = parseRequestedBookingSlots(req.body?.slots);
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const countryCode = getPricingCountryCode(req);

        if (!slots.length) {
          return res.status(400).json({
            error: "Please choose at least one valid appointment time.",
          });
        }
        if (!isBookingScheduleOpen(priority as BookingPriority)) {
          return res.status(400).json({
            error:
              priority === "express"
                ? "Express booking is currently closed."
                : "Standard booking is currently closed.",
          });
        }

        const intent = await createBookingPaymentIntent({
          userId: auth.user.id,
          email: auth.user.email,
          serviceType,
          priority: priority as BookingPriority,
          countryCode,
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
    },
  );

  app.post(
    "/api/bookings",
    rateLimit({ key: "bookings-create", windowMs: 1000 * 60 * 10, limit: 20 }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Please sign in before booking an appointment." });
        }

        const serviceType =
          String(req.body?.serviceType || "consultation").trim() === "support"
            ? "support"
            : "consultation";
        const priority =
          String(req.body?.priority || "standard").trim() === "express"
            ? "express"
            : "standard";
        const slots = parseRequestedBookingSlots(req.body?.slots);
        const name = String(req.body?.name || "").trim();
        const email = auth.user.email;
        const phone = String(req.body?.phone || "").trim();
        const countryCode = getPricingCountryCode(req);
        const countryRecord = countryCode
          ? getTimezoneCountry(countryCode)
          : null;
        const country =
          countryRecord?.name || String(req.body?.country || "").trim();
        const company = String(req.body?.company || "").trim();
        const notes = String(req.body?.notes || "").trim();
        const packageKey = String(req.body?.packageKey || "").trim() || null;
        const paymentIntentId = String(req.body?.paymentIntentId || "").trim();
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

        if (name.length < 2) {
          return res.status(400).json({ error: "Name is required." });
        }
        if (phone.length < 6) {
          return res
            .status(400)
            .json({ error: "A valid phone number is required." });
        }
        if (!countryCode || !countryRecord) {
          return res
            .status(400)
            .json({ error: "Select a valid country from the list." });
        }
        if (company.length < 2) {
          return res.status(400).json({ error: "Company name is required." });
        }
        if (notes.length < 10) {
          return res
            .status(400)
            .json({ error: "Please describe the issue or request." });
        }
        if (!slots.length) {
          return res.status(400).json({
            error: "Please choose at least one valid appointment time.",
          });
        }
        if (!isBookingScheduleOpen(priority as BookingPriority)) {
          return res.status(400).json({
            error:
              priority === "express"
                ? "Express booking is currently closed."
                : "Standard booking is currently closed.",
          });
        }

        const stripeConfig = getStripePricingSnapshot(countryCode);
        let verifiedPayment: Awaited<
          ReturnType<typeof verifyBookingPayment>
        > | null = null;
        if (stripeConfig.enabled) {
          if (!paymentIntentId) {
            return res.status(400).json({
              error: "Payment is required before confirming this booking.",
            });
          }

          verifiedPayment = await verifyBookingPayment({
            paymentIntentId,
            userId: auth.user.id,
            serviceType,
            priority: priority as BookingPriority,
            countryCode,
            slots,
          });
        }

        if (verifiedPayment?.id) {
          const existingBookings = listBookingsByPaymentReference(
            verifiedPayment.id,
          ).filter((booking) => booking.userId === auth.user.id);
          if (existingBookings.length > 0) {
            upsertCustomerProfile({
              userId: auth.user.id,
              email: auth.user.email,
              name,
              country,
              countryCode,
              phone,
              company,
            });

            return res.status(201).json({
              ok: true,
              bookings: existingBookings,
              booking: existingBookings[0],
            });
          }
        }

        const metadataSubtotal = Number(
          verifiedPayment?.metadata?.bookingSubtotalCents || "",
        );
        const paidUnitAmount =
          Number.isInteger(metadataSubtotal) &&
          metadataSubtotal > 0 &&
          slots.length
            ? Math.round(metadataSubtotal / slots.length)
            : getBookingPrice(
                priority as BookingPriority,
                serviceType,
                countryCode,
              );

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
            countryCode,
            company,
            notes,
            locale,
            paymentStatus: verifiedPayment ? "paid" : "unpaid",
            paymentProvider: verifiedPayment ? "stripe" : null,
            paymentReference: verifiedPayment?.id || null,
            unitAmount: paidUnitAmount,
          }),
        );

        upsertCustomerProfile({
          userId: auth.user.id,
          email: auth.user.email,
          name,
          country,
          countryCode,
          phone,
          company,
        });

        const slotLabel = bookings
          .map(
            (booking) =>
              `${booking.date} ${String(booking.hour).padStart(2, "0")}:00`,
          )
          .join(", ");
        const destination = (
          process.env.CONTACT_EMAIL || "contact@cvsolucion.com"
        ).trim();
        const priorityLabel = priority === "express" ? "Express" : "Standard";
        const serviceLabel =
          serviceType === "support" ? "Support" : "Consultation";

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
                error:
                  result.reason instanceof Error
                    ? result.reason.stack || result.reason.message
                    : String(result.reason),
              });
            }
          });
        });

        return;
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/bookings/:bookingId/reschedule",
    rateLimit({
      key: "bookings-reschedule",
      windowMs: 1000 * 60 * 10,
      limit: 30,
    }),
    async (req, res, next) => {
      try {
        const auth = getCurrentUser(req);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Please sign in before changing an appointment." });
        }

        const bookingId = String(req.params.bookingId || "").trim();
        const date = String(req.body?.date || "").trim();
        const hour = Number(req.body?.hour);

        if (!bookingId) {
          return res.status(400).json({ error: "Booking is required." });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return res
            .status(400)
            .json({ error: "Please choose a valid booking date." });
        }
        if (!Number.isInteger(hour)) {
          return res
            .status(400)
            .json({ error: "Please choose a valid appointment time." });
        }

        const booking = rescheduleBooking({
          bookingId,
          userId: auth.user.id,
          date,
          hour,
        });

        return res.json({
          ok: true,
          booking: serializeCustomerBooking(booking),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/auth/signup",
    rateLimit({ key: "signup-ip", windowMs: 1000 * 60 * 10, limit: 10 }),
    rateLimit({
      key: "signup-email",
      windowMs: 1000 * 60 * 30,
      limit: 4,
      scope: requestBodyFieldScope("email"),
    }),
    async (req, res, next) => {
      try {
        const email = String(req.body?.email || "").trim();
        const password = String(req.body?.password || "");
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const termsAccepted = Boolean(req.body?.termsAccepted);
        const countryCode = normalizeCountryCode(req.body?.countryCode);
        const countryRecord = countryCode
          ? getTimezoneCountry(countryCode)
          : null;
        const country =
          countryRecord?.name || String(req.body?.country || "").trim();
        const termsVersion = "04/2026";

        if (!EMAIL_REGEX.test(email) || !password) {
          return res
            .status(400)
            .json({ error: "Email and password are required." });
        }
        if (!validatePasswordPolicy(password).valid) {
          return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
        }
        if (!termsAccepted) {
          return res.status(400).json({
            error:
              "You must accept the Terms and Conditions before creating an account.",
          });
        }
        if (!countryCode || !countryRecord) {
          return res
            .status(400)
            .json({ error: "Select a valid country from the list." });
        }

        const user = createUser(email, password, termsVersion);
        const { rawToken } = createToken(
          user.id,
          "verify_email",
          VERIFY_LINK_MS,
        );
        const verifyUrl = `${appOrigin(req)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;

        recordEvent({
          type: "signup",
          userId: user.id,
          email: user.email,
          locale,
          ip: getRequestIp(req),
          userAgent: req.get("user-agent") || null,
        });
        try {
          await sendLinkEmail({
            email: user.email,
            locale,
            type: "verify",
            url: verifyUrl,
          });
        } catch (error) {
          if (error instanceof RecipientEmailRejectedError) {
            deleteUserById(user.id);
            return res.status(400).json({
              error: authEmailDeliveryMessage(locale, "recipient_rejected"),
            });
          }
          return res.status(502).json({
            error: authEmailDeliveryMessage(locale, "delivery_failed"),
          });
        }

        upsertCustomerProfile({
          userId: user.id,
          email: user.email,
          country,
          countryCode,
        });

        return res.status(201).json({ ok: true });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/auth/login",
    rateLimit({ key: "login-ip", windowMs: 1000 * 60 * 15, limit: 20 }),
    rateLimit({
      key: "login-email",
      windowMs: 1000 * 60 * 15,
      limit: 8,
      scope: requestBodyFieldScope("email"),
    }),
    (req, res) => {
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const adminOnly = req.body?.adminOnly === true;
      const user = getUserByEmail(email);

      if (!user || !verifyPassword(password, user)) {
        recordEvent({
          type: "login_failed",
          userId: user?.id ?? null,
          email: email.toLowerCase() || null,
          locale: null,
          ip: getRequestIp(req),
          userAgent: req.get("user-agent") || null,
        });
        return res.status(401).json({ error: "Invalid login credentials." });
      }
      if (!user.emailVerifiedAt) {
        return res
          .status(403)
          .json({ error: "Please confirm your email before signing in." });
      }

      const role = getUserRole(user);
      if (adminOnly && role !== "admin") {
        recordEvent({
          type: "admin_login_denied",
          userId: user.id,
          email: user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: req.get("user-agent") || null,
        });
        return res.status(403).json({ error: "Admin access only." });
      }

      const session = createSession(user.id, ONE_YEAR_MS);
      setSessionCookie(req, res, session.id);
      recordEvent({
        type: "login",
        userId: user.id,
        email: user.email,
        locale: adminOnly ? "admin" : null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
      });
      return res.json({
        user: serializePublicUser(user),
        role,
        isAdmin: role === "admin",
        isDesigner: role === "designer",
        isTrainer: role === "trainer",
        csrfToken: createCsrfToken({ session, user }),
      });
    },
  );

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
    clearSessionCookie(req, res);
    return res.json({ ok: true });
  });

  app.post(
    "/api/auth/magic-link",
    rateLimit({ key: "magic-ip", windowMs: 1000 * 60 * 15, limit: 12 }),
    rateLimit({
      key: "magic-email",
      windowMs: 1000 * 60 * 15,
      limit: 6,
      scope: requestBodyFieldScope("email"),
    }),
    (req, res) => {
      console.warn("[auth:magic-link:disabled]", {
        email: String(req.body?.email || "").trim() || null,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
      });
      return res.status(410).json({
        error:
          "Magic link sign-in has been removed. Use your password or reset it if needed.",
      });
    },
  );

  app.post(
    "/api/auth/forgot-password",
    rateLimit({ key: "forgot-ip", windowMs: 1000 * 60 * 15, limit: 12 }),
    rateLimit({
      key: "forgot-email",
      windowMs: 1000 * 60 * 30,
      limit: 5,
      scope: requestBodyFieldScope("email"),
    }),
    async (req, res, next) => {
      try {
        const email = String(req.body?.email || "").trim();
        const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
        const target = req.body?.target === "admin" ? "admin" : "site";
        const user = getUserByEmail(email);

        if (!user) {
          return res.json({ ok: true });
        }
        if (target === "admin" && getUserRole(user) !== "admin") {
          return res.json({ ok: true });
        }

        const { rawToken } = createToken(
          user.id,
          "reset_password",
          RESET_LINK_MS,
        );
        const resetPath =
          target === "admin"
            ? `/admin/login?recovery=1&token=${encodeURIComponent(rawToken)}`
            : `${localePrefix(locale)}/login?recovery=1&token=${encodeURIComponent(rawToken)}`;
        const resetUrl = `${appOrigin(req)}${resetPath}`;

        recordEvent({
          type: "password_reset_requested",
          userId: user.id,
          email: user.email,
          locale: target === "admin" ? "admin" : locale,
          ip: getRequestIp(req),
          userAgent: req.get("user-agent") || null,
        });
        try {
          await sendLinkEmail({
            email: user.email,
            locale,
            type: "reset",
            url: resetUrl,
          });
        } catch (error) {
          if (error instanceof RecipientEmailRejectedError) {
            return res.status(400).json({
              error: authEmailDeliveryMessage(locale, "recipient_rejected"),
            });
          }
          return res.status(502).json({
            error: authEmailDeliveryMessage(locale, "delivery_failed"),
          });
        }
        return res.json({ ok: true });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/auth/reset-password",
    rateLimit({ key: "reset-ip", windowMs: 1000 * 60 * 15, limit: 12 }),
    rateLimit({
      key: "reset-token",
      windowMs: 1000 * 60 * 15,
      limit: 8,
      scope: requestBodyFieldScope("token"),
    }),
    (req, res) => {
      const token = String(req.body?.token || "").trim();
      const password = String(req.body?.password || "");

      if (!token || !password) {
        return res
          .status(400)
          .json({ error: "A valid token and password are required." });
      }
      if (!validatePasswordPolicy(password).valid) {
        return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
      }

      const tokenRecord = consumeToken(token, "reset_password");
      if (!tokenRecord) {
        return res
          .status(400)
          .json({ error: "Reset link expired. Please request a new one." });
      }

      updateUserPassword(tokenRecord.userId, password);
      deleteUserSessions(tokenRecord.userId);
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
    },
  );

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
    setSessionCookie(req, res, session.id);
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
    return res.redirect(
      302,
      `${appOrigin(req)}${localePrefix(locale)}/login?magic=disabled`,
    );
  });

  app.get(
    "/api/admin/dashboard",
    rateLimit({ key: "admin-dashboard", windowMs: 1000 * 60, limit: 120 }),
    async (req, res) => {
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
    },
  );

  app.get(
    "/api/admin/designers",
    rateLimit({ key: "admin-designers", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const users = getAdminSnapshot().users;
      const profiles = listDesignerProfiles();
      const profileMap = new Map(
        profiles.map((profile) => [profile.userId, profile]),
      );
      const bookings = listBookings()
        .filter((booking) => booking.status === "confirmed")
        .map(serializeCustomerBooking);
      const tasks = listDesignerTasks();
      const bookingMap = new Map(
        bookings.map((booking) => [booking.id, booking]),
      );

      const designers = users
        .filter((user) => user.role === "designer")
        .map((user) => {
          const profile = profileMap.get(user.id);
          const designerBookings = bookings.filter(
            (booking) => booking.designerUserId === user.id,
          );
          const designerTasks = tasks.filter(
            (task) => task.designerUserId === user.id,
          );
          return {
            user: {
              ...user,
              displayName:
                profile?.displayName ||
                fallbackDisplayNameFromEmail(user.email),
            },
            profile: profile ?? {
              userId: user.id,
              email: user.email,
              displayName: fallbackDisplayNameFromEmail(user.email),
              title: null,
              notes: null,
              active: true,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            stats: {
              assignedBookings: designerBookings.length,
              upcomingBookings: designerBookings.filter(
                (booking) =>
                  new Date(
                    `${booking.date}T${String(booking.hour).padStart(2, "0")}:00:00`,
                  ).getTime() >= Date.now(),
              ).length,
              openTasks: designerTasks.filter((task) => task.status !== "done")
                .length,
              completedTasks: designerTasks.filter(
                (task) => task.status === "done",
              ).length,
            },
          };
        });

      const candidateUsers = users
        .filter((user) => user.role !== "admin")
        .map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
        }));

      return res.json({
        designers,
        candidateUsers,
        bookings,
        tasks: tasks.map((task) => ({
          ...serializeDesignerTaskForApi(task, bookingMap),
          designer: users.find((user) => user.id === task.designerUserId)
            ? {
                userId: task.designerUserId,
                email:
                  users.find((user) => user.id === task.designerUserId)
                    ?.email || "",
                displayName:
                  profileMap.get(task.designerUserId)?.displayName ||
                  fallbackDisplayNameFromEmail(
                    users.find((user) => user.id === task.designerUserId)
                      ?.email || "",
                  ),
              }
            : null,
        })),
      });
    },
  );

  app.post(
    "/api/admin/bookings/:bookingId/assign-designer",
    rateLimit({
      key: "admin-booking-assign-designer",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const bookingId = String(req.params.bookingId || "").trim();
        const designerUserId =
          typeof req.body?.designerUserId === "string"
            ? req.body.designerUserId.trim()
            : "";

        if (!bookingId) {
          return res.status(400).json({ error: "Booking is required." });
        }

        if (designerUserId) {
          const designerUser = getUserById(designerUserId);
          if (!designerUser || getUserRole(designerUser) !== "designer") {
            return res
              .status(400)
              .json({ error: "Select a valid designer account." });
          }
          upsertDesignerProfile({
            userId: designerUser.id,
            email: designerUser.email,
            displayName:
              getDesignerProfile(designerUser.id)?.displayName ||
              fallbackDisplayNameFromEmail(designerUser.email),
          });
        }

        const booking = assignBookingDesigner({
          bookingId,
          designerUserId: designerUserId || null,
          assignedByUserId: auth.user.id,
        });

        recordEvent({
          type: "admin_booking_designer_assigned",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:booking-assign:${booking.id}:${designerUserId || "none"}`,
        });

        return res.json({
          ok: true,
          booking: serializeCustomerBooking(booking),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/designer-tasks",
    rateLimit({
      key: "admin-designer-task-create",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const designerUserId = String(req.body?.designerUserId || "").trim();
        const title = String(req.body?.title || "").trim();
        const description =
          typeof req.body?.description === "string"
            ? req.body.description
            : null;
        const status = req.body?.status;
        const priority = req.body?.priority;
        const dueAt =
          typeof req.body?.dueAt === "string" ? req.body.dueAt : null;
        const bookingId =
          typeof req.body?.bookingId === "string" ? req.body.bookingId : null;

        const designerUser = getUserById(designerUserId);
        if (!designerUser || getUserRole(designerUser) !== "designer") {
          return res
            .status(400)
            .json({ error: "Select a valid designer account." });
        }
        if (title.length < 3) {
          return res.status(400).json({ error: "Task title is required." });
        }
        if (
          status &&
          status !== "todo" &&
          status !== "in_progress" &&
          status !== "done"
        ) {
          return res.status(400).json({ error: "Invalid task status." });
        }
        if (
          priority &&
          priority !== "low" &&
          priority !== "normal" &&
          priority !== "high"
        ) {
          return res.status(400).json({ error: "Invalid task priority." });
        }

        const task = createDesignerTask({
          designerUserId,
          title,
          description,
          status: status as DesignerTaskStatus | undefined,
          priority: priority as DesignerTaskPriority | undefined,
          dueAt,
          bookingId,
          createdByUserId: auth.user.id,
        });

        recordEvent({
          type: "admin_designer_task_created",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:designer-task-create:${task.id}:${designerUserId}`,
        });

        const bookingMap = new Map(
          listBookings().map((booking) => [
            booking.id,
            serializeCustomerBooking(booking),
          ]),
        );
        return res.json({
          ok: true,
          task: serializeDesignerTaskForApi(task, bookingMap),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/designer-tasks/:taskId",
    rateLimit({
      key: "admin-designer-task-update",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const taskId = String(req.params.taskId || "").trim();
        const designerUserId =
          typeof req.body?.designerUserId === "string"
            ? req.body.designerUserId.trim()
            : undefined;
        const title =
          typeof req.body?.title === "string" ? req.body.title : undefined;
        const description =
          typeof req.body?.description === "string" ||
          req.body?.description === null
            ? req.body.description
            : undefined;
        const dueAt =
          typeof req.body?.dueAt === "string" || req.body?.dueAt === null
            ? req.body.dueAt
            : undefined;
        const bookingId =
          typeof req.body?.bookingId === "string" ||
          req.body?.bookingId === null
            ? req.body.bookingId
            : undefined;
        const status = req.body?.status;
        const priority = req.body?.priority;

        if (designerUserId) {
          const designerUser = getUserById(designerUserId);
          if (!designerUser || getUserRole(designerUser) !== "designer") {
            return res
              .status(400)
              .json({ error: "Select a valid designer account." });
          }
        }
        if (
          status &&
          status !== "todo" &&
          status !== "in_progress" &&
          status !== "done"
        ) {
          return res.status(400).json({ error: "Invalid task status." });
        }
        if (
          priority &&
          priority !== "low" &&
          priority !== "normal" &&
          priority !== "high"
        ) {
          return res.status(400).json({ error: "Invalid task priority." });
        }

        const task = updateDesignerTask({
          taskId,
          designerUserId,
          title,
          description,
          dueAt,
          bookingId,
          status: status as DesignerTaskStatus | undefined,
          priority: priority as DesignerTaskPriority | undefined,
        });

        recordEvent({
          type: "admin_designer_task_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:designer-task-update:${task.id}`,
        });

        const bookingMap = new Map(
          listBookings().map((booking) => [
            booking.id,
            serializeCustomerBooking(booking),
          ]),
        );
        return res.json({
          ok: true,
          task: serializeDesignerTaskForApi(task, bookingMap),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.delete(
    "/api/admin/designer-tasks/:taskId",
    rateLimit({
      key: "admin-designer-task-delete",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const taskId = String(req.params.taskId || "").trim();
        const deleted = deleteDesignerTask(taskId);
        if (!deleted) {
          return res.status(404).json({ error: "Task not found." });
        }

        recordEvent({
          type: "admin_designer_task_deleted",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:designer-task-delete:${taskId}`,
        });

        return res.json({ ok: true });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.get(
    "/api/admin/training",
    rateLimit({ key: "admin-training", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireAdmin(req, res);
      if (!auth) return;

      const locale = normalizeAuthLocale(String(req.query.locale || "en"));
      const adminSnapshot = getAdminSnapshot();
      const usersById = new Map(
        adminSnapshot.users.map((user) => [
          user.id,
          {
            id: user.id,
            email: user.email,
            role: user.role,
            emailVerifiedAt: user.emailVerifiedAt,
          },
        ]),
      );
      const trainerProfiles = listTrainerProfiles();
      const trainerNamesById = new Map(
        trainerProfiles.map((trainer) => [
          trainer.userId,
          trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
        ]),
      );

      const trainers = adminSnapshot.users
        .filter((user) => user.role === "trainer")
        .map((user) => {
          const profile = trainerProfiles.find(
            (trainer) => trainer.userId === user.id,
          ) || {
            userId: user.id,
            email: user.email,
            displayName: fallbackDisplayNameFromEmail(user.email),
            title: null,
            notes: null,
            active: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };

          const enrollments = listTrainingEnrollmentsForTrainer(user.id);
          const activeEnrollments = enrollments.filter(
            (item) => item.status === "active",
          ).length;
          const completedEnrollments = enrollments.filter(
            (item) => item.status === "completed",
          ).length;

          return {
            user,
            profile,
            stats: {
              assignedEnrollments: enrollments.length,
              activeEnrollments,
              completedEnrollments,
            },
          };
        });

      const enrollments = listTrainingEnrollments()
        .map((enrollment) =>
          serializeTrainingEnrollmentForApi(
            enrollment.id,
            locale,
            usersById,
            trainerNamesById,
          ),
        )
        .filter(Boolean);

      const candidateUsers = adminSnapshot.users
        .filter((user) => user.role !== "admin")
        .map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
        }));

      return res.json({
        blueprint: {
          key: TRAINING_BLUEPRINT.key,
          title: TRAINING_BLUEPRINT.title,
          totalHours: TRAINING_BLUEPRINT.totalHours,
          totalSessions: TRAINING_BLUEPRINT.totalSessions,
          passThreshold: TRAINING_BLUEPRINT.passThreshold,
          levels: TRAINING_BLUEPRINT.levels,
          rubric: TRAINING_BLUEPRINT.rubric,
        },
        programs: getCatalogSnapshot().trainingPrograms,
        trainers,
        candidateUsers,
        enrollments,
      });
    },
  );

  app.post(
    "/api/admin/trainers",
    rateLimit({
      key: "admin-trainer-upsert",
      windowMs: 1000 * 60 * 5,
      limit: 60,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const userId = String(req.body?.userId || "").trim();
        if (!userId) {
          return res
            .status(400)
            .json({ error: "Trainer account is required." });
        }

        const user = getUserById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }
        if (getUserRole(user) === "admin") {
          return res
            .status(400)
            .json({ error: "Admin accounts cannot be converted to trainers." });
        }

        const promotedUser = updateAdminUser({
          userId: user.id,
          role: "trainer",
        });

        if (getUserRole(user) === "designer") {
          deleteDesignerProfile(user.id);
          unassignDesignerFromBookings(user.id);
        }

        const profile = upsertTrainerProfile({
          userId: promotedUser.id,
          email: promotedUser.email,
          displayName:
            typeof req.body?.displayName === "string"
              ? req.body.displayName
              : undefined,
          title:
            typeof req.body?.title === "string" ? req.body.title : undefined,
          notes:
            typeof req.body?.notes === "string" ? req.body.notes : undefined,
          active:
            typeof req.body?.active === "boolean" ? req.body.active : undefined,
        });

        recordEvent({
          type: "admin_trainer_profile_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:trainer-upsert:${promotedUser.id}`,
        });

        return res.status(201).json({ ok: true, user: promotedUser, profile });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/trainers/:userId",
    rateLimit({
      key: "admin-trainer-patch",
      windowMs: 1000 * 60 * 5,
      limit: 60,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const userId = String(req.params.userId || "").trim();
        const user = getUserById(userId);
        if (!user || getUserRole(user) !== "trainer") {
          return res.status(404).json({ error: "Trainer account not found." });
        }

        const profile = upsertTrainerProfile({
          userId: user.id,
          email: user.email,
          displayName:
            typeof req.body?.displayName === "string"
              ? req.body.displayName
              : undefined,
          title:
            typeof req.body?.title === "string" ? req.body.title : undefined,
          notes:
            typeof req.body?.notes === "string" ? req.body.notes : undefined,
          active:
            typeof req.body?.active === "boolean" ? req.body.active : undefined,
        });

        if (profile.active === false) {
          deactivateTrainerProfile(user.id);
          unassignTrainerFromEnrollments(user.id);
        }

        recordEvent({
          type: "admin_trainer_profile_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:trainer-patch:${user.id}`,
        });

        return res.json({ ok: true, profile });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/training/enrollments",
    rateLimit({
      key: "admin-training-enrollment-create",
      windowMs: 1000 * 60 * 5,
      limit: 60,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const userId = String(req.body?.userId || "").trim();
        const programKey = String(req.body?.programKey || "").trim();
        const trainerUserId =
          typeof req.body?.trainerUserId === "string"
            ? req.body.trainerUserId.trim()
            : "";
        const status = parseTrainingEnrollmentStatus(req.body?.status);

        if (!userId) {
          return res
            .status(400)
            .json({ error: "Customer account is required." });
        }
        if (!programKey) {
          return res
            .status(400)
            .json({ error: "Training program is required." });
        }

        const customer = getUserById(userId);
        if (!customer || getUserRole(customer) === "admin") {
          return res
            .status(400)
            .json({ error: "Select a valid customer account." });
        }

        if (trainerUserId) {
          const trainer = getUserById(trainerUserId);
          if (!trainer || getUserRole(trainer) !== "trainer") {
            return res
              .status(400)
              .json({ error: "Select a valid trainer account." });
          }
        }

        const profile = getCustomerProfile(customer.id);
        const program = getCatalogTrainingProgram(programKey);
        const enrollment = createTrainingEnrollment({
          userId: customer.id,
          userEmail: customer.email,
          customerName: profile?.name,
          company: profile?.company,
          country: profile?.country,
          countryCode: profile?.countryCode,
          programKey,
          programId: program?.id || null,
          trainerUserId: trainerUserId || null,
          trainerAssignedByUserId: trainerUserId ? auth.user.id : null,
          status: status || "pending",
          notes: typeof req.body?.notes === "string" ? req.body.notes : null,
          internalNotes:
            typeof req.body?.internalNotes === "string"
              ? req.body.internalNotes
              : null,
        });

        recordEvent({
          type: "admin_training_enrollment_created",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:training-enrollment-create:${enrollment.id}`,
        });

        const adminSnapshot = getAdminSnapshot();
        const usersById = new Map(
          adminSnapshot.users.map((user) => [
            user.id,
            {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt,
            },
          ]),
        );
        const trainerNamesById = new Map(
          listTrainerProfiles().map((trainer) => [
            trainer.userId,
            trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
          ]),
        );

        return res.status(201).json({
          ok: true,
          enrollment: serializeTrainingEnrollmentForApi(
            enrollment.id,
            normalizeAuthLocale(String(req.body?.locale || "en")),
            usersById,
            trainerNamesById,
          ),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/training/enrollments/:enrollmentId",
    rateLimit({
      key: "admin-training-enrollment-patch",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const enrollmentId = String(req.params.enrollmentId || "").trim();
        const trainerUserId =
          typeof req.body?.trainerUserId === "string" ||
          req.body?.trainerUserId === null
            ? req.body.trainerUserId
            : undefined;
        const status = parseTrainingEnrollmentStatus(req.body?.status);

        if (typeof trainerUserId === "string" && trainerUserId.trim()) {
          const trainer = getUserById(trainerUserId.trim());
          if (!trainer || getUserRole(trainer) !== "trainer") {
            return res
              .status(400)
              .json({ error: "Select a valid trainer account." });
          }
        }

        const enrollment = updateTrainingEnrollment({
          enrollmentId,
          trainerUserId:
            typeof trainerUserId === "undefined"
              ? undefined
              : String(trainerUserId || "").trim() || null,
          trainerAssignedByUserId:
            typeof trainerUserId === "undefined"
              ? undefined
              : String(trainerUserId || "").trim()
                ? auth.user.id
                : null,
          status,
          notes:
            typeof req.body?.notes === "string" || req.body?.notes === null
              ? req.body.notes
              : undefined,
          internalNotes:
            typeof req.body?.internalNotes === "string" ||
            req.body?.internalNotes === null
              ? req.body.internalNotes
              : undefined,
        });

        recordEvent({
          type: "admin_training_enrollment_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:training-enrollment-patch:${enrollment.id}`,
        });

        const adminSnapshot = getAdminSnapshot();
        const usersById = new Map(
          adminSnapshot.users.map((user) => [
            user.id,
            {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt,
            },
          ]),
        );
        const trainerNamesById = new Map(
          listTrainerProfiles().map((trainer) => [
            trainer.userId,
            trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
          ]),
        );

        return res.json({
          ok: true,
          enrollment: serializeTrainingEnrollmentForApi(
            enrollment.id,
            normalizeAuthLocale(String(req.body?.locale || "en")),
            usersById,
            trainerNamesById,
          ),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/training/enrollments/:enrollmentId/sessions/:sessionCode",
    rateLimit({
      key: "admin-training-session-patch",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const enrollmentId = String(req.params.enrollmentId || "").trim();
        const sessionCode = String(req.params.sessionCode || "").trim();
        const status = parseTrainingSessionStatus(req.body?.status);
        if (!status) {
          return res
            .status(400)
            .json({ error: "Select a valid session status." });
        }

        updateTrainingSessionProgress({
          enrollmentId,
          sessionCode,
          updatedByUserId: auth.user.id,
          status,
          score:
            typeof req.body?.score === "number" ||
            typeof req.body?.score === "string"
              ? Number(req.body.score)
              : null,
          trainerNotes:
            typeof req.body?.trainerNotes === "string"
              ? req.body.trainerNotes
              : null,
          traineeNotes:
            typeof req.body?.traineeNotes === "string"
              ? req.body.traineeNotes
              : null,
          evidence:
            typeof req.body?.evidence === "string" ? req.body.evidence : null,
        });

        recordEvent({
          type: "admin_training_session_updated",
          userId: auth.user.id,
          email: auth.user.email,
          locale: "admin",
          ip: getRequestIp(req),
          userAgent: `admin:training-session-patch:${enrollmentId}:${sessionCode}:${status}`,
        });

        const adminSnapshot = getAdminSnapshot();
        const usersById = new Map(
          adminSnapshot.users.map((user) => [
            user.id,
            {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt,
            },
          ]),
        );
        const trainerNamesById = new Map(
          listTrainerProfiles().map((trainer) => [
            trainer.userId,
            trainer.displayName || fallbackDisplayNameFromEmail(trainer.email),
          ]),
        );

        return res.json({
          ok: true,
          enrollment: serializeTrainingEnrollmentForApi(
            enrollmentId,
            normalizeAuthLocale(String(req.body?.locale || "en")),
            usersById,
            trainerNamesById,
          ),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.get(
    "/api/admin/catalog",
    rateLimit({ key: "admin-catalog-get", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireAdmin(req, res);
      if (!auth) return;
      return res.json(getCatalogSnapshot());
    },
  );

  app.put(
    "/api/admin/catalog/pricing",
    rateLimit({
      key: "admin-catalog-pricing",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
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
    },
  );

  app.put(
    "/api/admin/catalog/training-pricing",
    rateLimit({
      key: "admin-catalog-training-pricing",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const pricing = updateCatalogTrainingPrices({
          level1: Number(req.body?.level1),
          level2: Number(req.body?.level2),
          level3: Number(req.body?.level3),
          level4: Number(req.body?.level4),
          bundle: Number(req.body?.bundle),
        });

        return res.json({ ok: true, trainingPrices: pricing });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.put(
    "/api/admin/catalog/country-pricing/:countryCode",
    rateLimit({
      key: "admin-catalog-country-pricing",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const override = upsertCatalogCountryPriceOverride({
          countryCode: String(
            req.params.countryCode || req.body?.countryCode || "",
          ),
          active:
            typeof req.body?.active === "boolean" ? req.body.active : true,
          bookingPrices: req.body?.bookingPrices,
          trainingProgramPrices: req.body?.trainingProgramPrices,
        });

        return res.json({
          ok: true,
          countryPriceOverride: override,
          countryPriceOverrides: getCatalogSnapshot().countryPriceOverrides,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.delete(
    "/api/admin/catalog/country-pricing/:countryCode",
    rateLimit({
      key: "admin-catalog-country-pricing-delete",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        deleteCatalogCountryPriceOverride(String(req.params.countryCode || ""));
        return res.json({
          ok: true,
          countryPriceOverrides: getCatalogSnapshot().countryPriceOverrides,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/catalog/training-programs",
    rateLimit({
      key: "admin-catalog-training-program-create",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const record = createCatalogTrainingProgram({
          key: typeof req.body?.key === "string" ? req.body.key : undefined,
          active:
            typeof req.body?.active === "boolean" ? req.body.active : true,
          featured: Boolean(req.body?.featured),
          order: Number(req.body?.order),
          priceCents: Number(req.body?.priceCents),
          translations: req.body?.translations,
        });

        return res.status(201).json({
          ok: true,
          trainingProgram: record,
          trainingPrograms: getCatalogSnapshot().trainingPrograms,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/catalog/training-programs/:programId",
    rateLimit({
      key: "admin-catalog-training-program-update",
      windowMs: 1000 * 60 * 5,
      limit: 100,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const programId = String(req.params.programId || "").trim();
        if (!programId) {
          return res
            .status(400)
            .json({ error: "Training program is required." });
        }

        const record = updateCatalogTrainingProgram({
          id: programId,
          key: typeof req.body?.key === "string" ? req.body.key : undefined,
          active:
            typeof req.body?.active === "boolean" ? req.body.active : undefined,
          featured:
            typeof req.body?.featured === "boolean"
              ? req.body.featured
              : undefined,
          order:
            typeof req.body?.order !== "undefined"
              ? Number(req.body.order)
              : undefined,
          priceCents:
            typeof req.body?.priceCents !== "undefined"
              ? Number(req.body.priceCents)
              : undefined,
          translations: req.body?.translations,
        });

        return res.json({
          ok: true,
          trainingProgram: record,
          trainingPrograms: getCatalogSnapshot().trainingPrograms,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.delete(
    "/api/admin/catalog/training-programs/:programId",
    rateLimit({
      key: "admin-catalog-training-program-delete",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const programId = String(req.params.programId || "").trim();
        if (!programId) {
          return res
            .status(400)
            .json({ error: "Training program is required." });
        }

        deleteCatalogTrainingProgram(programId);
        return res.json({
          ok: true,
          trainingPrograms: getCatalogSnapshot().trainingPrograms,
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/catalog/packages",
    rateLimit({
      key: "admin-catalog-package-create",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const record = createCatalogPackage({
          active:
            typeof req.body?.active === "boolean" ? req.body.active : true,
          highlight: Boolean(req.body?.highlight),
          order: Number(req.body?.order),
          translations: req.body?.translations,
        });

        return res.status(201).json({ ok: true, package: record });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/catalog/packages/:packageId",
    rateLimit({
      key: "admin-catalog-package-update",
      windowMs: 1000 * 60 * 5,
      limit: 100,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const packageId = String(req.params.packageId || "").trim();
        if (!packageId) {
          return res.status(400).json({ error: "Package is required." });
        }

        const record = updateCatalogPackage({
          id: packageId,
          active:
            typeof req.body?.active === "boolean" ? req.body.active : undefined,
          highlight:
            typeof req.body?.highlight === "boolean"
              ? req.body.highlight
              : undefined,
          order:
            typeof req.body?.order !== "undefined"
              ? Number(req.body.order)
              : undefined,
          translations: req.body?.translations,
        });

        return res.json({ ok: true, package: record });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.delete(
    "/api/admin/catalog/packages/:packageId",
    rateLimit({
      key: "admin-catalog-package-delete",
      windowMs: 1000 * 60 * 5,
      limit: 50,
    }),
    (req, res, next) => {
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
    },
  );

  app.patch(
    "/api/admin/users/:userId",
    rateLimit({ key: "admin-user-patch", windowMs: 1000 * 60 * 5, limit: 60 }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const userId = String(req.params.userId || "").trim();
        const email = req.body?.email;
        const password = req.body?.password;
        const emailVerified = req.body?.emailVerified;
        const role = req.body?.role;
        const displayName = req.body?.displayName;
        const title = req.body?.title;
        const notes = req.body?.notes;
        const active = req.body?.active;
        const passwordChanged =
          typeof password === "string" && password.length > 0;
        const nextRole: AuthUserRole | undefined =
          role === "admin" ||
          role === "designer" ||
          role === "trainer" ||
          role === "customer"
            ? role
            : undefined;

        if (userId === auth.user.id && nextRole && nextRole !== "admin") {
          return res
            .status(400)
            .json({ error: "You cannot remove your own admin role." });
        }

        const user = updateAdminUser({
          userId,
          email: typeof email === "string" ? email : undefined,
          password: typeof password === "string" ? password : undefined,
          emailVerified:
            typeof emailVerified === "boolean" ? emailVerified : undefined,
          role: nextRole,
        });
        if (passwordChanged) {
          deleteUserSessions(user.id);
        }

        const resolvedRole = getUserRole(user);
        if (resolvedRole === "designer") {
          upsertDesignerProfile({
            userId: user.id,
            email: user.email,
            displayName:
              typeof displayName === "string" ? displayName : undefined,
            title: typeof title === "string" ? title : undefined,
            notes: typeof notes === "string" ? notes : undefined,
            active: typeof active === "boolean" ? active : undefined,
          });
        } else {
          deleteDesignerProfile(user.id);
          unassignDesignerFromBookings(user.id);
        }

        if (resolvedRole === "trainer") {
          upsertTrainerProfile({
            userId: user.id,
            email: user.email,
            displayName:
              typeof displayName === "string" ? displayName : undefined,
            title: typeof title === "string" ? title : undefined,
            notes: typeof notes === "string" ? notes : undefined,
            active: typeof active === "boolean" ? active : undefined,
          });
        } else {
          deactivateTrainerProfile(user.id);
          unassignTrainerFromEnrollments(user.id);
        }

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
    },
  );

  app.delete(
    "/api/admin/users/:userId",
    rateLimit({ key: "admin-user-delete", windowMs: 1000 * 60 * 5, limit: 25 }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const userId = String(req.params.userId || "").trim();
        if (userId === auth.user.id) {
          return res
            .status(400)
            .json({ error: "You cannot delete your own admin account." });
        }

        const deletedUser = deleteUserById(userId);
        if (getUserRole(deletedUser) === "designer") {
          deleteDesignerProfile(deletedUser.id);
          unassignDesignerFromBookings(deletedUser.id);
        }
        if (getUserRole(deletedUser) === "trainer") {
          deactivateTrainerProfile(deletedUser.id);
          unassignTrainerFromEnrollments(deletedUser.id);
        }
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
    },
  );

  app.post(
    "/api/admin/users/:userId/send-verification",
    rateLimit({
      key: "admin-send-verification",
      windowMs: 1000 * 60 * 5,
      limit: 30,
    }),
    async (req, res, next) => {
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
          return res
            .status(400)
            .json({ error: "This email is already verified." });
        }

        const { rawToken } = createToken(
          user.id,
          "verify_email",
          VERIFY_LINK_MS,
        );
        const verifyUrl = `${appOrigin(req)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;
        try {
          await sendLinkEmail({
            email: user.email,
            locale,
            type: "verify",
            url: verifyUrl,
          });
        } catch (error) {
          if (error instanceof RecipientEmailRejectedError) {
            return res.status(400).json({
              error:
                "This email address cannot receive messages. Update the address and try again.",
            });
          }
          return res.status(502).json({
            error: "Unable to send the verification email right now.",
          });
        }

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
    },
  );

  app.delete(
    "/api/admin/sessions/:sessionId",
    rateLimit({
      key: "admin-session-delete",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
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
    },
  );

  app.delete(
    "/api/admin/users/:userId/sessions",
    rateLimit({
      key: "admin-user-sessions-delete",
      windowMs: 1000 * 60 * 5,
      limit: 40,
    }),
    (req, res, next) => {
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
    },
  );

  app.get(
    "/api/admin/bookings/slots",
    rateLimit({ key: "admin-booking-slots", windowMs: 1000 * 60, limit: 180 }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const date = String(req.query.date || "").trim();
        const priority =
          String(req.query.priority || "standard").trim() === "express"
            ? "express"
            : "standard";
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
    },
  );

  app.post(
    "/api/admin/bookings/slots/block",
    rateLimit({
      key: "admin-booking-slot-block",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const date = String(req.body?.date || "").trim();
        const hour = Number(req.body?.hour);
        const priority =
          String(req.body?.priority || "standard").trim() === "express"
            ? "express"
            : "standard";
        const reason =
          typeof req.body?.reason === "string" ? req.body.reason : null;

        if (!date || !Number.isInteger(hour)) {
          return res
            .status(400)
            .json({ error: "Valid date and hour are required." });
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
    },
  );

  app.post(
    "/api/admin/bookings/slots/unblock",
    rateLimit({
      key: "admin-booking-slot-unblock",
      windowMs: 1000 * 60 * 5,
      limit: 120,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const date = String(req.body?.date || "").trim();
        const hour = Number(req.body?.hour);
        const priority =
          String(req.body?.priority || "standard").trim() === "express"
            ? "express"
            : "standard";

        if (!date || !Number.isInteger(hour)) {
          return res
            .status(400)
            .json({ error: "Valid date and hour are required." });
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
    },
  );

  app.post(
    "/api/admin/bookings/:bookingId/cancel",
    rateLimit({
      key: "admin-booking-cancel",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    (req, res, next) => {
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

        return res.json({
          ok: true,
          booking: serializeCustomerBooking(booking),
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/bookings/:bookingId/refund",
    rateLimit({
      key: "admin-booking-refund",
      windowMs: 1000 * 60 * 5,
      limit: 40,
    }),
    async (req, res, next) => {
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
          return res
            .status(400)
            .json({ error: "This booking has no Stripe payment to refund." });
        }

        if (booking.paymentStatus === "refunded") {
          return res
            .status(400)
            .json({ error: "This booking has already been refunded." });
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
    },
  );

  app.patch(
    "/api/admin/bookings/schedule",
    rateLimit({
      key: "admin-booking-schedule",
      windowMs: 1000 * 60 * 5,
      limit: 60,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const settings = updateBookingScheduleSettings({
          standardOpen:
            typeof req.body?.standardOpen === "boolean"
              ? req.body.standardOpen
              : undefined,
          expressOpen:
            typeof req.body?.expressOpen === "boolean"
              ? req.body.expressOpen
              : undefined,
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
    },
  );

  app.get("/api/articles", (req, res) => {
    const locale = normalizeAuthLocale(
      String(req.query.locale || "en"),
    ) as ArticleLocale;
    const articles = listPublishedArticles(locale).map((item) => ({
      ...item,
      excerpt: summarizeArticle(item.body),
    }));
    return res.json({ articles });
  });

  app.get("/api/articles/:slug", (req, res) => {
    const slug = String(req.params.slug || "").trim();
    const locale = normalizeAuthLocale(
      String(req.query.locale || "en"),
    ) as ArticleLocale;
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

  app.get(
    "/api/admin/articles",
    rateLimit({ key: "admin-articles", windowMs: 1000 * 60, limit: 120 }),
    (req, res) => {
      const auth = requireAdmin(req, res);
      if (!auth) return;
      const articles = listAdminArticles().map((item) => ({
        ...item,
        excerpt: summarizeArticle(item.body),
      }));
      return res.json({ articles });
    },
  );

  app.post(
    "/api/admin/article-images",
    express.raw({
      type: ["image/png", "image/jpeg", "image/webp"],
      limit: "12mb",
    }),
    rateLimit({
      key: "admin-article-images",
      windowMs: 1000 * 60 * 5,
      limit: 40,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const rawContentType = String(req.headers["content-type"] || "")
          .trim()
          .toLowerCase();
        const binaryTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

        if (binaryTypes.has(rawContentType)) {
          const rawFilename = String(
            req.headers["x-upload-filename"] || "",
          ).trim();
          const filename = rawFilename ? decodeURIComponent(rawFilename) : "";
          const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
          if (!buffer.length) {
            return res
              .status(400)
              .json({ error: "Image content is required." });
          }

          const image = saveArticleImageBuffer({
            filename,
            contentType: rawContentType,
            buffer,
          });
          return res.json({ ok: true, image });
        }

        const filename = String(req.body?.filename || "").trim();
        const contentType = String(req.body?.contentType || "")
          .trim()
          .toLowerCase();
        const base64 = String(req.body?.base64 || "").trim();
        if (!contentType || !base64) {
          return res.status(400).json({ error: "Image content is required." });
        }

        const image = saveArticleImage({ filename, contentType, base64 });
        return res.json({ ok: true, image });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.post(
    "/api/admin/articles",
    rateLimit({
      key: "admin-articles-create",
      windowMs: 1000 * 60 * 5,
      limit: 40,
    }),
    async (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const title = String(req.body?.title || "").trim();
        const body = String(req.body?.body || "").trim();
        const sourceLocale = normalizeAuthLocale(
          String(req.body?.sourceLocale || "en"),
        ) as ArticleLocale;
        const imageUrl =
          typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;
        const publishedAt =
          typeof req.body?.publishedAt === "string"
            ? req.body.publishedAt
            : null;

        if (!title || !body) {
          return res
            .status(400)
            .json({ error: "Title and article body are required." });
        }

        const article = await createArticle({
          sourceLocale,
          title,
          body,
          imageUrl,
          publishedAt,
        });
        return res.json({
          ok: true,
          article: { ...article, excerpt: summarizeArticle(article.body) },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.patch(
    "/api/admin/articles/:articleId",
    rateLimit({
      key: "admin-articles-update",
      windowMs: 1000 * 60 * 5,
      limit: 80,
    }),
    async (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const articleId = String(req.params.articleId || "").trim();
        const title = String(req.body?.title || "").trim();
        const body = String(req.body?.body || "").trim();
        const sourceLocale = normalizeAuthLocale(
          String(req.body?.sourceLocale || "en"),
        ) as ArticleLocale;
        const imageUrl =
          typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;
        const publishedAt =
          typeof req.body?.publishedAt === "string"
            ? req.body.publishedAt
            : null;

        if (!title || !body) {
          return res
            .status(400)
            .json({ error: "Title and article body are required." });
        }

        const article = await updateArticle(articleId, {
          sourceLocale,
          title,
          body,
          imageUrl,
          publishedAt,
        });
        return res.json({
          ok: true,
          article: { ...article, excerpt: summarizeArticle(article.body) },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  app.delete(
    "/api/admin/articles/:articleId",
    rateLimit({
      key: "admin-articles-delete",
      windowMs: 1000 * 60 * 5,
      limit: 40,
    }),
    (req, res, next) => {
      try {
        const auth = requireAdmin(req, res);
        if (!auth) return;

        const articleId = String(req.params.articleId || "").trim();
        deleteArticle(articleId);
        return res.json({ ok: true });
      } catch (error) {
        return next(error);
      }
    },
  );

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  const indexPath = path.join(staticPath, "index.html");
  const adminIndexPath = path.join(staticPath, "admin.html");
  const indexTemplate = fs.readFileSync(indexPath, "utf8");
  const adminIndexTemplate = fs.existsSync(adminIndexPath)
    ? fs.readFileSync(adminIndexPath, "utf8")
    : indexTemplate;

  app.get("/robots.txt", (req, res) => {
    const body = buildRobotsTxt(canonicalOrigin(req));
    res.setHeader("Content-Type", "text/plain; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(body);
  });

  app.get("/BingSiteAuth.xml", (_req, res) => {
    const customXml = String(process.env.BING_SITE_AUTH_XML || "").trim();
    const token = String(
      process.env.BING_SITE_AUTH_TOKEN ||
        process.env.BING_SITE_VERIFICATION ||
        "",
    ).trim();

    if (customXml) {
      const body = customXml.startsWith("<?xml")
        ? customXml
        : `<?xml version="1.0"?>\n${customXml}`;
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
          if (filePath.endsWith("admin.html")) {
            res.setHeader("X-Robots-Tag", "noindex, nofollow");
          }
        } else if (filePath.endsWith(".js")) {
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=UTF-8",
          );
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
      },
    }),
  );

  app.use(
    "/uploads",
    express.static(path.join(getAppDataDir(), "uploads"), {
      maxAge: "30d",
      etag: true,
      lastModified: true,
    }),
  );

  app.get("*", (req, res) => {
    if (isMissingStaticAssetRequest(req.path)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(404).send("Not Found");
    }

    try {
      if (isAdminShellRequest(req.path)) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        return res.status(200).send(adminIndexTemplate);
      }

      const knownPublicPath = isKnownPublicSeoPath(req.path);
      const html = renderSeoHtml(indexTemplate, req.path, canonicalOrigin(req));
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      if (!knownPublicPath) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
      }
      return res.status(knownPublicPath ? 200 : 404).send(html);
    } catch {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      if (isAdminShellRequest(req.path) && fs.existsSync(adminIndexPath)) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        return res.sendFile(adminIndexPath);
      }
      return res.sendFile(indexPath);
    }
  });

  app.use(
    (
      err: Error & {
        expose?: boolean;
        status?: number;
        statusCode?: number;
        type?: string;
      },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const status = Number(err.status || err.statusCode || 500);
      const safeStatus = status >= 400 && status < 600 ? status : 500;
      if (safeStatus >= 500) {
        console.error("Server Error:", err);
      } else {
        console.warn("Client Error:", {
          status: safeStatus,
          type: err.type,
          message: err.message,
        });
      }
      const message =
        err.type === "entity.parse.failed"
          ? "Invalid JSON payload."
          : safeStatus < 500 && err.expose
            ? err.message
            : "Internal Server Error";
      res.status(safeStatus).json({ error: message });
    },
  );

  const port =
    process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log("Security headers enabled");
    void backfillArticleTranslations()
      .then(({ translated }) => {
        if (translated > 0) {
          console.log(
            `[articles] backfilled translations for ${translated} article(s)`,
          );
        }
      })
      .catch((error) => {
        console.error("[articles] translation backfill failed", error);
      });
  });
}

startServer().catch(console.error);
