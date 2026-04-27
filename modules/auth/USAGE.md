# auth usage

## Use when

You need signup, login, logout, current user, and password reset with minimal setup.

## Main entrypoints

- `createAuthModuleClient({ baseUrl? })`
- `validateAuthLoginPayload(payload)`
- `validateAuthSignupPayload(payload)`
- `createAuthSessionCookieOptions(options?)`

## What you provide

- `email`, `password`
- `locale` for signup/reset flows
- optional custom cookie name if your new app needs one

## Example

```ts
const auth = createAuthModuleClient({ baseUrl: apiBase });
await auth.login({ email, password });
```
