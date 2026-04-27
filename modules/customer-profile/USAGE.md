# customer-profile usage

## Use when

You want profile autofill for dashboard and checkout.

## Main entrypoints

- `createCustomerProfileModuleClient({ baseUrl? })`
- `createCustomerProfileStore({ load, save })`

## What you provide

- `userId` and `email`
- optional `name`, `country`, `phone`, `company`

## Example

```ts
const profiles = createCustomerProfileStore(storage);
await profiles.upsertProfile({ userId, email, country });
```
