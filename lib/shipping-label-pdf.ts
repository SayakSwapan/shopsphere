import jsPDF from "jspdf";
import QRCode from "qrcode";

import { loadBalanceSheetFonts } from "./balance-sheet-pdf";

const FONT_FAMILY = "Noto Sans";

type Rgb = [number, number, number];

const C = {
  navyDeep: [15, 23, 42] as Rgb,
  ink: [30, 41, 59] as Rgb,
  slate700: [51, 65, 85] as Rgb,
  slate500: [100, 116, 139] as Rgb,
  slate400: [148, 163, 184] as Rgb,
  slate200: [226, 232, 240] as Rgb,
  slate100: [241, 245, 249] as Rgb,
  slate50: [248, 250, 252] as Rgb,
  white: [255, 255, 255] as Rgb,
  gold: [184, 144, 60] as Rgb,
  emerald: [5, 150, 105] as Rgb,
  emeraldBg: [236, 253, 245] as Rgb,
  orange: [217, 87, 20] as Rgb,
  orangeBg: [255, 247, 237] as Rgb,
};

const IND = new Intl.NumberFormat("en-IN");

const inr = (n: number) => `₹${IND.format(n)}`;

export interface ShippingLabelItem {
  name: string;
  variant?: string | null;
  sku?: string | null;
  quantity: number;
  productUrl: string;
}

export interface ShippingLabelData {
  orderNumber: string;
  orderDate: string;
  paymentType: "COD" | "PREPAID";
  paymentStatus?: string;
  amount: number;
  customer: {
    name: string;
    phone: string;
    addressLines: string[];
    pincode: string;
  };
  items: ShippingLabelItem[];
  soldBy: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
}

function sectionTitle(doc: jsPDF, x: number, y: number, title: string) {
  doc.setFillColor(...C.gold);
  doc.rect(x, y - 3, 1.8, 4.6, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.ink);
  doc.text(title, x + 5, y);
}

function truncateLines(lines: string[], max: number) {
  if (lines.length <= max) return lines;
  const trimmed = lines.slice(0, max);
  trimmed[max - 1] = `${trimmed[max - 1].replace(/.{2}$/, "")}…`;
  return trimmed;
}

function drawItemsHeader(doc: jsPDF, y: number, R: number, M: number) {
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.slate400);
  doc.text("PRODUCT DETAILS", M + 12, y, { charSpace: 0.4 });
  doc.text("QTY", R - 34, y, { align: "center", charSpace: 0.4 });
  doc.text("SCAN", R - 9, y, { align: "center", charSpace: 0.4 });
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.line(M, y + 2.5, R, y + 2.5);
}

function drawContinuedBand(doc: jsPDF, data: ShippingLabelData, M: number) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.navyDeep);
  doc.rect(0, 0, pageW, 16, "F");
  doc.setFillColor(...C.gold);
  doc.rect(0, 16, pageW, 1, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text(data.orderNumber, M, 10);
  doc.setFontSize(7);
  doc.setTextColor(...C.gold);
  doc.text("SHIPPING LABEL · ITEMS CONTINUED", pageW - M, 10, {
    align: "right",
    charSpace: 0.5,
  });
}

function drawItemRow(
  doc: jsPDF,
  item: ShippingLabelItem,
  qrUrl: string,
  index: number,
  y: number,
  R: number,
  M: number
) {
  const RH = 24;
  const textX = M + 12;
  const textW = R - 44 - textX;

  doc.setFillColor(...C.slate100);
  doc.roundedRect(M + 1, y + 4, 7, 7, 1.5, 1.5, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate700);
  doc.text(String(index + 1), M + 4.5, y + 8.8, { align: "center" });

  const nameLines = truncateLines(
    doc.splitTextToSize(item.name, textW) as string[],
    2
  );
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  nameLines.forEach((line, i) => {
    doc.text(line, textX, y + 7 + i * 4.6);
  });

  let cursorY = y + 7 + nameLines.length * 4.6;

  if (item.variant) {
    const variantLine = truncateLines(
      doc.splitTextToSize(item.variant, textW) as string[],
      1
    );
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate500);
    doc.text(variantLine[0], textX, cursorY);
    cursorY += 4;
  }

  if (item.sku) {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate700);
    doc.text(`SKU: ${item.sku}`, textX, cursorY);
  }

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.slate400);
  doc.text("QTY", R - 34, y + 9, { align: "center" });
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.ink);
  doc.text(String(item.quantity), R - 34, y + 16, { align: "center" });

  doc.addImage(qrUrl, "PNG", R - 19, y + 2.5, 18, 18);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...C.slate400);
  doc.text("SCAN FOR DETAILS", R - 10, y + 23, { align: "center" });

  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.2);
  doc.line(M, y + RH, R, y + RH);
}

