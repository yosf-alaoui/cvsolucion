import { useEffect, useMemo, useState } from "react";
import { CheckSquare2, Download, FileCheck2, GitMerge, ReceiptText, Save, Square } from "lucide-react";
import { toast } from "sonner";
import {
  issueAdminInvoice,
  mergeAdminInvoices,
  updateAdminInvoice,
  type AdminDashboardInvoice,
  type AdminDashboardInvoiceLineItem,
} from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type InvoiceLineForm = {
  id: string;
  description: string;
  quantity: string;
  unitAmount: string;
};

type InvoiceForm = {
  customerType: "individual" | "company";
  customerName: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  company: string;
  billingAddress: string;
  city: string;
  region: string;
  postalCode: string;
  taxId: string;
  serviceDescription: string;
  notes: string;
  adminNotes: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerAddress: string;
  sellerTaxId: string;
  sellerWebsite: string;
  paymentTerms: string;
  dueDate: string;
  currency: string;
  taxLabel: string;
  taxAmount: string;
  taxRate: string;
  lineItems: InvoiceLineForm[];
};

const DEFAULT_SELLER = {
  name: "Namdaja Service CVsolucion",
  email: "contact@cvsolucion.com",
  phone: "+1 514 963 8719",
  address: "377 Rue st pierre Rimouski, QC Canada",
  taxId: "Not registered for GST/QST",
  website: "https://cvsolucion.com",
};

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: (currency || "cad").toUpperCase(),
  }).format(amount / 100);
}

function centsToDecimal(amount: number) {
  return (Math.max(0, Math.round(amount || 0)) / 100).toFixed(2);
}

