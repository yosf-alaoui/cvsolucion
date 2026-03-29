import PDFDocument from "pdfkit";
import type { InvoiceRecord } from "./invoiceStore";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatBookingSlot(invoice: InvoiceRecord) {
  const dt = new Date(`${invoice.date}T${String(invoice.hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(dt);
}

export function buildInvoiceFilename(invoice: InvoiceRecord) {
  return `${invoice.invoiceNumber.toLowerCase()}.pdf`;
}

export function renderInvoicePdf(invoice: InvoiceRecord) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = `Invoice ${invoice.invoiceNumber}`;
    doc.info.Author = "CVsolucion";
    doc.info.Subject = "Service invoice";

    doc.font("Helvetica-Bold").fontSize(24).fillColor("#0f172a").text("CVsolucion Invoice");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("Cabinet Vision setup, support, and training");

    const rightTop = 360;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Invoice number", rightTop, 48);
    doc.font("Helvetica").fontSize(11).fillColor("#334155").text(invoice.invoiceNumber, rightTop, 64);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Issued", rightTop, 92);
    doc.font("Helvetica").fontSize(11).fillColor("#334155").text(new Date(invoice.issuedAt).toLocaleString("en-CA"), rightTop, 108);

    doc.moveDown(2.4);
    doc.roundedRect(48, 150, 240, 118, 14).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.roundedRect(308, 150, 240, 118, 14).fillAndStroke("#f8fafc", "#e2e8f0");

    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text("Bill to", 64, 168);
    doc.font("Helvetica").fontSize(11).fillColor("#334155");
    doc.text(invoice.name || "-", 64, 190);
    doc.text(invoice.email || "-", 64, 208);
    doc.text(invoice.phone || "-", 64, 226);
    if (invoice.company) {
      doc.text(invoice.company, 64, 244);
    }

    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text("Service details", 324, 168);
    doc.font("Helvetica").fontSize(11).fillColor("#334155");
    doc.text(`Service: ${invoice.serviceType === "support" ? "Support" : "Consultation"}`, 324, 190);
    doc.text(`Priority: ${invoice.priority === "express" ? "Express" : "Standard"}`, 324, 208);
    doc.text(`Appointment: ${formatBookingSlot(invoice)}`, 324, 226, { width: 200 });
    if (invoice.paymentReference) {
      doc.text(`Payment reference: ${invoice.paymentReference}`, 324, 252, { width: 200 });
    }

    const tableTop = 300;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
    doc.text("Description", 64, tableTop);
    doc.text("Amount", 470, tableTop, { width: 70, align: "right" });

    doc.moveTo(64, tableTop + 22).lineTo(540, tableTop + 22).strokeColor("#e2e8f0").stroke();
    doc.font("Helvetica").fontSize(11).fillColor("#334155");
    doc.text(
      `${invoice.serviceType === "support" ? "Support" : "Consultation"} · ${
        invoice.priority === "express" ? "Express" : "Standard"
      }`,
      64,
      tableTop + 38
    );
    doc.text(formatMoney(invoice.subtotalAmount, invoice.currency), 470, tableTop + 38, { width: 70, align: "right" });

    doc.moveTo(64, tableTop + 74).lineTo(540, tableTop + 74).strokeColor("#e2e8f0").stroke();

    const totalsTop = tableTop + 94;
    doc.font("Helvetica").fontSize(11).fillColor("#334155");
    doc.text("Subtotal", 380, totalsTop, { width: 90, align: "right" });
    doc.text(formatMoney(invoice.subtotalAmount, invoice.currency), 470, totalsTop, { width: 70, align: "right" });
    doc.text("Taxes", 380, totalsTop + 22, { width: 90, align: "right" });
    doc.text(formatMoney(invoice.taxAmount, invoice.currency), 470, totalsTop + 22, { width: 70, align: "right" });

    doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f172a");
    doc.text("Total", 380, totalsTop + 58, { width: 90, align: "right" });
    doc.text(formatMoney(invoice.totalAmount, invoice.currency), 452, totalsTop + 58, { width: 88, align: "right" });

    doc.font("Helvetica").fontSize(10).fillColor("#64748b");
    doc.text(
      "This invoice was generated automatically after the appointment passed. No shipping address is required for this digital service.",
      64,
      710,
      { width: 476, align: "left" }
    );

    doc.end();
  });
}
