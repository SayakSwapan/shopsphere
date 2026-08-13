import jsPDF, { GState } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BalanceSheetData } from "./balance-sheet-csv";

const IND = new Intl.NumberFormat("en-IN");

const inr = (n: number) => `₹${IND.format(n)}`;

const compact = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 100000) return `${sign}${IND.format(Math.round(abs / 100000))}L`;
  if (abs >= 1000) return `${sign}${IND.format(Math.round(abs / 1000))}k`;
  return `${sign}${abs}`;
};

const FONT_FAMILY = "Noto Sans";

type Rgb = [number, number, number];

const C = {
  navy: [23, 37, 84] as Rgb,
  navyDeep: [15, 23, 42] as Rgb,
  navyRaised: [30, 41, 59] as Rgb,
  ink: [30, 41, 59] as Rgb,
  slate700: [51, 65, 85] as Rgb,
  slate500: [100, 116, 139] as Rgb,
  slate400: [148, 163, 184] as Rgb,
  slate300: [203, 213, 225] as Rgb,
  slate200: [226, 232, 240] as Rgb,
  slate100: [241, 245, 249] as Rgb,
  slate50: [248, 250, 252] as Rgb,
  borderDark: [74, 85, 104] as Rgb,
  white: [255, 255, 255] as Rgb,
  gold: [184, 144, 60] as Rgb,
  emerald: [5, 150, 105] as Rgb,
  orange: [217, 87, 20] as Rgb,
  red: [220, 38, 38] as Rgb,
  redLight: [248, 113, 113] as Rgb,
  blue: [37, 99, 235] as Rgb,
  ochre: [187, 128, 6] as Rgb,
  pink: [216, 47, 110] as Rgb,
  purple: [124, 58, 237] as Rgb,
};

const PALETTE: Rgb[] = [C.blue, C.ochre, C.orange, C.emerald, C.pink, C.slate700, C.slate500, C.purple];

const LIGHT_TABLE: {
  theme: "grid";
  styles: { fontSize: number; cellPadding: number; font: string; textColor: Rgb; lineColor: Rgb; lineWidth: number };
  headStyles: { fillColor: Rgb; textColor: Rgb; fontStyle: "bold" };
  alternateRowStyles: { fillColor: Rgb };
} = {
  theme: "grid",
  styles: { fontSize: 8, cellPadding: 2.4, font: FONT_FAMILY, textColor: C.ink, lineColor: C.slate200, lineWidth: 0.15 },
  headStyles: { fillColor: C.slate100, textColor: C.ink, fontStyle: "bold" },
  alternateRowStyles: { fillColor: C.slate50 },
};

const monthShort = (m: string) => m.split(" ")[0];

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

function sectionTitle(doc: jsPDF, x: number, y: number, title: string) {
  doc.setFillColor(...C.gold);
  doc.rect(x, y - 3, 1.8, 4.6, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.ink);
  doc.text(title, x + 5, y);
}

function chartCard(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
}

function relDeltas(pts: number[][]): number[][] {
  const deltas: number[][] = [];
  for (let i = 1; i < pts.length; i++) {
    deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  return deltas;
}

function arcPts(cx: number, cy: number, r: number, a0: number, a1: number): number[][] {
  const n = Math.max(3, Math.ceil((Math.abs(a1 - a0) / (Math.PI * 2)) * 48));
  const pts: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function donutSlice(doc: jsPDF, cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number, color: Rgb) {
  const outer = arcPts(cx, cy, rOuter, a0, a1);
  const inner = arcPts(cx, cy, rInner, a1, a0);
  const path = outer.concat(inner);
  doc.setFillColor(...color);
  doc.lines(relDeltas(path), path[0][0], path[0][1], [1, 1], "F", true);
}

function donut(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  segments: { value: number; color: Rgb }[],
  centerLabel: string,
  centerSub: string
) {
  let a = -Math.PI / 2;
  segments.forEach((seg) => {
    const sweep = (seg.value / (segments.reduce((s, x) => s + x.value, 0) || 1)) * Math.PI * 2;
    if (seg.value > 0) {
      donutSlice(doc, cx, cy, r, r * 0.6, a, a + sweep, seg.color);
    }
    a += sweep;
  });
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r, "S");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate700);
  doc.text(centerLabel, cx, cy, { align: "center" });
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.slate400);
  doc.text(centerSub, cx, cy + 3.2, { align: "center" });
}

