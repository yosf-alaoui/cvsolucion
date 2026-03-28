# Auth Module

Reusable email/password authentication kit with:
- signup
- login/logout
- session cookies
- email verification
- password reset

## Current implementation
- Server source: `server/authStore.ts`, `server/index.ts`
- Client source: `client/src/lib/auth.ts`, `client/src/contexts/AuthContext.tsx`

## Public API shape
- `GET /api/auth/me`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

## Reusable entrypoints
- `contracts.ts`: shared request/response types
- `client.ts`: portable fetch client creator
- `env.ts`: required and optional environment variables

## Usage
```ts
import { createAuthModuleClient } from "../modules/auth/client";

const auth = createAuthModuleClient({ baseUrl: "https://example.com" });
await auth.login({ email: "user@example.com", password: "secret123" });
```

## Notes
- This module is designed for session-cookie auth, not JWT-only auth.
- Email transport is delegated to the email module.
- Admin-only behavior should stay outside the core auth module.

