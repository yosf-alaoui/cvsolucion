# Reusable Modules Workspace

This folder turns the main services of CVsolucion into reusable module kits that can be moved into future projects.

## Included modules

| Module | Purpose | Runtime |
| --- | --- | --- |
| `auth` | Signup, login, sessions, verification, password reset | client + server |
| `email` | SMTP transactional email delivery | server |
| `chat` | OpenAI-powered support chat and lead intake | client + server |
| `booking` | Booking calendar, checkout, Stripe payments, rescheduling, refunds | client + server |
| `dashboard` | Customer and admin operational dashboards | client + server |
| `analytics` | GTM/GA4 hooks, visitor tracking, GA4 reporting snapshots | client + server |
| `articles` | Multilingual articles, translation, admin CRUD, image upload flow | client + server |
| `seo` | Canonicals, hreflang, robots, sitemap, SSR fallback helpers | client + server |
| `contact` | Lead capture, storage, and submission adapters | client + server |
| `catalog` | Service packages, booking prices, and catalog administration | client + server |
| `payments` | Generic Stripe payment intents, config, webhook verification, refunds | client + server |
| `i18n` | Locale routing, translation lookup, and localized path helpers | client |
| `customer-profile` | Account profile storage and reusable profile APIs | client + server |
| `visitor-tracking` | First-party visitor telemetry, page views, and interaction logs | client + server |

## Folder contract

Each module contains:
- `README.md`: purpose, current file map, integration notes
- `contracts.ts`: portable request/response and domain types
- `client.ts` or `server.ts`: reusable adapter
- `env.ts`: environment variables and manifest

## Recommended reuse flow

1. Start with `modules/module-catalog.json` to pick the service you need.
2. Copy the target module folder into the new project.
3. Wire its `client.ts` or `server.ts` to your routing and storage.
4. Review the `currentProject` file map to see the working implementation in CVsolucion.
5. Add the environment variables listed in the module `env.ts`.

## Important design rule

These modules are intentionally split into:
- contracts
- adapters
- environment requirements
- implementation notes

That makes them easier to transplant into another codebase without dragging the whole site with them.

## Current project mapping

The live CVsolucion implementation remains in:
- `server/*`
- `client/src/lib/*`
- `client/src/pages/*`
- `client/src/components/*`

The `modules/` folder is the reusable extraction layer and documentation layer.
