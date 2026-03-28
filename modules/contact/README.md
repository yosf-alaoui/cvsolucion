# Contact Module

Reusable contact and lead-capture module for service businesses.

## Current implementation
- Server source: `server/contactStore.ts`, `server/index.ts`
- Client source: `client/src/lib/contact.ts`, `client/src/components/ContactSection.tsx`

## Reusable entrypoints
- `contracts.ts`: lead and submission payload types
- `client.ts`: contact form submitter
- `server.ts`: generic lead store wrapper
- `env.ts`: optional routing/notification variables

## Usage
```ts
import { createContactModuleClient } from "../modules/contact/client";

const contact = createContactModuleClient({ baseUrl: "https://example.com" });
await contact.submitLead({
  name: "Youssef",
  email: "y@example.com",
  message: "We need Cabinet Vision support.",
});
```
