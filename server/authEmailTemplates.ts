import fs from "fs";
import path from "path";

export type AuthEmailType = "verify" | "magic" | "reset";
export type AuthEmailLocale = "en" | "fr" | "ar";

const SUBJECTS: Record<AuthEmailLocale, Record<AuthEmailType, string>> = {
  en: {
    verify: "Confirm your email",
    magic: "Your sign-in link",
    reset: "Reset your password",
  },
  fr: {
    verify: "Confirmez votre email",
    magic: "Votre lien de connexion",
    reset: "Reinitialisation du mot de passe",
  },
  ar: {
    verify: "تأكيد البريد الإلكتروني",
    magic: "رابط تسجيل الدخول",
    reset: "إعادة تعيين كلمة المرور",
  },
};

function fallbackHtml(locale: AuthEmailLocale, type: AuthEmailType, url: string) {
  const copy: Record<AuthEmailLocale, Record<AuthEmailType, { title: string; body: string; cta: string }>> = {
    en: {
      verify: {
        title: "Confirm your email address",
        body: "Click the button below to verify your email and activate your account.",
        cta: "Confirm email",
      },
      magic: {
        title: "Passwordless sign-in",
        body: "Click the button below to sign in securely without entering your password.",
        cta: "Sign in now",
      },
      reset: {
        title: "Reset your password",
        body: "Click the button below to choose a new password for your account.",
        cta: "Reset password",
      },
    },
    fr: {
      verify: {
        title: "Confirmez votre adresse email",
        body: "Cliquez sur le bouton ci-dessous pour verifier votre email et activer votre compte.",
        cta: "Confirmer l'email",
      },
      magic: {
        title: "Connexion sans mot de passe",
        body: "Cliquez sur le bouton ci-dessous pour vous connecter en toute securite sans saisir votre mot de passe.",
        cta: "Se connecter",
      },
      reset: {
        title: "Reinitialisez votre mot de passe",
        body: "Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe.",
        cta: "Reinitialiser le mot de passe",
      },
    },
    ar: {
      verify: {
        title: "تأكيد عنوان بريدك الإلكتروني",
        body: "اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.",
        cta: "تأكيد البريد",
      },
      magic: {
        title: "تسجيل دخول بدون كلمة مرور",
        body: "اضغط على الزر أدناه لتسجيل الدخول بشكل آمن بدون إدخال كلمة المرور.",
        cta: "تسجيل الدخول الآن",
      },
      reset: {
        title: "إعادة تعيين كلمة المرور",
        body: "اضغط على الزر أدناه لاختيار كلمة مرور جديدة لحسابك.",
        cta: "إعادة تعيين كلمة المرور",
      },
    },
  };

  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const strings = copy[locale][type];

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a;direction:${dir};text-align:${align}">
      <h2>${strings.title}</h2>
      <p>${strings.body}</p>
      <p>
        <a href="${url}" style="display:inline-block;padding:12px 18px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:10px">
          ${strings.cta}
        </a>
      </p>
      <p style="word-break:break-all;color:#475569">${url}</p>
    </div>
  `;
}

function fallbackText(locale: AuthEmailLocale, type: AuthEmailType, url: string) {
  const copy: Record<AuthEmailLocale, Record<AuthEmailType, string>> = {
    en: {
      verify: "Confirm your email by opening this link:",
      magic: "Sign in by opening this link:",
      reset: "Reset your password by opening this link:",
    },
    fr: {
      verify: "Confirmez votre email en ouvrant ce lien :",
      magic: "Connectez-vous en ouvrant ce lien :",
      reset: "Reinitialisez votre mot de passe en ouvrant ce lien :",
    },
    ar: {
      verify: "أكد بريدك الإلكتروني عبر فتح هذا الرابط:",
      magic: "سجّل الدخول عبر فتح هذا الرابط:",
      reset: "أعد تعيين كلمة المرور عبر فتح هذا الرابط:",
    },
  };

  return `${copy[locale][type]}\n\n${url}`;
}

export function normalizeAuthLocale(locale?: string | null): AuthEmailLocale {
  return locale === "fr" || locale === "ar" ? locale : "en";
}

function templateBasePath() {
  return path.resolve(process.cwd(), "emails", "auth");
}

function readTemplateFile(locale: AuthEmailLocale, type: AuthEmailType, extension: "html" | "txt") {
  const localizedPath = path.join(templateBasePath(), locale, `${type}.${extension}`);
  if (fs.existsSync(localizedPath)) {
    return fs.readFileSync(localizedPath, "utf8");
  }

  const fallbackPath = path.join(templateBasePath(), "en", `${type}.${extension}`);
  if (fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath, "utf8");
  }

  return null;
}

function interpolate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? "");
}

export function renderAuthEmailTemplate(args: {
  locale?: string | null;
  type: AuthEmailType;
  url: string;
  email: string;
}) {
  const locale = normalizeAuthLocale(args.locale);
  const values = {
    appName: "CVsolucion",
    email: args.email,
    url: args.url,
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    year: String(new Date().getFullYear()),
  };
  const htmlTemplate = readTemplateFile(locale, args.type, "html");
  const textTemplate = readTemplateFile(locale, args.type, "txt");

  return {
    locale,
    subject: SUBJECTS[locale][args.type],
    html: htmlTemplate ? interpolate(htmlTemplate, values) : fallbackHtml(locale, args.type, args.url),
    text: textTemplate ? interpolate(textTemplate, values) : fallbackText(locale, args.type, args.url),
  };
}
