# analytics usage

## Use when

You need client event tracking plus a server reader for GA4 dashboard numbers.

## Main entrypoints

- `createClientAnalyticsModule({ sendEvent, pushDataLayer? })`
- `createGa4ReportingModule({ propertyId, serviceAccount, cacheMs? })`

## What you provide

- a `sendEvent` function for your own API
- optional GTM `dataLayer` push
- GA4 property id and service account only on the server

## Example

```ts
const analytics = createClientAnalyticsModule({ sendEvent, pushDataLayer });
analytics.trackVirtualPageView({ path: "/", title: "Home", locale: "en", userStatus: "anonymous" });
```
