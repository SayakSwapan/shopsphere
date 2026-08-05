import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BalanceSheetData } from "./balance-sheet-csv";

export function downloadPDF(data: BalanceSheetData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Balance Sheet — FY ${data.fy}`, 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 25);

  const s = data.summary;
  const summaryRows = [
    ["Gross Revenue", `₹${s.grossRevenue.toLocaleString("en-IN")}`],
    ["Refunds", `₹${s.refunds.toLocaleString("en-IN")}`],
    ["Net Revenue", `₹${s.netRevenue.toLocaleString("en-IN")}`],
    ["Cost of Goods Sold (COGS)", `₹${s.cogs.toLocaleString("en-IN")}`],
    ["Gross Profit", `₹${s.grossProfit.toLocaleString("en-IN")}`],
    ["Total Expenses", `₹${s.totalExpenses.toLocaleString("en-IN")}`],
    ["Net Profit", `₹${s.netProfit.toLocaleString("en-IN")}`],
    ["GST Collected", `₹${s.gst.toLocaleString("en-IN")}`],
    ["Total Orders", String(s.totalOrders)],
    ["Total Returns", String(s.totalReturns)],
  ];

  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Value"]],
    body: summaryRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: "right" as const } },
    margin: { left: 14 },
  });

  const monthlyRows = data.monthly.map((m) => [
    m.month,
    `₹${m.grossRevenue.toLocaleString("en-IN")}`,
    `₹${m.refunds.toLocaleString("en-IN")}`,
    `₹${m.netRevenue.toLocaleString("en-IN")}`,
    `₹${m.cogs.toLocaleString("en-IN")}`,
    `₹${m.grossProfit.toLocaleString("en-IN")}`,
    `₹${m.expenses.toLocaleString("en-IN")}`,
    `₹${m.netProfit.toLocaleString("en-IN")}`,
    `₹${m.gst.toLocaleString("en-IN")}`,
    String(m.orders),
    String(m.returns),
  ]);

  autoTable(doc, {
    startY: (doc as unknown as Record<string, Record<string, number>>).__lastAutoTable?.finalY ?? 30,
    head: [["Month", "Gross Rev", "Refunds", "Net Rev", "COGS", "Gross Profit", "Expenses", "Net Profit", "GST", "Orders", "Returns"]],
    body: monthlyRows,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
    margin: { left: 14 },
  });

  if (data.expenseBreakdown.length > 0) {
    const y = (doc as unknown as Record<string, Record<string, number>>).__lastAutoTable?.finalY ?? 30;
    autoTable(doc, {
      startY: y + 8,
      head: [["Expense Category", "Amount"]],
      body: data.expenseBreakdown.map((e) => [e.name, `₹${e.total.toLocaleString("en-IN")}`]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: "right" as const } },
      margin: { left: 14 },
    });
  }

  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("This document is auto-generated for ITR filing reference.", 14, footerY);
  doc.text(`Page 1`, pageW - 20, footerY);

  doc.save(`balance-sheet-FY-${data.fy}.pdf`);
}
