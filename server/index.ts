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
  app.use(express.json());

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
    if (!["session_start", "session_end", "whatsapp_click", "email_click", "cta_click"].includes(eventType)) {
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

  app.post("/api/auth/magic-link", rateLimit({ key: "magic", windowMs: 1000 * 60 * 15, limit: 12 }), async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const user = getUserByEmail(email);

      if (!user) {
        return res.json({ ok: true });
      }

      const { rawToken } = createToken(user.id, "magic_link", MAGIC_LINK_MS);
      const magicUrl = `${appOrigin(req)}/api/auth/magic-login?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;

      recordEvent({
        type: "magic_link_requested",
        userId: user.id,
        email: user.email,
        locale,
        ip: getRequestIp(req),
        userAgent: req.get("user-agent") || null,
      });
      await sendLinkEmail({ email: user.email, locale, type: "magic", url: magicUrl });
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
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
    const token = String(req.query.token || "");
    const locale = normalizeAuthLocale(String(req.query.locale || "en"));
    const tokenRecord = consumeToken(token, "magic_link");
    const redirectUrl = `${appOrigin(req)}${localePrefix(locale)}/`;

    if (!tokenRecord) {
      return res.redirect(302, `${appOrigin(req)}${localePrefix(locale)}/login?mode=magic`);
    }

    const user = getUserById(tokenRecord.userId);
    if (!user) {
      return res.redirect(302, `${appOrigin(req)}${localePrefix(locale)}/login?mode=magic`);
    }

    const session = createSession(user.id, ONE_YEAR_MS);
    setSessionCookie(res, session.id);
    recordEvent({
      type: "magic_login_completed",
      userId: user.id,
      email: user.email,
      locale,
      ip: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    });
    return res.redirect(302, redirectUrl);
  });

  app.get("/api/admin/dashboard", rateLimit({ key: "admin-dashboard", windowMs: 1000 * 60, limit: 120 }), async (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    res.setHeader("Cache-Control", "no-store");
    const ga4 = await getGa4DashboardSnapshot();
    return res.json({
      admin: {
        email: auth.user.email,
      },
      ...getAdminSnapshot(),
      visitors: getVisitorsSnapshot(),
      ga4,
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
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
      },
    })
  );

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
        res.status(200);
        return res.end(patched);
      } catch {
        return res.sendFile(indexPath);
      }
    }

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
  });
}

startServer().catch(console.error);