function parseMoney(value: string) {
  const amount = Number(String(value || "").replace(",", "."));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function parseQuantity(value: string) {
  const quantity = Number(String(value || "").replace(",", "."));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function lineToForm(line: AdminDashboardInvoiceLineItem): InvoiceLineForm {
  return {
    id: line.id,
    description: line.description,
    quantity: String(line.quantity || 1),
    unitAmount: centsToDecimal(line.unitAmount || line.amount),
  };
}

function invoiceToForm(invoice: AdminDashboardInvoice): InvoiceForm {
  const fallbackLine = {
    id: `line_${invoice.id}`,
    description: invoice.serviceDescription || "Professional Cabinet Vision services",
    quantity: "1",
    unitAmount: centsToDecimal(invoice.subtotalAmount),
  };

  return {
    customerType: invoice.customerType,
    customerName: invoice.customerName || "",
    email: invoice.email || "",
    phone: invoice.phone || "",
    country: invoice.country || "",
    countryCode: invoice.countryCode || "",
    company: invoice.company || "",
    billingAddress: invoice.billingAddress || "",
    city: invoice.city || "",
    region: invoice.region || "",
    postalCode: invoice.postalCode || "",
    taxId: invoice.taxId || "",
    serviceDescription: invoice.serviceDescription || "",
    notes: invoice.notes || "",
    adminNotes: invoice.adminNotes || "",
    sellerName: invoice.sellerName && invoice.sellerName !== "CVsolucion" ? invoice.sellerName : DEFAULT_SELLER.name,
    sellerEmail: invoice.sellerEmail || DEFAULT_SELLER.email,
    sellerPhone: invoice.sellerPhone || DEFAULT_SELLER.phone,
    sellerAddress: invoice.sellerAddress || DEFAULT_SELLER.address,
    sellerTaxId: invoice.sellerTaxId || DEFAULT_SELLER.taxId,
    sellerWebsite: invoice.sellerWebsite || DEFAULT_SELLER.website,
    paymentTerms: invoice.paymentTerms || "Due on receipt",
    dueDate: invoice.dueDate || "",
    currency: (invoice.currency || "cad").toUpperCase(),
    taxLabel: invoice.taxLabel || "Tax",
    taxAmount: centsToDecimal(invoice.taxAmount),
    taxRate: invoice.taxRate === null || typeof invoice.taxRate === "undefined" ? "" : String(invoice.taxRate),
    lineItems: invoice.lineItems.length ? invoice.lineItems.map(lineToForm) : [fallbackLine],
  };
}

function buildPayload(form: InvoiceForm) {
  const lineItems = form.lineItems
    .map((line) => {
      const quantity = parseQuantity(line.quantity);
      const unitAmount = parseMoney(line.unitAmount);
      const amount = Math.round(quantity * unitAmount);
      return {
        id: line.id,
        description: line.description.trim(),
        quantity,
        unitAmount,
        amount,
      };
    })
    .filter((line) => line.description && line.amount > 0);
  const subtotalAmount = lineItems.reduce((sum, line) => sum + line.amount, 0);
  const taxAmount = parseMoney(form.taxAmount);
  const taxRate = form.taxRate.trim() ? Number(form.taxRate.replace(",", ".")) : null;

  return {
    customerType: form.customerType,
    customerName: form.customerName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim() || null,
    country: form.country.trim(),
    countryCode: form.countryCode.trim().toUpperCase() || null,
    company: form.customerType === "company" ? form.company.trim() || null : null,
    billingAddress: form.billingAddress.trim(),
    city: form.city.trim() || null,
    region: form.region.trim() || null,
    postalCode: form.postalCode.trim() || null,
    taxId: form.taxId.trim() || null,
    serviceDescription: form.serviceDescription.trim(),
    notes: form.notes.trim() || null,
    adminNotes: form.adminNotes.trim() || null,
    sellerName: form.sellerName.trim(),
    sellerEmail: form.sellerEmail.trim() || null,
    sellerPhone: form.sellerPhone.trim() || null,
    sellerAddress: form.sellerAddress.trim() || null,
    sellerTaxId: form.sellerTaxId.trim() || null,
    sellerWebsite: form.sellerWebsite.trim() || null,
    paymentTerms: form.paymentTerms.trim() || null,
    dueDate: form.dueDate || null,
    currency: form.currency.trim().toLowerCase() || "cad",
    subtotalAmount,
    taxAmount,
    taxLabel: form.taxLabel.trim() || null,
    taxRate: Number.isFinite(taxRate) ? taxRate : null,
    lineItems,
  };
}

export default function InvoicesManager({
  locale,
  invoices,
  onSave,
  onMerge,
}: {
  locale: string;
  invoices: AdminDashboardInvoice[];
  onSave: (invoice: AdminDashboardInvoice) => void;
  onMerge: (invoice: AdminDashboardInvoice, removedInvoiceIds: string[]) => void;
}) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [form, setForm] = useState<InvoiceForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) || invoices[0] || null,
    [invoices, selectedInvoiceId],
  );

  useEffect(() => {
    if (!selectedInvoice) {
      setSelectedInvoiceId(null);
      setForm(null);
      return;
    }
    if (selectedInvoice.id !== selectedInvoiceId) {
      setSelectedInvoiceId(selectedInvoice.id);
    }
    setForm(invoiceToForm(selectedInvoice));
  }, [selectedInvoice?.id]);

  useEffect(() => {
    const availableIds = new Set(invoices.map((invoice) => invoice.id));
    setMergeSelection((current) =>
      current.filter((invoiceId) => invoiceId !== selectedInvoiceId && availableIds.has(invoiceId)),
    );
  }, [invoices, selectedInvoiceId]);

  const mergeCandidates = useMemo(() => {
    if (!selectedInvoice) return [];
    return invoices.filter(
      (invoice) =>
        invoice.id !== selectedInvoice.id &&
        invoice.email.trim().toLowerCase() === selectedInvoice.email.trim().toLowerCase() &&
        invoice.currency.trim().toLowerCase() === selectedInvoice.currency.trim().toLowerCase(),
    );
  }, [invoices, selectedInvoice]);

  const selectedMergeInvoices = useMemo(
    () => invoices.filter((invoice) => mergeSelection.includes(invoice.id)),
    [invoices, mergeSelection],
  );

  const subtotalAmount = useMemo(
    () =>
      (form?.lineItems || []).reduce(
        (sum, line) => sum + Math.round(parseQuantity(line.quantity) * parseMoney(line.unitAmount)),
        0,
      ),
    [form?.lineItems],
  );
  const taxAmount = parseMoney(form?.taxAmount || "0");
  const totalAmount = subtotalAmount + taxAmount;

  const updateField = <Key extends keyof InvoiceForm>(key: Key, value: InvoiceForm[Key]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateLine = (index: number, patch: Partial<InvoiceLineForm>) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        lineItems: current.lineItems.map((line, lineIndex) =>
          lineIndex === index ? { ...line, ...patch } : line,
        ),
      };
    });
  };

  const addLine = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            lineItems: [
              ...current.lineItems,
              {
                id: `line_${Date.now().toString(36)}`,
                description: "",
                quantity: "1",
                unitAmount: "0.00",
              },
            ],
          }
        : current,
    );
  };

  const toggleMergeSelection = (invoiceId: string) => {
    setMergeSelection((current) =>
      current.includes(invoiceId)
        ? current.filter((item) => item !== invoiceId)
        : [...current, invoiceId],
    );
  };

  const removeLine = (index: number) => {
    setForm((current) => {
      if (!current || current.lineItems.length <= 1) return current;
      return {
        ...current,
        lineItems: current.lineItems.filter((_, lineIndex) => lineIndex !== index),
      };
    });
  };

  const saveInvoice = async (issue: boolean) => {
    if (!selectedInvoice || !form) return;
    if (!form.customerName.trim() || !form.email.trim() || !form.billingAddress.trim() || !form.country.trim()) {
      toast.error("Customer name, email, billing address, and country are required.");
      return;
    }
    if (!buildPayload(form).lineItems.length) {
      toast.error("Add at least one billable line item.");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload(form);
      const response = issue
        ? await issueAdminInvoice(selectedInvoice.id, payload)
        : await updateAdminInvoice(selectedInvoice.id, payload);
      onSave(response.invoice);
      setForm(invoiceToForm(response.invoice));
      toast.success(issue ? "Invoice issued and customer notified." : "Invoice saved.");
    } catch (error: any) {
      toast.error(error?.message || "Invoice update failed.");
    } finally {
      setSaving(false);
    }
  };

  const mergeSelectedInvoices = async () => {
    if (!selectedInvoice) return;
    const sourceInvoiceIds = selectedMergeInvoices.map((invoice) => invoice.id);
    if (!sourceInvoiceIds.length) {
      toast.error("Select at least one invoice to merge into the current invoice.");
      return;
    }

    try {
      setMerging(true);
      const response = await mergeAdminInvoices(selectedInvoice.id, sourceInvoiceIds);
      onMerge(response.invoice, response.removedInvoiceIds);
      setSelectedInvoiceId(response.invoice.id);
      setMergeSelection([]);
      setForm(invoiceToForm(response.invoice));
      toast.success("Invoices merged into one invoice.");
    } catch (error: any) {
      toast.error(error?.message || "Invoice merge failed.");
    } finally {
      setMerging(false);
    }
  };

  if (!invoices.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          No invoice requests yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Invoices
          </CardTitle>
          <div className="mt-3 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              disabled={!selectedInvoice || !mergeSelection.length || merging}
              onClick={() => void mergeSelectedInvoices()}
            >
              <GitMerge className="h-4 w-4" />
              Merge selected
            </Button>
            <p className="text-xs leading-5 text-slate-500">
              Current invoice is the target. Select matching invoices below to combine them into it.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[680px] pr-3">
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const isSelected = selectedInvoice?.id === invoice.id;
                const canMerge = mergeCandidates.some((candidate) => candidate.id === invoice.id);
                const isMergeSelected = mergeSelection.includes(invoice.id);
                return (
                  <div
                    key={invoice.id}
                    className={`rounded-xl border px-3 py-3 transition ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <button
                        type="button"
                        aria-label={isMergeSelected ? "Remove from merge" : "Select for merge"}
                        disabled={!canMerge || merging}
                        onClick={() => toggleMergeSelection(invoice.id)}
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                          isMergeSelected
                            ? "border-primary bg-primary text-white"
                            : canMerge
                              ? "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                              : "border-slate-100 bg-slate-50 text-slate-300"
                        }`}
                      >
                        {isMergeSelected ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          setForm(invoiceToForm(invoice));
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {invoice.invoiceNumber || invoice.customerName}
                            </div>
                            <div className="mt-1 truncate text-sm text-slate-500">{invoice.email}</div>
                          </div>
                          <Badge variant={invoice.status === "issued" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>{formatDate(invoice.requestedAt, locale)}</span>
                          <span className="font-semibold text-slate-800">
                            {formatMoney(invoice.totalAmount, invoice.currency, locale)}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{selectedInvoice?.invoiceNumber || "Invoice request"}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                <span>Requested {formatDate(selectedInvoice?.requestedAt || null, locale)}</span>
                <span>Updated {formatDate(selectedInvoice?.updatedAt || null, locale)}</span>
                {selectedInvoice?.issuedAt ? <span>Issued {formatDate(selectedInvoice.issuedAt, locale)}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedInvoice?.status === "issued" && selectedInvoice.downloadUrl ? (
                <Button type="button" variant="outline" asChild>
                  <a href={selectedInvoice.downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    PDF
                  </a>
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={saving || !form} onClick={() => void saveInvoice(false)}>
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button type="button" disabled={saving || !form} onClick={() => void saveInvoice(true)}>
                <FileCheck2 className="h-4 w-4" />
                Issue invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {form ? (
            <div className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-950">Customer billing details</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    These fields appear on the English PDF invoice.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-invoice-type">Customer type</Label>
                    <select
                      id="admin-invoice-type"
                      value={form.customerType}
                      onChange={(event) => updateField("customerType", event.target.value as "individual" | "company")}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <TextInput label="Customer name" value={form.customerName} onChange={(value) => updateField("customerName", value)} />
                  <TextInput label="Email" value={form.email} onChange={(value) => updateField("email", value)} />
                  <TextInput label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
                  <TextInput label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
                  <TextInput label="Country" value={form.country} onChange={(value) => updateField("country", value)} />
                  <TextInput label="Country code" value={form.countryCode} onChange={(value) => updateField("countryCode", value)} />
                  <TextInput label="Tax / VAT ID" value={form.taxId} onChange={(value) => updateField("taxId", value)} />
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="admin-invoice-address">Billing address</Label>
                    <Input
                      id="admin-invoice-address"
                      value={form.billingAddress}
                      onChange={(event) => updateField("billingAddress", event.target.value)}
                    />
                  </div>
                  <TextInput label="City" value={form.city} onChange={(value) => updateField("city", value)} />
                  <TextInput label="State / Province" value={form.region} onChange={(value) => updateField("region", value)} />
                  <TextInput label="Postal code" value={form.postalCode} onChange={(value) => updateField("postalCode", value)} />
                  <TextInput label="Service description" value={form.serviceDescription} onChange={(value) => updateField("serviceDescription", value)} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">Invoice items and totals</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Use cents-safe pricing. The PDF total is calculated from these lines plus tax.
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={addLine}>
                    Add line
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.lineItems.map((line, index) => (
                    <div key={line.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:grid-cols-[1fr_100px_140px_110px]">
                      <Input
                        value={line.description}
                        onChange={(event) => updateLine(index, { description: event.target.value })}
                        placeholder="Description"
                      />
                      <Input
                        value={line.quantity}
                        onChange={(event) => updateLine(index, { quantity: event.target.value })}
                        placeholder="Qty"
                      />
                      <Input
                        value={line.unitAmount}
                        onChange={(event) => updateLine(index, { unitAmount: event.target.value })}
                        placeholder="Unit price"
                      />
                      <Button type="button" variant="outline" onClick={() => removeLine(index)} disabled={form.lineItems.length <= 1}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <TextInput label="Currency" value={form.currency} onChange={(value) => updateField("currency", value)} />
                  <TextInput label="Tax label" value={form.taxLabel} onChange={(value) => updateField("taxLabel", value)} />
                  <TextInput label="Tax amount" value={form.taxAmount} onChange={(value) => updateField("taxAmount", value)} />
                  <TextInput label="Tax rate %" value={form.taxRate} onChange={(value) => updateField("taxRate", value)} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Stat label="Subtotal" value={formatMoney(subtotalAmount, form.currency, locale)} />
                  <Stat label="Tax" value={formatMoney(taxAmount, form.currency, locale)} />
                  <Stat label="Total" value={formatMoney(totalAmount, form.currency, locale)} />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-950">Seller and payment details</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Seller name" value={form.sellerName} onChange={(value) => updateField("sellerName", value)} />
                  <TextInput label="Seller email" value={form.sellerEmail} onChange={(value) => updateField("sellerEmail", value)} />
                  <TextInput label="Seller phone" value={form.sellerPhone} onChange={(value) => updateField("sellerPhone", value)} />
                  <TextInput label="Seller website" value={form.sellerWebsite} onChange={(value) => updateField("sellerWebsite", value)} />
                  <TextInput label="Seller tax ID" value={form.sellerTaxId} onChange={(value) => updateField("sellerTaxId", value)} />
                  <TextInput label="Payment terms" value={form.paymentTerms} onChange={(value) => updateField("paymentTerms", value)} />
                  <div className="space-y-2">
                    <Label htmlFor="admin-invoice-due-date">Due date</Label>
                    <Input
                      id="admin-invoice-due-date"
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => updateField("dueDate", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="admin-invoice-seller-address">Seller address</Label>
                    <Textarea
                      id="admin-invoice-seller-address"
                      value={form.sellerAddress}
                      onChange={(event) => updateField("sellerAddress", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="admin-invoice-notes">Customer notes</Label>
                    <Textarea
                      id="admin-invoice-notes"
                      value={form.notes}
                      onChange={(event) => updateField("notes", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="admin-invoice-admin-notes">Internal admin notes</Label>
                    <Textarea
                      id="admin-invoice-admin-notes"
                      value={form.adminNotes}
                      onChange={(event) => updateField("adminNotes", event.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `invoice-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}
