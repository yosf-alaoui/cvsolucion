import PDFDocument from "pdfkit";
import type { InvoiceRecord } from "./invoiceStore";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(value));
}

function invoiceDisplayNumber(invoice: InvoiceRecord) {
  return invoice.invoiceNumber || "DRAFT";
}

function writeLines(doc: PDFKit.PDFDocument, lines: Array<string | null>, x: number, y: number, width: number) {
  let cursor = y;
  for (const line of lines.filter(Boolean) as string[]) {
    doc.text(line, x, cursor, { width });
    cursor += 15;
  }
  return cursor;
}

export function buildInvoiceFilename(invoice: InvoiceRecord) {
  return `${invoiceDisplayNumber(invoice).toLowerCase()}.pdf`;
}

export function renderInvoicePdf(invoice: InvoiceRecord) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = `Invoice ${invoiceDisplayNumber(invoice)}`;
    doc.info.Author = invoice.sellerName || "CVsolucion";
    doc.info.Subject = "Professional service invoice";

    const pageWidth = doc.page.width;
    const left = 42;
    const right = pageWidth - 42;
    const dark = "#0f172a";
    const muted = "#64748b";
    const line = "#d8dee8";
    const fill = "#f8fafc";
    const blue = "#1e3a8a";

    doc.rect(0, 0, pageWidth, 116).fill("#f8fafc");
    doc.fillColor(blue).font("Helvetica-Bold").fontSize(22).text(invoice.sellerName || "CVsolucion", left, 38);
    doc.fillColor(muted).font("Helvetica").fontSize(9).text("Cabinet Vision consulting, training, and support", left, 66);
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(30).text("INVOICE", 370, 34, { width: 180, align: "right" });
    doc.fillColor(muted).font("Helvetica").fontSize(10).text(invoiceDisplayNumber(invoice), 370, 70, { width: 180, align: "right" });

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(10);
    doc.text("Invoice details", left, 140);
    doc.font("Helvetica").fillColor("#334155").fontSize(10);
    writeLines(
      doc,
      [
        `Invoice number: ${invoiceDisplayNumber(invoice)}`,
        `Issue date: ${formatDate(invoice.issuedAt)}`,
        invoice.dueDate ? `Due date: ${formatDate(invoice.dueDate)}` : null,
        invoice.paymentTerms ? `Payment terms: ${invoice.paymentTerms}` : null,
        invoice.paymentReference ? `Payment reference: ${invoice.paymentReference}` : null,
      ],
      left,
      160,
      230,
    );

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(10).text("Seller", 320, 140);
    doc.font("Helvetica").fillColor("#334155").fontSize(10);
    writeLines(
      doc,
      [
        invoice.sellerName,
        invoice.sellerAddress,
        invoice.sellerEmail,
        invoice.sellerPhone,
        invoice.sellerWebsite,
        invoice.sellerTaxId ? `Tax ID: ${invoice.sellerTaxId}` : null,
      ],
      320,
      160,
      230,
    );

    doc.roundedRect(left, 270, right - left, 112, 8).fillAndStroke(fill, line);
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(10).text("Bill to", left + 16, 288);
    doc.font("Helvetica").fillColor("#334155").fontSize(10);
    writeLines(
      doc,
      [
        invoice.company && invoice.customerType === "company" ? invoice.company : invoice.customerName,
        invoice.customerType === "company" && invoice.customerName ? `Contact: ${invoice.customerName}` : null,
        invoice.billingAddress,
        [invoice.city, invoice.region, invoice.postalCode].filter(Boolean).join(", "),
        invoice.country,
        invoice.email,
        invoice.phone,
        invoice.taxId ? `Tax/VAT ID: ${invoice.taxId}` : null,
      ],
      left + 16,
      308,
      right - left - 32,
    );

    const tableTop = 430;
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(10);
    doc.text("Description", left, tableTop);
    doc.text("Qty", 330, tableTop, { width: 44, align: "right" });
    doc.text("Unit price", 390, tableTop, { width: 70, align: "right" });
    doc.text("Amount", 480, tableTop, { width: 70, align: "right" });
    doc.moveTo(left, tableTop + 20).lineTo(right, tableTop + 20).strokeColor(line).stroke();

    let cursor = tableTop + 38;
    doc.font("Helvetica").fillColor("#334155").fontSize(10);
    for (const item of invoice.lineItems) {
      doc.text(item.description, left, cursor, { width: 260 });
      doc.text(String(item.quantity), 330, cursor, { width: 44, align: "right" });
      doc.text(formatMoney(item.unitAmount, invoice.currency), 390, cursor, { width: 70, align: "right" });
      doc.text(formatMoney(item.amount, invoice.currency), 480, cursor, { width: 70, align: "right" });
      cursor += Math.max(24, doc.heightOfString(item.description, { width: 260 }) + 10);
    }

    doc.moveTo(left, cursor + 4).lineTo(right, cursor + 4).strokeColor(line).stroke();
    const totalsTop = cursor + 24;
    doc.font("Helvetica").fillColor("#334155").fontSize(10);
    doc.text("Subtotal", 360, totalsTop, { width: 100, align: "right" });
    doc.text(formatMoney(invoice.subtotalAmount, invoice.currency), 480, totalsTop, { width: 70, align: "right" });
    doc.text(invoice.taxLabel || "Tax", 360, totalsTop + 22, { width: 100, align: "right" });
    doc.text(formatMoney(invoice.taxAmount, invoice.currency), 480, totalsTop + 22, { width: 70, align: "right" });

    doc.roundedRect(350, totalsTop + 52, 204, 44, 8).fillAndStroke("#eff6ff", "#bfdbfe");
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(13).text("Total", 366, totalsTop + 66, { width: 80, align: "right" });
    doc.text(formatMoney(invoice.totalAmount, invoice.currency), 454, totalsTop + 66, { width: 84, align: "right" });

    const noteTop = Math.max(totalsTop + 130, 675);
    doc.fillColor(muted).font("Helvetica").fontSize(9);
    doc.text(invoice.notes || "Thank you for your business.", left, noteTop, { width: right - left });
    doc.text(
      "This invoice is issued in English for professional digital services. Please keep it for your accounting records.",
      left,
      noteTop + 34,
      { width: right - left },
    );

    doc.end();
  });
}
