export interface BalanceSheetData {
  fy: string;
  summary: {
    grossRevenue: number;
    refunds: number;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    gst: number;
    totalOrders: number;
    totalReturns: number;
  };
  monthly: {
    month: string;
    grossRevenue: number;
    refunds: number;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    gst: number;
    orders: number;
    returns: number;
  }[];
  expenseBreakdown: { name: string; total: number }[];
  paymentBreakdown: { cod: number; razorpay: number };
}

function csvEscape(val: string | number): string {
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export function generateBalanceSheetCSV(data: BalanceSheetData): Blob {
  const rows: string[] = [];

  rows.push(["Balance Sheet — FY " + data.fy].join(","));
  rows.push(["Generated", new Date().toLocaleDateString("en-IN")].map(csvEscape).join(","));
  rows.push("");

  rows.push(["SUMMARY"].join(","));
  rows.push(["Metric", "Value"].map(csvEscape).join(","));
  rows.push(["Gross Revenue", data.summary.grossRevenue].map(csvEscape).join(","));
  rows.push(["Refunds", data.summary.refunds].map(csvEscape).join(","));
  rows.push(["Net Revenue", data.summary.netRevenue].map(csvEscape).join(","));
  rows.push(["Cost of Goods Sold", data.summary.cogs].map(csvEscape).join(","));
  rows.push(["Gross Profit", data.summary.grossProfit].map(csvEscape).join(","));
  rows.push(["Total Expenses", data.summary.totalExpenses].map(csvEscape).join(","));
  rows.push(["Net Profit", data.summary.netProfit].map(csvEscape).join(","));
  rows.push(["GST Collected", data.summary.gst].map(csvEscape).join(","));
  rows.push(["Total Orders", data.summary.totalOrders].map(csvEscape).join(","));
  rows.push(["Total Returns", data.summary.totalReturns].map(csvEscape).join(","));
  rows.push("");

  rows.push(["MONTHLY BREAKDOWN"].join(","));
  rows.push(["Month", "Gross Revenue", "Refunds", "Net Revenue", "COGS", "Gross Profit", "Expenses", "Net Profit", "GST", "Orders", "Returns"].map(csvEscape).join(","));
  for (const m of data.monthly) {
    rows.push([m.month, m.grossRevenue, m.refunds, m.netRevenue, m.cogs, m.grossProfit, m.expenses, m.netProfit, m.gst, m.orders, m.returns].map(csvEscape).join(","));
  }
  rows.push("");

  if (data.expenseBreakdown.length > 0) {
    rows.push(["EXPENSE BREAKDOWN"].join(","));
    rows.push(["Category", "Amount"].map(csvEscape).join(","));
    for (const e of data.expenseBreakdown) {
      rows.push([e.name, e.total].map(csvEscape).join(","));
    }
    rows.push("");
  }

  rows.push(["PAYMENT BREAKDOWN"].join(","));
  rows.push(["Method", "Amount"].map(csvEscape).join(","));
  rows.push(["COD", data.paymentBreakdown.cod].map(csvEscape).join(","));
  rows.push(["Razorpay", data.paymentBreakdown.razorpay].map(csvEscape).join(","));

  return new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
}

export function downloadCSV(data: BalanceSheetData) {
  const blob = generateBalanceSheetCSV(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `balance-sheet-FY-${data.fy}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
