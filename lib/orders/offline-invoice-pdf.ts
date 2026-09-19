import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { promises as fs } from "fs";
import path from "path";
import type { InvoiceBusiness } from "@/lib/site-settings";

/**
 * Server-side PDF invoices for offline (POS) sales.
 *
 * Renders A4 tax-invoice style documents with jsPDF + autoTable using the same
 * Noto Sans fonts the browser-side PDFs use (loaded from `public/fonts`, which
 * works in the Node runtime). These buffers are attached to transactional
 * emails and streamed by the admin download endpoints.
 *
 * There are two documents:
 *   - the SALE invoice (`buildOfflineInvoicePdf`)
 *   - the EXCHANGE / replacement invoice (`buildExchangeInvoicePdf`), which
 *     shows the returned item, the issued item and how any value difference was
 *     settled (cash collected or held as store credit — never a cash refund).
 */

const FONT_FAMILY = "Noto Sans";
const PAGE_W = 210; // A4 portrait, mm
const MARGIN = 14;

const INK: [number, number, number] = [17, 24, 39];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const AMBER: [number, number, number] = [217, 119, 6];
const EMERALD: [number, number, number] = [5, 150, 105];
const ROSE: [number, number, number] = [190, 18, 60];

let cachedFonts: { regular: string; bold: string } | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const dir = path.join(process.cwd(), "public", "fonts");
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(dir, "NotoSans-Regular.ttf")),
    fs.readFile(path.join(dir, "NotoSans-Bold.ttf")),
  ]);
  cachedFonts = {
    regular: regular.toString("base64"),
    bold: bold.toString("base64"),
  };
  return cachedFonts;
}

async function createDoc(): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const fonts = await loadFonts();
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFont("NotoSans-Bold.ttf", FONT_FAMILY, "bold");
  doc.setFont(FONT_FAMILY, "normal");
  return doc;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const dateText = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const one = n % 10;
  return TENS[Math.floor(n / 10)] + (one ? ` ${ONES[one]}` : "");
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

function amountInWords(amount: number): string {
  let rupees = Math.floor(Math.abs(amount));
  let paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (paise === 100) {
    paise = 0;
    rupees += 1;
  }
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  const rupeesText = parts.join(" ") || "Zero";
  const paiseText = paise > 0 ? ` and ${twoDigits(paise)} Paise` : "";
  return `Rupees ${rupeesText}${paiseText} Only`;
}

async function tryLogoDataUrl(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const isPng = ct.includes("png");
    const isJpeg = ct.includes("jpeg") || ct.includes("jpg");
    if (!isPng && !isJpeg) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 3_000_000) return null;
    const mime = isPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

interface HeaderInput {
  business: InvoiceBusiness;
  docTitle: string;
  docNumber: string;
  metaLabel: string;
  metaValue: string;
  dateLabel?: string;
  dateValue?: string;
}

async function drawHeader(doc: jsPDF, input: HeaderInput): Promise<number> {
  const { business, docTitle, docNumber } = input;
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 38, "F");

  let leftTop = 13;

  const logo = await tryLogoDataUrl(business.logo);
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const maxW = 46;
      const maxH = 15;
      const ratio = props.width / props.height || 1;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      doc.addImage(logo, props.fileType, MARGIN, 8, w, h, undefined, "FAST");
      leftTop = 27;
    } catch {
      leftTop = 13;
    }
  }

  doc.setTextColor(245, 158, 11);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(logo ? 12 : 18);
  const nameY = logo ? 27.5 : 15;
  doc.text(business.name, MARGIN, nameY);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setTextColor(...SLATE_400);
  doc.setFontSize(7.6);
  let y = nameY + 5;
  if (business.gstin) {
    doc.text(`GSTIN: ${business.gstin}`, MARGIN, y);
    y += 3.6;
  }
  if (business.legalName) {
    doc.text(`Legal Name: ${business.legalName}`, MARGIN, y);
    y += 3.6;
  }
  if (business.phone) {
    doc.text(`Phone: ${business.phone}`, MARGIN, y);
    y += 3.6;
  }
  void leftTop;

  // Right side: title badge + reference.
  const rightX = PAGE_W - MARGIN;
  doc.setFillColor(245, 158, 11);
  const titleW = doc.getTextWidth(docTitle.toUpperCase()) + 10;
  doc.roundedRect(rightX - titleW, 8, titleW, 8, 1.4, 1.4, "F");
  doc.setTextColor(...INK);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.text(docTitle.toUpperCase(), rightX - titleW / 2, 13.4, {
    align: "center",
  });

  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE);
  doc.text(docNumber, rightX, 22.5, { align: "right" });
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_200);
  doc.text(`${input.metaLabel}: ${input.metaValue}`, rightX, 27.5, {
    align: "right",
  });
  if (input.dateValue) {
    doc.text(`${input.dateLabel ?? "Date"}: ${input.dateValue}`, rightX, 31.5, {
      align: "right",
    });
  }

  return 46;
}

