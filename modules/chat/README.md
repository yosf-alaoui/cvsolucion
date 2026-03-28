# Chat Module

Reusable AI-assisted support chat with:
- OpenAI replies
- session continuity
- support intake handoff
- lead capture

## Current implementation
- Assistant logic: `server/chatAssistant.ts`
- persistence: `server/chatStore.ts`
- widget UI: `client/src/components/ChatWidget.tsx`

## Reusable entrypoints
- `contracts.ts`
- `client.ts`
- `env.ts`

## Usage
```ts
import { createChatModuleClient } from "../modules/chat/client";

const chat = createChatModuleClient({ baseUrl: "https://example.com" });
const session = await chat.openSession({ locale: "en", path: "/" });
await chat.sendMessage({
  conversationId: session.conversation.id,
  locale: "en",
  path: "/",
  message: "I need Cabinet Vision support",
});
```

## Notes
- Keep the prompt in OpenAI if you want centralized behavior control.
- The UI should treat `supportFormRequired` as a hard handoff state.

