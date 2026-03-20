import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ==========================================================================
  // إخفاء ترويسة X-Powered-By
  // ==========================================================================
  app.disable("x-powered-by");

  // ==========================================================================
  // إضافة ترويسات الأمان (Security Headers)
  // ==========================================================================
  app.use((_req, res, next) => {
    // منع هجمات Clickjacking
    //res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // منع تخمين نوع المحتوى
    res.setHeader("X-Content-Type-Options", "nosniff");

    // تفعيل حماية XSS في المتصفحات القديمة
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // فرض استخدام HTTPS دائماً (HSTS) - سنة واحدة
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // التحكم في معلومات المُحيل
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // سياسة أمان المحتوى (CSP) - محدثة لدعم جميع خدمات التتبع
    /*res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // Scripts: GTM, GA4, Meta Pixel, Cloudflare, Clarity, CAPI
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://static.cloudflareinsights.com https://www.clarity.ms https://capi-automation.s3.us-east-2.amazonaws.com https://gtm.cvsolucion.com",
        // Styles: Google Fonts, GTM Tag Assistant
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com",
        // Fonts
        "font-src 'self' https://fonts.gstatic.com",
        // Images: Allow all HTTPS sources
        "img-src 'self' data: https: blob:",
        // Connections: GA4, GTM, Meta, Clarity, Server-side GTM, WhatsApp
        "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://tagassistant.google.com https://www.facebook.com https://connect.facebook.net https://gtm.cvsolucion.com https://server-side-tagging-dqvar6cuea-uc.a.run.app https://www.clarity.ms https://api.whatsapp.com https://gtm.cvsolucion.com",
        // Frames: GTM preview, Meta
        "frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net https://www.facebook.com https://gtm.cvsolucion.com",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );*/

    // سياسة الأذونات
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );

    next();
  });

  // ==========================================================================
  // منع الوصول إلى ملفات Source Maps
  // ==========================================================================
  app.use((req, res, next) => {
    if (req.path.endsWith(".map")) {
      return res.status(404).send("Not Found");
    }
    next();
  });

  // ==========================================================================
  // منع الوصول إلى الملفات الحساسة
  // ==========================================================================
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
    next();
  });

  // ==========================================================================
  // Serve static files from dist/public in production
  // ==========================================================================
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // إعدادات التخزين المؤقت للملفات الثابتة
  app.use(
    express.static(staticPath, {
      maxAge: "1y",
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // إضافة ترويسات أمان للملفات الثابتة
        res.setHeader("X-Content-Type-Options", "nosniff");

        // تعيين نوع المحتوى الصحيح
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
      },
    })
  );

  // ==========================================================================
  // Handle client-side routing - serve index.html for all routes
  // ==========================================================================
  app.get("*", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    const wantsFr = req.path === "/fr" || req.path.startsWith("/fr/");
    const wantsAr = req.path === "/ar" || req.path.startsWith("/ar/");

    if (wantsFr) {
      try {
        const html = fs.readFileSync(indexPath, "utf8");
          const patched = html.replace(/<html\s+lang="[^"]*"/i, '<html lang="fr"' );
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.status(200);
        return res.end(patched);
      } catch {
        // ignore
      }
    }

    return res.sendFile(indexPath);
  });

// ==========================================================================
  // معالجة الأخطاء
  // ==========================================================================
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Server Error:", err);
      res.status(500).send("Internal Server Error");
    }
  );

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}/`);
    console.log(`🔒 Security headers enabled`);
  });
}

startServer().catch(console.error);