interface CustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
}

function drawParties(
  doc: jsPDF,
  yStart: number,
  business: InvoiceBusiness,
  customer: CustomerInput,
  rightLines: { label: string; value: string }[],
): number {
  const colW = (PAGE_W - MARGIN * 2 - 6) / 2;
  const boxH = 30;
  const y = yStart;

  doc.setFillColor(...SLATE_50);
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, colW, boxH, 1.5, 1.5, "FD");
  doc.roundedRect(MARGIN + colW + 6, y, colW, boxH, 1.5, 1.5, "FD");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...AMBER);
  doc.text("BILLED TO", MARGIN + 4, y + 6);
  doc.text("STORE", MARGIN + colW + 10, y + 6);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(
    doc.splitTextToSize(customer.name || "Walk-in Customer", colW - 8),
    MARGIN + 4,
    y + 12,
  );

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...SLATE_700);
  let cy = y + 18;
  if (customer.phone) {
    doc.text(customer.phone, MARGIN + 4, cy);
    cy += 3.6;
  }
  if (customer.email) {
    doc.text(doc.splitTextToSize(customer.email, colW - 8), MARGIN + 4, cy);
    cy += 3.6;
  }
  if (customer.address) {
    doc.text(doc.splitTextToSize(customer.address, colW - 8), MARGIN + 4, cy);
  }

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...INK);
  doc.text(
    doc.splitTextToSize(business.name, colW - 8),
    MARGIN + colW + 10,
    y + 12,
  );
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...SLATE_700);
  let sy = y + 18;
  if (business.address) {
    doc.text(
      doc.splitTextToSize(business.address, colW - 8),
      MARGIN + colW + 10,
      sy,
    );
    sy += 3.6;
  }
  if (business.email) {
    doc.text(
      doc.splitTextToSize(business.email, colW - 8),
      MARGIN + colW + 10,
      sy,
    );
  }

  // Right meta panel sits under the parties when there is enough room; here we
  // fold the reference lines into a slim strip on the right of the "store" box.
  void rightLines;

  return y + boxH + 6;
}

function drawFooter(doc: jsPDF, business: InvoiceBusiness, thankYou = true) {
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - 20;
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...SLATE_500);
  if (business.notes) {
    doc.text(
      doc.splitTextToSize(business.notes, PAGE_W - MARGIN * 2),
      MARGIN,
      y + 4,
    );
  }
  if (thankYou) {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setTextColor(...SLATE_700);
    doc.text(
      `Thank you for shopping with ${business.name}.`,
      PAGE_W / 2,
      y + (business.notes ? 10 : 5),
      { align: "center" },
    );
  }
}

