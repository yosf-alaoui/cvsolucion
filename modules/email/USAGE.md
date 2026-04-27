# email usage

## Use when

You need SMTP email for auth, booking, invoices, or contact flows.

## Main entrypoints

- `createEmailModule(config | null)`

## What you provide

- SMTP host, port, user, pass, from
- or `null` to run in safe fallback mode during local development

## Example

```ts
const email = createEmailModule(config);
await email.send({ to, subject, text });
```