function drawSoldByAndNotes(
  doc: jsPDF,
  data: ShippingLabelData,
  y: number,
  R: number,
  M: number
) {
  const contentW = R - M;
  const leftW = 106;
  const rightW = contentW - leftW - 6;
  const cardH = 38;

  doc.setFillColor(...C.slate50);
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, leftW, cardH, 2.5, 2.5, "FD");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gold);
  doc.text("SOLD BY", M + 6, y + 7, { charSpace: 0.6 });

  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  doc.text(data.soldBy.name, M + 6, y + 13.5);

  let sy = y + 18.5;
  if (data.soldBy.address) {
    const addrLines = truncateLines(
      doc.splitTextToSize(data.soldBy.address, leftW - 12) as string[],
      3
    );
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate700);
    addrLines.forEach((line) => {
      doc.text(line, M + 6, sy);
      sy += 3.9;
    });
  }

  const contact = [data.soldBy.phone, data.soldBy.email]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.slate500);
    doc.text(contact, M + 6, sy);
    sy += 4;
  }

  if (data.soldBy.gstin) {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.slate700);
    doc.text(`GSTIN: ${data.soldBy.gstin}`, M + 6, Math.min(sy, y + cardH - 3));
  }

  const rx = M + leftW + 6;
  doc.setFillColor(...C.emeraldBg);
  doc.setDrawColor(...C.emerald);
  doc.roundedRect(rx, y, rightW, cardH, 2.5, 2.5, "FD");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.emerald);
  doc.text("BEFORE ACCEPTING", rx + 5, y + 7, { charSpace: 0.6 });

  const notes = [
    "Check the seal and package condition in front of the delivery partner.",
    "Quote the order number printed above in any support communication.",
  ];
  let ny = y + 13.5;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  notes.forEach((note) => {
    const lines = doc.splitTextToSize(note, rightW - 12) as string[];
    lines.forEach((line) => {
      doc.text(line, rx + 5, ny);
      ny += 3.9;
    });
    ny += 1.5;
  });
}