function legendRow(doc: jsPDF, x: number, y: number, color: Rgb, name: string, value: string, pct: string, rightX: number) {
  doc.setFillColor(...color);
  doc.rect(x, y - 1.8, 3, 3, "F");
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  doc.text(name, x + 5, y);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setTextColor(...C.ink);
  doc.text(value, rightX - 12, y, { align: "right" });
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.slate400);
  doc.text(pct, rightX, y, { align: "right" });
}

function axisLine(doc: jsPDF, x: number, y: number, x2: number, y2: number, color: Rgb, width: number, dash?: number) {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.setLineDashPattern(dash ? [dash, dash] : [], 0);
  doc.line(x, y, x2, y2);
  doc.setLineDashPattern([], 0);
}

function barChart(doc: jsPDF, x: number, y: number, w: number, h: number, months: { month: string; netRevenue: number; refunds: number }[], max: number) {
  axisLine(doc, x, y + h, x + w, y + h, C.slate400, 0.4);

  const divisions = 4;
  for (let i = 1; i <= divisions; i++) {
    const gy = y + (h * i) / divisions;
    axisLine(doc, x, gy, x + w, gy, C.slate200, 0.2, 1.5);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.slate400);
    doc.text(compact((max * (divisions - i)) / divisions), x - 2, gy + 1.8, { align: "right" });
  }

  const n = months.length;
  const groupW = w / n;
  const gap = 1.6;
  const bw = (groupW - gap) / 2;
  const barSpecs = [
    { key: "netRevenue", color: C.emerald },
    { key: "refunds", color: C.ochre },
  ] as const;

  months.forEach((m, i) => {
    const gx = x + i * groupW;
    barSpecs.forEach((spec, si) => {
      const v = m[spec.key];
      const bh = (v / max) * h;
      if (bh > 0.3) {
        doc.setFillColor(...spec.color);
        doc.rect(gx + gap / 2 + si * bw, y + h - bh, bw, bh, "F");
      }
    });
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.slate500);
    doc.text(monthShort(m.month), gx + groupW / 2, y + h + 3.6, { align: "center" });
  });
}

function lineChart(doc: jsPDF, x: number, y: number, w: number, h: number, months: { month: string; netProfit: number }[], color: Rgb) {
  const values = months.map((m) => m.netProfit);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const px = (i: number) => x + (i / (months.length - 1)) * w;
  const py = (v: number) => y + h - ((v - min) / span) * h;

  axisLine(doc, x, y + h, x + w, y + h, C.slate400, 0.4);

  const divisions = 4;
  for (let i = 1; i <= divisions; i++) {
    const gy = y + (h * i) / divisions;
    axisLine(doc, x, gy, x + w, gy, C.slate200, 0.2, 1.5);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.slate400);
    doc.text(compact(max - (span * i) / divisions), x - 2, gy + 1.8, { align: "right" });
  }

  if (min < 0) {
    const zy = py(0);
    axisLine(doc, x, zy, x + w, zy, C.red, 0.3, 1.5);
  }

  const pts = values.map((v, i) => [px(i), py(v)]);
  const area = [...pts, [px(months.length - 1), y + h], [px(0), y + h]];
  doc.setGState(new GState({ opacity: 0.14 }));
  doc.setFillColor(...color);
  doc.lines(relDeltas(area), area[0][0], area[0][1], [1, 1], "F", true);
  doc.setGState(new GState({ opacity: 1 }));

  doc.setDrawColor(...color);
  doc.setLineWidth(1.1);
  doc.lines(relDeltas(pts), pts[0][0], pts[0][1], [1, 1], "S");

  pts.forEach((p) => {
    doc.setFillColor(...C.white);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.6);
    doc.circle(p[0], p[1], 1.1, "FD");
  });

  months.forEach((m, i) => {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.slate500);
    doc.text(monthShort(m.month), px(i), y + h + 3.6, { align: "center" });
  });
}

