import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import {
  consumeToken,
  createSession,
  createToken,
  createUser,
  deleteSession,
  getSession,
  getUserByEmail,
  getUserById,
  markUserEmailVerified,
  serializePublicUser,
  updateUserPassword,
  verifyPassword,
} from "./authStore";
import { sendAuthEmail } from "./authMailer";
import { normalizeAuthLocale, renderAuthEmailTemplate } from "./authEmailTemplates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAGIC_LINK_MS = 1000 * 60 * 20;
const VERIFY_LINK_MS = 1000 * 60 * 60 * 24;
const RESET_LINK_MS = 1000 * 60 * 30;

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
    return res.json({ user: serializePublicUser(auth.user) });
  });

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));

      if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: "Email and a password of at least 8 characters are required." });
      }

      const user = createUser(email, password);
      const { rawToken } = createToken(user.id, "verify_email", VERIFY_LINK_MS);
      const verifyUrl = `${appOrigin(req)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;

      await sendLinkEmail({ email: user.email, locale, type: "verify", url: verifyUrl });

      return res.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const user = getUserByEmail(email);

    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ error: "Invalid login credentials." });
    }

    const session = createSession(user.id, ONE_YEAR_MS);
    setSessionCookie(res, session.id);
    return res.json({ user: serializePublicUser(user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[COOKIE_NAME];
    if (sessionId) {
      deleteSession(sessionId);
    }
    clearSessionCookie(res);
    return res.json({ ok: true });
  });

  app.post("/api/auth/magic-link", async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const user = getUserByEmail(email);

      if (!user) {
        return res.json({ ok: true });
      }

      const { rawToken } = createToken(user.id, "magic_link", MAGIC_LINK_MS);
      const magicUrl = `${appOrigin(req)}/api/auth/magic-login?token=${encodeURIComponent(rawToken)}&locale=${encodeURIComponent(locale)}`;

      await sendLinkEmail({ email: user.email, locale, type: "magic", url: magicUrl });
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim();
      const locale = normalizeAuthLocale(String(req.body?.locale || "en"));
      const user = getUserByEmail(email);

      if (!user) {
        return res.json({ ok: true });
      }

      const { rawToken } = createToken(user.id, "reset_password", RESET_LINK_MS);
      const resetUrl = `${appOrigin(req)}${localePrefix(locale)}/login?recovery=1&token=${encodeURIComponent(rawToken)}`;

      await sendLinkEmail({ email: user.email, locale, type: "reset", url: resetUrl });
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/reset-password", (req, res) => {
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
    return res.redirect(302, redirectUrl);
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
