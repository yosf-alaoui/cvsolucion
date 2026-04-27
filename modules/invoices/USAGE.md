# invoices usage

## Use when

You want invoice summaries after paid appointments and customer download links.

## Main entrypoints

- `createInvoicesModuleClient(baseUrl?)`

## What you provide

- a customer dashboard route that returns `invoices`
- invoice PDF generation on your server

## Example

```ts
const invoices = createInvoicesModuleClient(apiBase);
const list = await invoices.listCustomerInvoices();
```
