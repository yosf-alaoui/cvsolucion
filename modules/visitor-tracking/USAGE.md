# visitor-tracking usage

## Use when

You need first-party visitor sessions, page views, and interaction history.

## Main entrypoints

- `createVisitorTrackingModuleClient({ baseUrl?, visitPath?, interactionPath? })`
- `createVisitorTrackingStore({ load, save })`
- `createVisitorId()`

## What you provide

- your own visitor id cookie or local storage value
- current path, locale, referrer, user agent

## Example

```ts
const tracking = createVisitorTrackingStore(storage);
await tracking.trackVisit({ visitorId, path: "/", locale: "en" });
```
