import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BalanceSheetData } from "./balance-sheet-csv";

const IND = new Intl.NumberFormat("en-IN");

const inr = (n: number) => `₹${IND.format(n)}`;

const FONT_FAMILY = "Noto Sans";

const COLORS = {
  slate900: [15, 23, 42] as [number, number, number],
  slate800: [30, 41, 59] as [number, number, number],
  card: [17, 24, 39] as [number, number, number],
  cardBorder: [30, 41, 59] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  emeraldLight: [52, 211, 153] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
  yellow: [234, 179, 8] as [number, number, number],
  pink: [236, 72, 153] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [148, 163, 184] as [number, number, number],
};

type Rgb = [number, number, number];
const TABLE_STYLES: {
  theme: "grid";
  styles: { fontSize: number; cellPadding: number; font: string; textColor: Rgb; lineColor: Rgb; lineWidth: number };
  headStyles: { fillColor: Rgb; textColor: Rgb; fontStyle: "bold" };
  alternateRowStyles: { fillColor: Rgb };
} = {
  theme: "grid",
  styles: { fontSize: 8.5, cellPadding: 2.6, font: FONT_FAMILY, textColor: COLORS.white, lineColor: [45, 55, 72], lineWidth: 0.15 },
  headStyles: { fillColor: COLORS.slate800, textColor: COLORS.white, fontStyle: "bold" },
  alternateRowStyles: { fillColor: [15, 24, 39] },
};

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${url} (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function registerFonts(doc: jsPDF, regularB64: string, boldB64: string) {
  doc.addFileToVFS("NotoSans-Regular.ttf", regularB64);
  doc.addFileToVFS("NotoSans-Bold.ttf", boldB64);
  doc.addFont("NotoSans-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFont("NotoSans-Bold.ttf", FONT_FAMILY, "bold");
}

export async function loadBalanceSheetFonts(doc: jsPDF) {
  const [regular, bold] = await Promise.all([
    fetchAsBase64("/fonts/NotoSans-Regular.ttf"),
    fetchAsBase64("/fonts/NotoSans-Bold.ttf"),
  ]);
  registerFonts(doc, regular, bold);
}

function sectionTitle(doc: jsPDF, y: number, title: string) {
  doc.setFillColor(...COLORS.amber);
  doc.rect(14, y - 3.5, 2, 5, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text(title, 19, y);
}

export function buildBalanceSheetPDF(doc: jsPDF, data: BalanceSheetData) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFont(FONT_FAMILY, "normal");

  /* ================= Header band ================= */
  doc.setFillColor(...COLORS.slate900);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setFillColor(...COLORS.amber);
  doc.rect(0, 30, pageW, 1.2, "F");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.white);
  doc.text("Balance Sheet", margin, 16);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Profit & Loss Summary — Financial Year FY ${data.fy}`, margin, 23);

  doc.setFillColor(...COLORS.amber);
  doc.roundedRect(pageW - 52, 8, 38, 14, 2, 2, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("SHOPSPHERE", pageW - 33, 17.5, { align: "center" });

  /* ================= Metadata row ================= */
  const [fyStart, fyEnd] = data.fy.split("-");
  const endYearFull = fyEnd.length === 4 ? fyEnd : `${fyStart.slice(0, 2)}${fyEnd}`;

  doc.setFontSize(8.5);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    37.5
  );
  doc.text(`Period: 01 Apr ${fyStart} – 31 Mar ${endYearFull}`, pageW - margin, 37.5, { align: "right" });

  /* ================= Summary cards ================= */
  const s = data.summary;
  const cards = [
    { label: "Net Revenue", value: inr(s.netRevenue), color: COLORS.emeraldLight },
    { label: "COGS", value: inr(s.cogs), color: COLORS.orange },
    { label: "Gross Profit", value: inr(s.grossProfit), color: s.grossProfit >= 0 ? COLORS.emeraldLight : COLORS.red },
    { label: "Total Expenses", value: inr(s.totalExpenses), color: COLORS.red },
    { label: "Net Profit", value: inr(s.netProfit), color: s.netProfit >= 0 ? COLORS.emeraldLight : COLORS.red },
    { label: "GST Collected", value: inr(s.gst), color: COLORS.blue },
    { label: "Refunds", value: inr(s.refunds), color: COLORS.yellow },
    { label: "Total Orders", value: String(s.totalOrders), color: COLORS.white },
    { label: "Total Returns", value: String(s.totalReturns), color: COLORS.pink },
    { label: "Gross Revenue", value: inr(s.grossRevenue), color: COLORS.emerald },
  ];

  const cols = 5;
  const gap = 4;
  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = 21;
  const cardTop = 46;
  cards.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (cardW + gap);
    const cy = cardTop + row * (cardH + gap);

    doc.setFillColor(...COLORS.card);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(x, cy, cardW, cardH, 2.5, 2.5, "FD");

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.gray);
    doc.text(c.label.toUpperCase(), x + 4, cy + 8);

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 4, cy + 16.5);
  });

  /* ================= Monthly breakdown ================= */
  const monthlyHead = ["Month", "Gross Rev", "Refunds", "Net Rev", "COGS", "Gross Profit", "Expenses", "Net Profit", "GST", "Orders", "Returns"];

  const totals = data.monthly.reduce(
    (acc, m) => {
      acc.grossRevenue += m.grossRevenue;
      acc.refunds += m.refunds;
      acc.netRevenue += m.netRevenue;
      acc.cogs += m.cogs;
      acc.grossProfit += m.grossProfit;
      acc.expenses += m.expenses;
      acc.netProfit += m.netProfit;
      acc.gst += m.gst;
      acc.orders += m.orders;
      acc.returns += m.returns;
      return acc;
    },
    { grossRevenue: 0, refunds: 0, netRevenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, gst: 0, orders: 0, returns: 0 }
  );

  let cursorY = 92;
  sectionTitle(doc, cursorY, "Monthly Breakdown");
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [monthlyHead],
    body: data.monthly.map((m) => [
      m.month,
      inr(m.grossRevenue),
      inr(m.refunds),
      inr(m.netRevenue),
      inr(m.cogs),
      inr(m.grossProfit),
      inr(m.expenses),
      inr(m.netProfit),
      inr(m.gst),
      String(m.orders),
      String(m.returns),
    ]),
    foot: [
      [
        "TOTAL",
        inr(totals.grossRevenue),
        inr(totals.refunds),
        inr(totals.netRevenue),
        inr(totals.cogs),
        inr(totals.grossProfit),
        inr(totals.expenses),
        inr(totals.netProfit),
        inr(totals.gst),
        String(totals.orders),
        String(totals.returns),
      ],
    ],
    theme: TABLE_STYLES.theme,
    styles: { ...TABLE_STYLES.styles, fontSize: 8, cellPadding: 2.4 },
    headStyles: { ...TABLE_STYLES.headStyles, fontSize: 8 },
    alternateRowStyles: TABLE_STYLES.alternateRowStyles,
    footStyles: { fillColor: COLORS.slate900, textColor: COLORS.white, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold" },
      9: { halign: "right" },
      10: { halign: "right" },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  /* ================= Expenses + Payment methods ================= */
  const expRows = data.expenseBreakdown.map((e) => [e.name, inr(e.total)]);
  const payRows = [
    ["Cash on Delivery (COD)", inr(data.paymentBreakdown.cod)],
    ["Razorpay", inr(data.paymentBreakdown.razorpay)],
  ];

  const hasExpenses = expRows.length > 0;
  if (hasExpenses) {
    sectionTitle(doc, cursorY, "Expenses by Category");
  }
  const payY = hasExpenses ? cursorY : cursorY + 6;
  sectionTitle(doc, payY, "Payment Methods");

  const sectionY = Math.max(cursorY, payY) + 5;
  const leftW = 130;
  const rightW = 70;
  const midGap = 8;

  autoTable(doc, {
    startY: sectionY,
    margin: { left: margin },
    tableWidth: leftW,
    head: [["Category", "Amount"]],
    body: expRows,
    ...TABLE_STYLES,
    columnStyles: { 1: { cellWidth: 34, halign: "right" } },
  });

  autoTable(doc, {
    startY: sectionY,
    margin: { left: margin + leftW + midGap, right: margin },
    tableWidth: rightW,
    head: [["Method", "Amount"]],
    body: payRows,
    ...TABLE_STYLES,
    columnStyles: { 1: { cellWidth: 34, halign: "right" } },
  });

  /* ================= Footer on every page ================= */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.slate800);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    doc.text("This document is auto-generated for ITR filing reference. All amounts in INR (₹).", margin, pageH - 8);

    doc.setFont(FONT_FAMILY, "bold");
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: "right" });
  }

  return doc;
}

export async function downloadPDF(data: BalanceSheetData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await loadBalanceSheetFonts(doc);
  buildBalanceSheetPDF(doc, data);
  doc.save(`balance-sheet-FY-${data.fy}.pdf`);
}
