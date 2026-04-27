# chat usage

## Use when

You need a support chat that can escalate to a lead form quickly.

## Main entrypoints

- `createChatModuleClient({ baseUrl? })`
- `buildChatSystemPrompt(basePrompt, options?)`
- `shouldRequireSupportIntake({ message, messageCount, alreadyRequired? })`
- `createChatConversationSeed({ locale, assistantName?, title? })`

## What you provide

- the base prompt
- locale and current path
- customer handoff fields only when needed

## Example

```ts
const chat = createChatModuleClient({ baseUrl: apiBase });
const session = await chat.openSession({ locale: "en", path: "/" });
```
