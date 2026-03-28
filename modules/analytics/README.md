# Analytics Module

Reusable analytics stack with:
- first-party visitor tracking
- GTM / GA4 browser hooks
- GA4 reporting snapshots for dashboards

## Current implementation
- Browser tracker: `client/src/components/Analytics.tsx`
- GA4 reporting: `server/ga4Reporting.ts`
- visitor storage: `server/visitorStore.ts`

## Reusable entrypoints
- `contracts.ts`
- `client.ts`
- `server.ts`
- `env.ts`

## Notes
- Keep browser analytics and reporting separated.
- The client module tracks events; the server module reads GA4.
- First-party visitor tracking is still useful even if GA4 is blocked.
