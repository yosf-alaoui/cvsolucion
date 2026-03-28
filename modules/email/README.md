# Email Module

Reusable transactional email layer built around SMTP.

## Current implementation
- `server/authMailer.ts`
- mail templates from `server/authEmailTemplates.ts`

## Reusable entrypoints
- `contracts.ts`
- `server.ts`
- `env.ts`

## Usage
```ts
import { createEmailModule } from "../modules/email/server";

const email = createEmailModule({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 465),
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
  from: process.env.SMTP_FROM,
});

await email.send({
  to: "client@example.com",
  subject: "Booking confirmed",
  html: "<p>Your booking is confirmed.</p>",
  text: "Your booking is confirmed.",
});
```

## Notes
- In development, the module can fall back to console logging instead of failing hard.
- Keep template rendering outside the transport layer.

