import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
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

  const from = process.env.SMTP_FROM?.trim() || `CVsolucion <${getPublicContactEmail()}>`;
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
    throw error;
  }
}
