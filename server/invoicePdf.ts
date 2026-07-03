import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import type { InvoiceRecord } from "./invoiceStore";

function resolveLogoPath() {
  const candidates = [
    path.resolve(process.cwd(), "client", "public", "logo.png"),
    path.resolve(process.cwd(), "dist", "public", "logo.png"),
    path.resolve(process.cwd(), "public", "logo.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

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

function invoicePaymentReferenceLines(invoice: InvoiceRecord) {
  const references = [
    invoice.paymentReference,
    ...(Array.isArray(invoice.paymentReferences) ? invoice.paymentReferences : []),
  ]
    .filter(Boolean)
    .filter((reference, index, all) => all.indexOf(reference) === index);

  if (!references.length) return [];
  if (references.length === 1) return [`Payment reference: ${references[0]}`];
  return ["Payment references:", ...references.map((reference) => `- ${reference}`)];
}

function paymentTermsLabel(value: string | null) {
  if (!value) return null;
  const terms = value.replace(/^payment terms:\s*/i, "").trim();
  return terms ? `Payment terms: ${terms}` : null;
}

function visibleLines(lines: Array<string | null>) {
  return lines.filter(Boolean) as string[];
}

function measureLines(doc: PDFKit.PDFDocument, lines: Array<string | null>, width: number, gap = 2) {
  return visibleLines(lines).reduce((height, line) => {
    return height + doc.heightOfString(line, { width }) + gap;
  }, 0);
}

function writeLines(doc: PDFKit.PDFDocument, lines: Array<string | null>, x: number, y: number, width: number, gap = 2) {
  let cursor = y;
  for (const line of visibleLines(lines)) {
    doc.text(line, x, cursor, { width });
    cursor += doc.heightOfString(line, { width }) + gap;
  }
  return cursor;
}

function ensurePageSpace(doc: PDFKit.PDFDocument, y: number, neededHeight: number, top = 52, bottom = 800) {
  if (y + neededHeight <= bottom) return y;
  doc.addPage();
  return top;
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

    doc.rect(0, 0, pageWidth, 104).fill("#f8fafc");
    const logoPath = resolveLogoPath();
    if (logoPath) {
      doc.image(logoPath, left, 30, { width: 126 });
    } else {
      doc.fillColor(blue).font("Helvetica-Bold").fontSize(22).text(invoice.sellerName || "CVsolucion", left, 34);
    }
    doc.fillColor(muted).font("Helvetica").fontSize(8.5).text("Cabinet Vision consulting, training, and support", left, 70);
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(28).text("INVOICE", 370, 30, { width: 180, align: "right" });
    doc.fillColor(muted).font("Helvetica").fontSize(9.5).text(invoiceDisplayNumber(invoice), 370, 64, { width: 180, align: "right" });

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(9.5);
    doc.text("Invoice details", left, 124);
    doc.font("Helvetica").fillColor("#334155").fontSize(9.3);
    const detailLines = [
      `Invoice number: ${invoiceDisplayNumber(invoice)}`,
      `Issue date: ${formatDate(invoice.issuedAt)}`,
      invoice.dueDate ? `Due date: ${formatDate(invoice.dueDate)}` : null,
      paymentTermsLabel(invoice.paymentTerms),
      ...invoicePaymentReferenceLines(invoice),
    ];
    const detailsEnd = writeLines(
      doc,
      detailLines,
      left,
      142,
      230,
    );

    doc.fillColor(dark).font("Helvetica-Bold").fontSize(9.5).text("Seller", 320, 124);
    doc.font("Helvetica").fillColor("#334155").fontSize(9.3);
    const sellerLines = [
      invoice.sellerName,
      invoice.sellerAddress,
      invoice.sellerEmail,
      invoice.sellerPhone,
      invoice.sellerWebsite,
      invoice.sellerTaxId ? `Tax ID: ${invoice.sellerTaxId}` : null,
    ];
    const sellerEnd = writeLines(
      doc,
      sellerLines,
      320,
      142,
      230,
    );

    const billLines = [
      invoice.company && invoice.customerType === "company" ? invoice.company : invoice.customerName,
      invoice.customerType === "company" && invoice.customerName ? `Contact: ${invoice.customerName}` : null,
      invoice.billingAddress,
      [invoice.city, invoice.region, invoice.postalCode].filter(Boolean).join(", "),
      invoice.country,
      invoice.email,
      invoice.phone,
      invoice.taxId ? `Tax/VAT ID: ${invoice.taxId}` : null,
    ];
    doc.font("Helvetica").fillColor("#334155").fontSize(9.3);
    const billTextWidth = right - left - 32;
    const billTop = Math.max(detailsEnd, sellerEnd, 224) + 18;
    const billTextHeight = measureLines(doc, billLines, billTextWidth);
    const billHeight = Math.max(104, billTextHeight + 44);
    doc.roundedRect(left, billTop, right - left, billHeight, 8).fillAndStroke(fill, line);
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(9.5).text("Bill to", left + 16, billTop + 14);
    doc.font("Helvetica").fillColor("#334155").fontSize(9.3);
    writeLines(
      doc,
      billLines,
      left + 16,
      billTop + 34,
      billTextWidth,
    );

    const drawTableHeader = (y: number) => {
      doc.fillColor(dark).font("Helvetica-Bold").fontSize(9.8);
      doc.text("Description", left, y);
      doc.text("Qty", 330, y, { width: 44, align: "right" });
      doc.text("Unit price", 390, y, { width: 70, align: "right" });
      doc.text("Amount", 480, y, { width: 70, align: "right" });
      doc.moveTo(left, y + 16).lineTo(right, y + 16).strokeColor(line).stroke();
      return y + 28;
    };

    let tableTop = billTop + billHeight + 26;
    tableTop = ensurePageSpace(doc, tableTop, 72);
    let cursor = drawTableHeader(tableTop);
    doc.font("Helvetica").fillColor("#334155").fontSize(9.5);
    for (const item of invoice.lineItems) {
      const rowHeight = Math.max(18, doc.heightOfString(item.description, { width: 260 }) + 6);
      cursor = ensurePageSpace(doc, cursor, rowHeight + 10);
      if (cursor === 52) {
        cursor = drawTableHeader(cursor);
        doc.font("Helvetica").fillColor("#334155").fontSize(9.5);
      }
      doc.text(item.description, left, cursor, { width: 260 });
      doc.text(String(item.quantity), 330, cursor, { width: 44, align: "right" });
      doc.text(formatMoney(item.unitAmount, invoice.currency), 390, cursor, { width: 70, align: "right" });
      doc.text(formatMoney(item.amount, invoice.currency), 480, cursor, { width: 70, align: "right" });
      cursor += rowHeight;
    }

    cursor = ensurePageSpace(doc, cursor, 104);
    doc.moveTo(left, cursor + 2).lineTo(right, cursor + 2).strokeColor(line).stroke();
    const totalsTop = cursor + 18;
    doc.font("Helvetica").fillColor("#334155").fontSize(9.5);
    doc.text("Subtotal", 360, totalsTop, { width: 100, align: "right" });
    doc.text(formatMoney(invoice.subtotalAmount, invoice.currency), 480, totalsTop, { width: 70, align: "right" });
    doc.text(invoice.taxLabel || "Tax", 360, totalsTop + 22, { width: 100, align: "right" });
    doc.text(formatMoney(invoice.taxAmount, invoice.currency), 480, totalsTop + 22, { width: 70, align: "right" });

    doc.roundedRect(350, totalsTop + 48, 204, 40, 8).fillAndStroke("#eff6ff", "#bfdbfe");
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(12.5).text("Total", 366, totalsTop + 61, { width: 80, align: "right" });
    doc.text(formatMoney(invoice.totalAmount, invoice.currency), 454, totalsTop + 61, { width: 84, align: "right" });

    const noteLines = [
      invoice.notes || "Thank you for your business.",
      "This invoice is issued in English for professional digital services. Please keep it for your accounting records.",
    ];
    let noteTop = totalsTop + 102;
    noteTop = ensurePageSpace(doc, noteTop, measureLines(doc, noteLines, right - left, 8) + 16);
    doc.fillColor(muted).font("Helvetica").fontSize(8.5);
    writeLines(doc, noteLines, left, noteTop, right - left, 8);

    doc.end();
  });
}