export function buildShippingLabel(
  doc: jsPDF,
  data: ShippingLabelData,
  qrUrls: string[]
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 12;
  const R = pageW - M;
  const contentW = R - M;

  doc.setFont(FONT_FAMILY, "normal");

  doc.setFillColor(...C.navyDeep);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setFillColor(...C.gold);
  doc.rect(0, 26, pageW, 1.2, "F");

  doc.setFillColor(...C.gold);
  doc.rect(M, 9.5, 4, 4, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text(data.soldBy.name.toUpperCase(), M + 6.5, 13);

  doc.setFontSize(8);
  doc.setTextColor(...C.gold);
  doc.text("SHIPPING LABEL", R, 9.5, { align: "right", charSpace: 1 });
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(data.orderNumber, R, 16.5, { align: "right" });

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate500);
  doc.text(`Placed: ${data.orderDate}`, M, 33.5);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    R,
    33.5,
    { align: "right" }
  );

  const isCod = data.paymentType === "COD";
  const accent = isCod ? C.orange : C.emerald;
  const bandBg = isCod ? C.orangeBg : C.emeraldBg;
  const bandY = 38;
  const bandH = 17;

  doc.setFillColor(...bandBg);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, bandY, contentW, bandH, 2.5, 2.5, "FD");

  doc.setFillColor(...accent);
  doc.roundedRect(M + 3.5, bandY + 3.5, 27, 10, 2, 2, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text(isCod ? "COD" : "PREPAID", M + 17, bandY + 10, {
    align: "center",
  });

  doc.setFontSize(10.5);
  doc.setTextColor(...C.ink);
  doc.text(
    isCod ? "Cash on Delivery" : "Prepaid — Payment Received",
    M + 35,
    bandY + 8
  );
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate700);
  doc.text(
    isCod
      ? "Collect the amount below from the customer at the door"
      : `Paid online${data.paymentStatus ? ` · ${data.paymentStatus}` : ""} — nothing to collect`,
    M + 35,
    bandY + 13.5
  );

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.slate500);
  doc.text(isCod ? "AMOUNT TO COLLECT" : "AMOUNT PAID", R - 4, bandY + 6.5, {
    align: "right",
  });
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...accent);
  doc.text(inr(data.amount), R - 4, bandY + 14, { align: "right" });

  sectionTitle(doc, M, 66, "DELIVER TO");

  const innerX = M + 7;
  const innerW = contentW - 14;
  const addrBlocks = data.customer.addressLines.flatMap(
    (line) => doc.splitTextToSize(line, innerW) as string[]
  );
  const cardY = 70;
  const cardH =
    10 + 7 + 6 + addrBlocks.length * 4.8 + 7.5 + 5;

  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, cardY, contentW, cardH, 2.5, 2.5, "FD");
  doc.setFillColor(...C.gold);
  doc.rect(M + 2, cardY + 4, 1.6, cardH - 8, "F");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.ink);
  doc.text(data.customer.name, innerX, cardY + 10);

  doc.setFontSize(10);
  doc.setTextColor(...C.slate700);
  doc.text(`Phone: ${data.customer.phone}`, innerX, cardY + 16.5);

  let ay = cardY + 23;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  addrBlocks.forEach((line) => {
    doc.text(line, innerX, ay);
    ay += 4.8;
  });

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10.5);
  doc.text(data.customer.pincode, innerX, ay + 1.5);

  let y = cardY + cardH + 11;
  sectionTitle(
    doc,
    M,
    y,
    `ITEMS IN THIS SHIPMENT (${data.items.reduce((s, i) => s + i.quantity, 0)})`
  );
  y += 6;
  drawItemsHeader(doc, y, R, M);
  y += 8;

  const RH = 24;

  data.items.forEach((item, i) => {
    if (y + RH > pageH - 56) {
      doc.addPage("a4", "portrait");
      drawContinuedBand(doc, data, M);
      y = 28;
      drawItemsHeader(doc, y, R, M);
      y += 8;
    }
    drawItemRow(doc, item, qrUrls[i], i, y, R, M);
    y += RH;
  });

  y += 5;
  if (y + 46 > pageH - 20) {
    doc.addPage("a4", "portrait");
    drawContinuedBand(doc, data, M);
    y = 28;
  }

  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.line(M, y, R, y);
  y += 7;

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.slate700);
  doc.text(
    `Total Units: ${data.items.reduce((s, i) => s + i.quantity, 0)}`,
    M,
    y
  );
  doc.setFontSize(10.5);
  doc.setTextColor(...C.ink);
  doc.text(`Order Value: ${inr(data.amount)}`, R, y, { align: "right" });

  y += 8;
  drawSoldByAndNotes(doc, data, y, R, M);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.3);
    doc.line(M, pageH - 14, R, pageH - 14);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.slate400);
    doc.text(
      `${data.soldBy.name} · Shipping Label · ${data.orderNumber}`,
      M,
      pageH - 8.5
    );
    doc.setFont(FONT_FAMILY, "bold");
    doc.setTextColor(...C.ink);
    doc.text(`Page ${i} of ${totalPages}`, R, pageH - 8.5, {
      align: "right",
    });
  }

  return doc;
}

export async function downloadShippingLabel(data: ShippingLabelData) {
  if (!data.items.length) {
    throw new Error("No items to ship.");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await loadBalanceSheetFonts(doc);

  const qrUrls = await Promise.all(
    data.items.map((item) =>
      QRCode.toDataURL(item.productUrl, {
        margin: 1,
        width: 300,
        errorCorrectionLevel: "M",
      })
    )
  );

  buildShippingLabel(doc, data, qrUrls);
  doc.save(`shipping-label-${data.orderNumber}.pdf`);
}
