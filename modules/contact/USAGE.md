# contact usage

## Use when

You need a simple contact or lead form with storage.

## Main entrypoints

- `createContactModuleClient({ baseUrl? })`
- `createContactLeadStore({ load, save })`

## What you provide

- `name`, `email`, `message`
- optional `phone`, `company`, `interest`

## Example

```ts
const leads = createContactLeadStore(storage);
await leads.createLead({ name, email, message });
```
