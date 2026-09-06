import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mailMocks = vi.hoisted(() => ({
  close: vi.fn(),
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mailMocks.createTransport,
  },
}));

import { AUTH_EMAIL_TIMEOUT_MS, sendAuthEmail } from "./authMailer";

describe("authentication email delivery", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMTP_HOST", "smtp.example.test");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "mailer@example.test");
    vi.stubEnv("SMTP_PASS", "test-password");
    mailMocks.createTransport.mockReturnValue({
      close: mailMocks.close,
      sendMail: mailMocks.sendMail,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses bounded SMTP connection and socket timeouts", async () => {
    mailMocks.sendMail.mockResolvedValue({
      accepted: ["admin@example.test"],
      rejected: [],
      messageId: "test-message",
      response: "queued",
    });

    await sendAuthEmail({
      to: "admin@example.test",
      subject: "Sign-in code",
      text: "Code: 123456",
      html: "<p>Code: 123456</p>",
    });

    expect(mailMocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 8_000,
        greetingTimeout: 5_000,
        socketTimeout: 10_000,
        dnsTimeout: 8_000,
      }),
    );
  });

  it("closes a stalled SMTP connection and rejects within the hard deadline", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mailMocks.sendMail.mockReturnValue(new Promise(() => {}));

    const delivery = sendAuthEmail({
      to: "admin@example.test",
      subject: "Sign-in code",
      text: "Code: 123456",
      html: "<p>Code: 123456</p>",
    });
    const rejection = expect(delivery).rejects.toThrow("SMTP send timed out.");

    await vi.advanceTimersByTimeAsync(AUTH_EMAIL_TIMEOUT_MS);
    await rejection;
    expect(mailMocks.close).toHaveBeenCalledOnce();
  });
});