function autoTableEndY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function docToBuffer(doc: jsPDF): Buffer {
  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sale invoice
// ─────────────────────────────────────────────────────────────────────────────

export interface SaleInvoicePdfItem {
  productName: string;
  variant?: string | null;
  quantity: number;
  rateInclGst: number;
  gstPercent: number | null;
  gstAmount: number;
  amount: number;
}

export interface SaleInvoicePdfInput {
  business: InvoiceBusiness;
  orderNumber: string;
  createdAt: Date | string;
  paymentMethodLabel: string;
  customer: CustomerInput;
  items: SaleInvoicePdfItem[];
  subtotal: number;
  gst: number;
  loyaltyDiscount?: number | null;
  paidAmount?: number | null;
  dueAmount?: number | null;
  isPartial?: boolean;
  creditedAmount?: number | null;
  total: number;
  noReturnPolicy?: string | null;
  docTitle?: string;
}

export async function buildOfflineInvoicePdf(
  input: SaleInvoicePdfInput,
): Promise<Buffer> {
  const doc = await createDoc();
  const docTitle = input.docTitle ?? "Tax Invoice";

  let y = await drawHeader(doc, {
    business: input.business,
    docTitle,
    docNumber: `#${input.orderNumber}`,
    metaLabel: "Payment",
    metaValue: input.paymentMethodLabel || "—",
    dateLabel: "Date",
    dateValue: dateText(input.createdAt),
  });

  y = drawParties(doc, y, input.business, input.customer, []);

  const body = input.items.map((item, idx) => [
    String(idx + 1),
    item.variant ? `${item.productName}\n${item.variant}` : item.productName,
    String(item.quantity),
    money(item.rateInclGst),
    item.gstPercent != null ? `${item.gstPercent}%` : "—",
    money(item.amount),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      ["#", "Item Description", "Qty", "Rate (Incl. GST)", "GST", "Amount"],
    ],
    body,
    theme: "grid",
    styles: {
      font: FONT_FAMILY,
      fontSize: 8.4,
      cellPadding: 2.4,
      textColor: INK,
      lineColor: SLATE_200,
      lineWidth: 0.15,
      valign: "top",
    },
    headStyles: {
      fillColor: INK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.2,
    },
    alternateRowStyles: { fillColor: SLATE_50 },
    columnStyles: {
      0: {
        cellWidth: 8,
        halign: "center",
        textColor: SLATE_400,
        fontStyle: "bold",
      },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
  });

  y = autoTableEndY(doc) + 6;

  // Totals panel (right) + amount in words (left).
  const panelW = 78;
  const panelX = PAGE_W - MARGIN - panelW;

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...AMBER);
  doc.text("AMOUNT IN WORDS", MARGIN, y + 2);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...SLATE_700);
  doc.text(doc.splitTextToSize(amountInWords(input.total), 80), MARGIN, y + 7);

  const rows: {
    label: string;
    value: string;
    color: [number, number, number];
  }[] = [
    {
      label: "Subtotal (Excl. GST)",
      value: money(input.subtotal),
      color: SLATE_700,
    },
    { label: "Total GST", value: money(input.gst), color: SLATE_700 },
  ];
  if (input.loyaltyDiscount && input.loyaltyDiscount > 0) {
    rows.push({
      label: "Loyalty Reward",
      value: `-${money(input.loyaltyDiscount)}`,
      color: EMERALD,
    });
  }
  if (input.creditedAmount && input.creditedAmount > 0) {
    rows.push({
      label: "Store Credit Applied",
      value: `-${money(input.creditedAmount)}`,
      color: EMERALD,
    });
  }
  if (input.isPartial && input.paidAmount != null) {
    rows.push({
      label: "Amount Paid",
      value: money(input.paidAmount),
      color: EMERALD,
    });
    rows.push({
      label: "Due",
      value: money(input.dueAmount ?? 0),
      color: AMBER,
    });
  }

  let ry = y;
  doc.setFontSize(8.6);
  for (const r of rows) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setTextColor(...SLATE_500);
    doc.text(r.label, panelX, ry);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setTextColor(...r.color);
    doc.text(r.value, PAGE_W - MARGIN, ry, { align: "right" });
    ry += 5.2;
  }

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(253, 186, 116);
  doc.roundedRect(panelX - 4, ry - 1, panelW + 4, 11, 1.5, 1.5, "FD");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...AMBER);
  doc.text("Total Payable", panelX, ry + 6);
  doc.setTextColor(...INK);
  doc.text(money(input.total), PAGE_W - MARGIN, ry + 6, { align: "right" });
  ry += 14;

  if (input.isPartial && input.noReturnPolicy) {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    const note = doc.splitTextToSize(input.noReturnPolicy, panelW + 4 - 6);
    const noteH = note.length * 3.4 + 8;
    doc.roundedRect(panelX - 4, ry, panelW + 4, noteH, 1.5, 1.5, "FD");
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(...ROSE);
    doc.text("NO RETURNS / REFUND — DUE SALE", panelX, ry + 5);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7);
    doc.text(note, panelX, ry + 9);
  }

  drawFooter(doc, input.business);
  return docToBuffer(doc);
}

// ─────────────────────────────────────────────────────────────────────────────
// Exchange / replacement invoice
// ─────────────────────────────────────────────────────────────────────────────

export interface ExchangeInvoicePdfItem {
  returnedProductName: string;
  returnedVariant?: string | null;
  returnedUnitPriceIncl: number;
  issuedProductName: string;
  issuedVariant?: string | null;
  issuedUnitPriceIncl: number;
  quantity: number;
  differenceAmount: number;
}

export interface ExchangeInvoicePdfInput {
  business: InvoiceBusiness;
  exchangeNumber: string;
  originalOrderNumber: string;
  createdAt: Date | string;
  customer: CustomerInput;
  items: ExchangeInvoicePdfItem[];
  returnedValue: number;
  issuedValue: number;
  settlementType: "COLLECT" | "CREDIT" | "EVEN";
  settlementAmount: number;
  paymentMethodLabel?: string | null;
  notes?: string | null;
}

