import nodemailer from "nodemailer";
import type { EmailMessagePayload, EmailModuleConfig } from "./contracts";

export function createEmailModule(config: EmailModuleConfig | null) {
  const transporter =
    config &&
    nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

  return {
    isEnabled() {
      return Boolean(transporter);
    },
    async send(message: EmailMessagePayload) {
      if (!transporter || !config) {
        console.log("[email-module:dev-fallback]", {
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        return { delivered: false, mode: "fallback" as const };
      }

      const info = await transporter.sendMail({
        from: message.from || config.from || config.user,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      return {
        delivered: true,
        mode: "smtp" as const,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    },
  };
}

