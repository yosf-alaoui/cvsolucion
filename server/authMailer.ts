import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export class RecipientEmailRejectedError extends Error {
  constructor() {
    super("EMAIL_RECIPIENT_REJECTED");
    this.name = "RecipientEmailRejectedError";
  }
}

function isRecipientMailboxRejected(error: unknown) {
  const errorLike = error as {
    message?: string;
    response?: string;
    responseCode?: number;
    code?: string;
    rejected?: unknown[];
    rejectedErrors?: Array<{ message?: string; response?: string; code?: string }>;
  } | null;

  const haystack = [
    errorLike?.message,
    errorLike?.response,
    errorLike?.code,
    ...(errorLike?.rejectedErrors?.flatMap((item) => [item?.message, item?.response, item?.code]) || []),
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  return [
    "all recipients were rejected",
    "recipient address rejected",
    "mailbox does not exist",
    "mailbox unavailable",
    "user unknown",
    "no such user",
    "invalid recipient",
    "recipient rejected",
    "unknown user",
    "550 5.1.1",
    "550 5.4.6",
  ].some((pattern) => haystack.includes(pattern));
}

function stripWrappingQuotes(value: string) {
  return value.replace(/^["']+|["']+$/g, "").trim();
}

function getSmtpUserEmail() {
  return process.env.SMTP_USER?.trim() || "";
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = getSmtpUserEmail();
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getPublicContactEmail() {
  return process.env.CONTACT_EMAIL?.trim() || "contact@cvsolucion.com";
}

function getSenderDisplayName() {
  const raw = process.env.SMTP_FROM?.trim();
  if (!raw) {
    return "CVsolucion";
  }

  const bracketMatch = raw.match(/^(.*)<[^>]+>\s*$/);
  if (bracketMatch?.[1]) {
    const name = stripWrappingQuotes(bracketMatch[1]);
    if (name) {
      return name;
    }
  }

  if (!raw.includes("@")) {
    const name = stripWrappingQuotes(raw);
    if (name) {
      return name;
    }
  }

  return "CVsolucion";
}

function getVerifiedFromAddress() {
  const smtpUser = getSmtpUserEmail();
  if (!smtpUser) {
    return `CVsolucion <${getPublicContactEmail()}>`;
  }

  return `${getSenderDisplayName()} <${smtpUser}>`;
}

export async function sendAuthEmail(options: MailOptions) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[auth-email:dev-fallback]", {
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return;
  }

  const from = getVerifiedFromAddress();
  const replyTo = getPublicContactEmail();
  try {
    const info = await transporter.sendMail({
      from,
      replyTo,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("[auth-email:sent]", {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    console.error("[auth-email:error]", {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.stack || error.message : String(error),
    });
    if (isRecipientMailboxRejected(error)) {
      throw new RecipientEmailRejectedError();
    }
    throw error;
  }
}