function coverPage(doc: jsPDF, data: BalanceSheetData) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 16;

  doc.setFillColor(...C.navyDeep);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(...C.gold);
  doc.rect(0, 0, pageW, 1.4, "F");

  doc.setFillColor(...C.gold);
  doc.rect(M, 24, 4, 4, "F");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.text(data.storeName.toUpperCase(), M + 6.5, 27.2);

  doc.setFillColor(...C.navyRaised);
  doc.setDrawColor(...C.borderDark);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageW - M - 34, 20.5, 34, 10, 5, 5, "FD");
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.gold);
  doc.text(`FY ${data.fy}`, pageW - M - 17, 27, { align: "center" });

  doc.setGState(new GState({ opacity: 0.12 }));
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.6);
  doc.circle(pageW - 44, 40, 24, "S");
  doc.circle(pageW - 44, 40, 14, "S");
  doc.setGState(new GState({ opacity: 1 }));

  doc.setFillColor(...C.gold);
  doc.rect(M, 92, 34, 1.2, "F");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.gold);
  doc.text("BALANCE SHEET", M, 106);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(27);
  doc.setTextColor(...C.white);
  doc.text("Statement of Profit & Loss", M, 126);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.slate300);
  doc.text(`${data.storeName} · FY ${data.fy} · All figures in INR (₹)`, M, 140);

  const s = data.summary;
  const cards = [
    { label: "NET REVENUE", value: inr(s.netRevenue), color: C.white },
    { label: "NET PROFIT", value: inr(s.netProfit), color: s.netProfit >= 0 ? C.gold : C.redLight },
    { label: "GROSS REVENUE", value: inr(s.grossRevenue), color: C.white },
  ];
  const gap = 6;
  const cardW = (pageW - M * 2 - gap * 2) / 3;
  const cardY = 158;
  const cardH = 27;
  cards.forEach((c, i) => {
    const x = M + i * (cardW + gap);
    doc.setFillColor(...C.navyRaised);
    doc.setDrawColor(...C.borderDark);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "FD");
    doc.setFillColor(...C.gold);
    doc.rect(x + 2, cardY + 4, 1.4, cardH - 8, "F");
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.slate400);
    doc.text(c.label, x + 7.5, cardY + 9);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(14);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 7.5, cardY + 20);
  });

  const [fyStart, fyEnd] = data.fy.split("-");
  const endYearFull = fyEnd.length === 4 ? fyEnd : `${fyStart.slice(0, 2)}${fyEnd}`;
  const now = new Date();
  const meta = [
    { label: "GENERATED ON", value: `${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` },
    { label: "PERIOD COVERED", value: `01 Apr ${fyStart} – 31 Mar ${endYearFull}` },
    { label: "CURRENCY", value: "INR (₹)" },
  ];
  const metaCol = (pageW - M * 2) / 3;
  meta.forEach((m, i) => {
    const x = M + i * metaCol;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.slate400);
    doc.text(m.label, x, 208);
    doc.setFontSize(9);
    doc.setTextColor(...C.slate300);
    doc.text(m.value, x, 214);
  });

  doc.setDrawColor(...C.borderDark);
  doc.setLineWidth(0.3);
  doc.line(M, pageH - 52, pageW - M, pageH - 52);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate400);
  doc.text("Auto-generated for ITR filing reference", M, pageH - 40);
}