export async function buildExchangeInvoicePdf(
  input: ExchangeInvoicePdfInput,
): Promise<Buffer> {
  const doc = await createDoc();

  let y = await drawHeader(doc, {
    business: input.business,
    docTitle: "Exchange Invoice",
    docNumber: input.exchangeNumber,
    metaLabel: "Original Invoice",
    metaValue: `#${input.originalOrderNumber}`,
    dateLabel: "Date",
    dateValue: dateText(input.createdAt),
  });

  y = drawParties(doc, y, input.business, input.customer, []);

  const body = input.items.map((item, idx) => [
    String(idx + 1),
    item.returnedVariant
      ? `${item.returnedProductName}\n${item.returnedVariant}`
      : item.returnedProductName,
    item.issuedVariant
      ? `${item.issuedProductName}\n${item.issuedVariant}`
      : item.issuedProductName,
    String(item.quantity),
    money(item.returnedUnitPriceIncl),
    money(item.issuedUnitPriceIncl),
    money(item.differenceAmount),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "#",
        "Returned Item",
        "Issued Item",
        "Qty",
        "Returned Rate",
        "Issued Rate",
        "Difference",
      ],
    ],
    body,
    theme: "grid",
    styles: {
      font: FONT_FAMILY,
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: INK,
      lineColor: SLATE_200,
      lineWidth: 0.15,
      valign: "top",
    },
    headStyles: {
      fillColor: INK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.6,
    },
    alternateRowStyles: { fillColor: SLATE_50 },
    columnStyles: {
      0: {
        cellWidth: 7,
        halign: "center",
        textColor: SLATE_400,
        fontStyle: "bold",
      },
      3: { cellWidth: 11, halign: "center" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
  });

  y = autoTableEndY(doc) + 6;

  const panelW = 78;
  const panelX = PAGE_W - MARGIN - panelW;

  const settlementLabel =
    input.settlementType === "COLLECT"
      ? "Additional Amount Collected"
      : input.settlementType === "CREDIT"
        ? "Store Credit Issued"
        : "No Value Difference";
  const settlementColor =
    input.settlementType === "COLLECT"
      ? AMBER
      : input.settlementType === "CREDIT"
        ? EMERALD
        : SLATE_700;

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...AMBER);
  doc.text("EXCHANGE SUMMARY", MARGIN, y + 2);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.4);
  doc.setTextColor(...SLATE_700);
  const summary = [
    `Original invoice: #${input.originalOrderNumber}`,
    `Items returned value: ${money(input.returnedValue)}`,
    `Items issued value: ${money(input.issuedValue)}`,
  ];
  if (input.paymentMethodLabel) {
    summary.push(`Payment method: ${input.paymentMethodLabel}`);
  }
  if (input.notes) summary.push(input.notes);
  doc.text(doc.splitTextToSize(summary.join("\n"), 90), MARGIN, y + 7);

  const rows: {
    label: string;
    value: string;
    color: [number, number, number];
  }[] = [
    {
      label: "Returned Value",
      value: money(input.returnedValue),
      color: SLATE_700,
    },
    {
      label: "Issued Value",
      value: money(input.issuedValue),
      color: SLATE_700,
    },
  ];

  let ry = y;
  doc.setFontSize(8.6);
  for (const r of rows) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setTextColor(...SLATE_500);
    doc.text(r.label, panelX, ry);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setTextColor(...r.color);
    doc.text(r.value, PAGE_W - MARGIN, ry, { align: "right" });
    ry += 5.2;
  }

  doc.setFillColor(
    ...(input.settlementType === "CREDIT"
      ? ([236, 253, 245] as [number, number, number])
      : ([255, 247, 237] as [number, number, number])),
  );
  doc.setDrawColor(
    ...(input.settlementType === "CREDIT"
      ? ([167, 243, 208] as [number, number, number])
      : ([253, 186, 116] as [number, number, number])),
  );
  doc.roundedRect(panelX - 4, ry - 1, panelW + 4, 11, 1.5, 1.5, "FD");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...settlementColor);
  doc.text(settlementLabel, panelX, ry + 6);
  doc.text(money(input.settlementAmount), PAGE_W - MARGIN, ry + 6, {
    align: "right",
  });
  ry += 15;

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...SLATE_500);
  if (input.settlementType === "CREDIT") {
    doc.text(
      doc.splitTextToSize(
        "No cash refund is issued for offline sales. The difference has been added as store credit to your account and can be used on your next purchase.",
        panelW + 4,
      ),
      panelX - 4,
      ry,
    );
  } else if (input.settlementType === "COLLECT") {
    doc.text(
      doc.splitTextToSize(
        "The replacement item is of higher value; the additional amount shown was collected at the store.",
        panelW + 4,
      ),
      panelX - 4,
      ry,
    );
  }

  drawFooter(doc, input.business, false);
  return docToBuffer(doc);
}
