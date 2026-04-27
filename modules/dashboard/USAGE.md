# dashboard usage

## Use when

You need customer/admin dashboard APIs plus small summary helpers.

## Main entrypoints

- `createDashboardModuleClient({ baseUrl? })`
- `sortDashboardBookings(bookings)`
- `buildCustomerDashboardSummary({ bookings, invoices?, now? })`
- `buildAdminDashboardStats({ bookings, usersCount, leadsCount, visitorsCount, conversationsCount })`

## What you provide

- dashboard API routes
- bookings array
- basic counts from your own stores

## Example

```ts
const dashboard = createDashboardModuleClient({ baseUrl: apiBase });
const admin = await dashboard.getAdminDashboard();
```