function highlightsAndCharts(doc: jsPDF, data: BalanceSheetData) {
  const pageW = doc.internal.pageSize.getWidth();
  const M = 16;
  const s = data.summary;
  const profitColor = (v: number) => (v >= 0 ? C.emerald : C.red);

  sectionTitle(doc, M, 20, "FINANCIAL HIGHLIGHTS");

  const row1 = [
    { label: "Net Revenue", value: inr(s.netRevenue), color: C.emerald },
    { label: "Gross Profit", value: inr(s.grossProfit), color: profitColor(s.grossProfit) },
    { label: "Net Profit", value: inr(s.netProfit), color: C.navy, highlight: true },
    { label: "Gross Revenue", value: inr(s.grossRevenue), color: C.blue },
    { label: "Total Orders", value: String(s.totalOrders), color: C.slate700 },
  ];
  const row2 = [
    { label: "COGS", value: inr(s.cogs), color: C.orange },
    { label: "GST Collected", value: inr(s.gst), color: C.blue },
    { label: "Refunds", value: inr(s.refunds), color: C.ochre },
    { label: "Total Returns", value: String(s.totalReturns), color: C.pink },
    { label: "Total Expenses", value: inr(s.totalExpenses), color: C.red },
  ];

  const cols = 5;
  const gap = 5;
  const cardW = (pageW - M * 2 - gap * (cols - 1)) / cols;
  const cardH = 20;

  const drawCard = (c: { label: string; value: string; color: Rgb; highlight?: boolean }, col: number, row: number) => {
    const x = M + col * (cardW + gap);
    const y = 30 + row * (cardH + gap);

    if (c.highlight) {
      doc.setFillColor(...C.navy);
      doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "F");
    } else {
      doc.setFillColor(...C.white);
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");
      doc.setFillColor(...c.color);
      doc.rect(x + 2, y + 3, 1.6, cardH - 6, "F");
    }

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...(c.highlight ? C.slate300 : C.slate500));
    doc.text(c.label.toUpperCase(), x + 7, y + 8.5);

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 7, y + 16);
  };

  row1.forEach((c, i) => drawCard(c, i, 0));
  row2.forEach((c, i) => drawCard(c, i, 1));

  sectionTitle(doc, M, 88, "REVENUE & REFUNDS TREND");
  chartCard(doc, M, 94, pageW - M * 2, 92);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.slate700);
  doc.text("Net Revenue vs Refunds, by month", M + 6, 104);
  const legendItems = [
    { label: "Net Revenue", color: C.emerald },
    { label: "Refunds", color: C.ochre },
  ];
  legendItems.forEach((l, i) => {
    const lx = pageW - M - 6 - (legendItems.length - 1 - i) * 42;
    doc.setFillColor(...l.color);
    doc.rect(lx, 101, 3, 3, "F");
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.slate500);
    doc.text(l.label, lx + 4.5, 103.5);
  });

  const chartMax = Math.max(1, ...data.monthly.map((m) => Math.max(m.netRevenue, m.refunds))) * 1.12;
  barChart(doc, M + 6, 109, pageW - M * 2 - 12, 70, data.monthly, chartMax);

  sectionTitle(doc, M, 200, "NET PROFIT TREND");
  chartCard(doc, M, 206, pageW - M * 2, 70);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.slate700);
  doc.text("Net Profit after expenses, by month", M + 6, 216);
  lineChart(doc, M + 6, 221, pageW - M * 2 - 12, 48, data.monthly, C.emerald);
}

