# CVsolucion

Production-focused Cabinet Vision consulting website with multilingual pages, custom authentication, gated pricing, training packages, and technical design/pricing service pages.

## Stack

- React 19
- Vite 7
- TypeScript
- Wouter
- Tailwind CSS
- Express
- Custom auth with server-side sessions
- Nodemailer for transactional auth emails

## Main Features

- Multilingual website: English, French, Arabic
- Service pages for Cabinet Vision support, training, and design/pricing
- Login, signup, email verification, magic link, password reset
- Pricing hidden until login and email confirmation
- WhatsApp-first contact flow
- Legal pages: privacy and terms
- Production build served through Express

## Routes

- `/`
- `/fr`
- `/ar`
- `/training`
- `/fr/training`
- `/ar/training`
- `/design-pricing`
- `/fr/design-pricing`
- `/ar/design-pricing`
- `/login`
- `/fr/login`
- `/ar/login`
- `/privacy`
- `/terms`

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app locally:

```bash
pnpm run dev
```

Type check:

```bash
pnpm run check
```

Production build:

```bash
pnpm run build
```

Preview:

```bash
pnpm run preview
```

## Environment Variables

Create a local `.env` file based on `.env.example`.

Required variables:

```env
APP_ORIGIN=http://localhost:3000
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Optional analytics variables:

```env
VITE_GA4_ID=
VITE_UMAMI_URL=
VITE_UMAMI_WEBSITE_ID=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Project Structure

```text
client/
  public/
  src/
    components/
    content/
    contexts/
    hooks/
    i18n/
    lib/
    pages/
server/
shared/
```

## Deployment Notes

- The app builds client assets into `dist/public`
- The Node server builds to `dist/index.js`
- In production, Express serves the built app and static assets
- Auth data is stored locally in `data/auth-db.json`
- Reverse proxy and CSP are expected to be handled by Nginx
- Keep `.env` only on the server and never commit secrets

## Repository Hygiene

Ignored by git:

- `node_modules/`
- `dist/`
- `.env`
- logs and temp files

## Current Status

- Local type check passes
- Local production build passes
- Git repository initialized and pushed to GitHub
