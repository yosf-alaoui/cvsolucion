import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
  vi.resetModules();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-invoices-"));
  process.env.APP_DATA_DIR = tempDir;
  delete process.env.APP_STORAGE_DRIVER;
});

afterEach(async () => {
  const { closeDocumentDatabase } = await import("./documentDatabase");
  closeDocumentDatabase();
  delete process.env.APP_DATA_DIR;
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

async function createDraft() {
  const store = await import("./invoiceStore");
  const invoice = store.createInvoiceRequest({
    userId: "user-1",
    email: "customer@example.com",
    customerType: "individual",
    customerName: "Test Customer",
    country: "Canada",
    billingAddress: "123 Test Street",
    serviceDescription: "Cabinet Vision support",
  });
  return { store, invoice };
}

describe("invoice accounting invariants", () => {
  it("derives line amounts, subtotal, tax, and total on the server", async () => {
    const { store, invoice } = await createDraft();
    const issued = store.issueInvoiceByAdmin({
      invoiceId: invoice.id,
      currency: "cad",
      subtotalAmount: 30_000,
      taxRate: 5,
      taxAmount: 1_500,
      lineItems: [
        {
          id: "line-1",
          description: "Consulting session",
          quantity: 2,
          unitAmount: 15_000,
          amount: 30_000,
        },
      ],
    });

    expect(issued).toMatchObject({
      status: "issued",
      subtotalAmount: 30_000,
      taxAmount: 1_500,
      totalAmount: 31_500,
    });
  });

  it("rejects client totals that disagree with the line calculation", async () => {
    const { store, invoice } = await createDraft();

    expect(() =>
      store.updateInvoiceByAdmin({
        invoiceId: invoice.id,
        subtotalAmount: 99,
        lineItems: [
          {
            id: "line-1",
            description: "Consulting session",
            quantity: 2,
            unitAmount: 15_000,
            amount: 30_000,
          },
        ],
      }),
    ).toThrow(/subtotal/);

    expect(() =>
      store.updateInvoiceByAdmin({
        invoiceId: invoice.id,
        subtotalAmount: 30_000,
        lineItems: [
          {
            id: "line-1",
            description: "Consulting session",
            quantity: 2,
            unitAmount: 15_000,
            amount: 29_999,
          },
        ],
      }),
    ).toThrow(/quantity multiplied/);
  });

  it("keeps an issued invoice immutable", async () => {
    const { store, invoice } = await createDraft();
    const issued = store.issueInvoiceByAdmin({
      invoiceId: invoice.id,
      subtotalAmount: 10_000,
      lineItems: [
        {
          id: "line-1",
          description: "Support",
          quantity: 1,
          unitAmount: 10_000,
          amount: 10_000,
        },
      ],
    });

    expect(() =>
      store.updateInvoiceByAdmin({
        invoiceId: invoice.id,
        customerName: "Changed Customer",
      }),
    ).toThrow(/immutable/);
    expect(store.getInvoiceById(invoice.id)).toMatchObject({
      invoiceNumber: issued.invoiceNumber,
      customerName: "Test Customer",
      totalAmount: 10_000,
    });
  });
});