function monthlySchedule(doc: jsPDF, data: BalanceSheetData) {
  const M = 16;

  sectionTitle(doc, M, 18, "MONTHLY BREAKDOWN");

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

  const rightAlignCols: Record<number, { halign: "right" }> = {};
  for (let i = 1; i <= 10; i++) rightAlignCols[i] = { halign: "right" };

  autoTable(doc, {
    startY: 26,
    margin: { left: M, right: M },
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
    theme: LIGHT_TABLE.theme,
    styles: LIGHT_TABLE.styles,
    headStyles: LIGHT_TABLE.headStyles,
    alternateRowStyles: LIGHT_TABLE.alternateRowStyles,
    footStyles: { fillColor: C.navy, textColor: C.white, fontStyle: "bold" as const },
    columnStyles: { 0: { fontStyle: "bold" } as const, ...rightAlignCols },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate400);
  doc.text("All figures in INR (₹). Refunds are counted in the month the order was placed.", M, finalY + 8);
}

function donutsAndNotes(doc: jsPDF, data: BalanceSheetData) {
  const pageW = doc.internal.pageSize.getWidth();
  const M = 16;
  const cardW = pageW - M * 2;
  const rightX = M + cardW - 10;

  sectionTitle(doc, M, 20, "REVENUE BY PAYMENT METHOD");
  chartCard(doc, M, 26, cardW, 60);
  const payTotal = data.paymentBreakdown.cod + data.paymentBreakdown.razorpay;
  donut(
    doc,
    M + 34,
    56,
    21,
    [
      { value: data.paymentBreakdown.cod, color: C.slate700 },
      { value: data.paymentBreakdown.razorpay, color: C.blue },
    ],
    inr(payTotal),
    "PAYMENTS"
  );
  const paySegs = [
    { name: "Cash on Delivery (COD)", value: data.paymentBreakdown.cod, color: C.slate700 },
    { name: "Razorpay", value: data.paymentBreakdown.razorpay, color: C.blue },
  ];
  paySegs.forEach((seg, i) => {
    const y = 38 + i * 12;
    legendRow(doc, M + 66, y, seg.color, seg.name, inr(seg.value), `${Math.round((seg.value / (payTotal || 1)) * 100)}%`, rightX);
  });

  sectionTitle(doc, M, 100, "EXPENSES BY CATEGORY");
  chartCard(doc, M, 106, cardW, 66);
  const expTotal = data.expenseBreakdown.reduce((a, e) => a + e.total, 0);
  donut(
    doc,
    M + 34,
    139,
    21,
    data.expenseBreakdown.map((e, i) => ({ value: e.total, color: PALETTE[i % PALETTE.length] })),
    inr(expTotal),
    "EXPENSES"
  );
  const expSegs = data.expenseBreakdown.map((e, i) => ({ name: e.name, value: e.total, color: PALETTE[i % PALETTE.length] }));
  const rowH = expSegs.length > 4 ? 9.5 : 12;
  expSegs.forEach((seg, i) => {
    const y = 116 + i * rowH + (expSegs.length > 4 ? 0 : 5);
    legendRow(doc, M + 66, y, seg.color, seg.name, inr(seg.value), `${Math.round((seg.value / (expTotal || 1)) * 100)}%`, rightX);
  });

  sectionTitle(doc, M, 186, "NOTES & DEFINITIONS");
  doc.setFillColor(...C.slate50);
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, 192, cardW, 30, 2.5, 2.5, "FD");
  const notes = [
    "Net Revenue = Gross Revenue - Refunds. Refunds are counted in the month the order was placed.",
    "COGS excludes refunded orders — returned goods are taken back into stock.",
    "GST Collected is the output GST on non-cancelled orders for the financial year.",
    "This report is auto-generated for ITR filing reference and does not require a signature.",
  ];
  notes.forEach((n, i) => {
    const ny = 199 + i * 5;
    doc.setFillColor(...C.gold);
    doc.circle(M + 3, ny - 1.2, 0.9, "F");
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate700);
    doc.text(n, M + 9, ny);
  });
}

export function buildBalanceSheetPDF(doc: jsPDF, data: BalanceSheetData) {
  const M = 16;

  doc.setFont(FONT_FAMILY, "normal");

  coverPage(doc, data);

  doc.addPage("a4", "portrait");
  highlightsAndCharts(doc, data);

  doc.addPage("a4", "landscape");
  monthlySchedule(doc, data);

  doc.addPage("a4", "portrait");
  donutsAndNotes(doc, data);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const dark = i === 1;

    doc.setDrawColor(...(dark ? C.borderDark : C.slate200));
    doc.setLineWidth(0.3);
    doc.line(M, pageH - 14, pageW - M, pageH - 14);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...(dark ? C.slate500 : C.slate400));
    doc.text(`${data.storeName} · Balance Sheet FY ${data.fy} · Auto-generated for ITR filing reference`, M, pageH - 8.5);

    doc.setFont(FONT_FAMILY, "bold");
    doc.setTextColor(...(dark ? C.gold : C.ink));
    doc.text(`Page ${i} of ${totalPages}`, pageW - M, pageH - 8.5, { align: "right" });
  }

  return doc;
}

export async function downloadPDF(data: BalanceSheetData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await loadBalanceSheetFonts(doc);
  buildBalanceSheetPDF(doc, data);
  doc.save(`balance-sheet-FY-${data.fy}.pdf`);
}
