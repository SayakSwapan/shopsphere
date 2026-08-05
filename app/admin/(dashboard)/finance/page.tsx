"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Briefcase,
  Percent,
  Banknote,
  Coins,
  BookOpen,
  ChevronDown,
  Calculator,
  Info,
} from "lucide-react";

interface FinanceData {
  totalRevenue: number;
  totalOrders: number;
  totalCOGS: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  totalInvestment: number;
  totalTransactionFees: number;
  totalGatewayCharges: number;
  totalGST: number;
  refunds: number;
  expensesByCategory: { name: string; total: number }[];
  monthlyData: { month: string; grossRevenue: number; cogs: number; expenses: number; transactionFees: number; netProfit: number }[];
  settlementSummary: { totalSettled: number; totalGatewayFees: number; totalNetSettlements: number; totalPending: number } | null;
  cashFlow: { totalInflow: number; totalOutflow: number; netCashFlow: number } | null;
}

function fmtCurrency(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toLocaleString("en-IN")}%`;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: "Today",
  weekly: "Last 7 days",
  monthly: "This year (Jan 1 – now)",
};

interface GuideItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  what: string;
  formula: string;
  example: string;
}

const guideItems: GuideItem[] = [
  {
    id: "revenue",
    title: "Total Revenue",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "The total money collected from customers for orders placed in the selected period. This is your top-line sales figure — the gross amount billed on each order (product price + GST + shipping, minus any coupon discount). Cancelled orders are excluded.",
    formula: "Revenue = Σ order.totalAmount (for non-cancelled orders)",
    example: "If you sell 3 items at ₹1,000 each plus ₹18 GST and ₹50 shipping, one order contributes ₹3,068 to revenue.",
  },
  {
    id: "orders",
    title: "Total Orders",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    what: "The number of orders placed in the selected period (cancelled orders are excluded). Use this to measure sales volume and spot trends against revenue.",
    formula: "Total Orders = count of non-cancelled orders",
    example: "20 orders in a week means 20 unique order numbers were created.",
  },
  {
    id: "cogs",
    title: "Cost of Goods Sold (COGS)",
    icon: Receipt,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    what: "How much it actually cost YOU to buy/make the products you sold. It is calculated from the cost price you entered on each product. Each order item uses the costPriceSnapshot captured at checkout, so historical numbers never change — even if you later edit the product's cost price.",
    formula: "COGS = Σ (item.quantity × cost price per item)",
    example: "You sold a shirt that costs you ₹250 (cost price) and sold 2 units → COGS = 2 × ₹250 = ₹500.",
  },
  {
    id: "gross-profit",
    title: "Gross Profit",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "The money left after paying for the goods you sold, before any operating expenses (rent, ads, staff, gateway fees). A positive gross profit means you're selling for more than the goods cost you.",
    formula: "Gross Profit = (Revenue − Refunds) − COGS",
    example: "Revenue ₹3,068 − COGS ₹500 = Gross Profit ₹2,568.",
  },
  {
    id: "gross-margin",
    title: "Gross Margin",
    icon: Percent,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "Gross profit expressed as a percentage of revenue. It shows how efficiently you price vs. your product cost — a higher margin means more room to cover operating costs.",
    formula: "Gross Margin % = (Gross Profit ÷ Revenue) × 100",
    example: "Gross Profit ₹2,568 ÷ Revenue ₹3,068 = 83.7%.",
  },
  {
    id: "expenses",
    title: "Total Expenses",
    icon: TrendingDown,
    color: "text-red-400",
    bg: "bg-red-500/10",
    what: "All operating expenses you recorded for the period (marketing, rent, staff, shipping costs, etc.). These are added manually via Manage Expenses.",
    formula: "Total Expenses = Σ expense.amount in the period",
    example: "Advertising ₹500 + rent ₹1,000 = ₹1,500 expenses.",
  },
  {
    id: "tx-fees",
    title: "Transaction Fees",
    icon: Percent,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    what: "The payment processing charge you configured to pass on for online orders. Calculated from your Transaction Charges rules and stored on each order as transactionFee. COD orders are never charged.",
    formula: "Transaction Fees = Σ order.transactionFee",
    example: "An online order of ₹3,000 with a 2% rule adds ₹60 in transaction fees.",
  },
  {
    id: "gateway",
    title: "Gateway Charges",
    icon: Banknote,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    what: "The fee Razorpay (or your payment gateway) actually deducts per payment — gateway fee plus its GST. This comes from payment transaction records, so it reflects the real bank deduction, not your configured rules.",
    formula: "Gateway Charges = Σ (gatewayFee + gatewayGST) from payment transactions",
    example: "Razorpay charges a ₹30 fee + ₹5 GST → ₹35 gateway charge.",
  },
  {
    id: "net-profit",
    title: "Net Profit",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "Your actual bottom-line profit after ALL costs: product cost, operating expenses, and payment fees. This is the real money you keep.",
    formula: "Net Profit = Gross Profit − Expenses − Transaction Fees − Gateway Charges",
    example: "Gross Profit ₹2,568 − ₹1,500 expenses − ₹60 tx fees − ₹35 gateway = ₹973.",
  },
  {
    id: "net-margin",
    title: "Net Margin",
    icon: Percent,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "Net profit as a percentage of revenue — the share of every rupee you actually keep after all costs.",
    formula: "Net Margin % = (Net Profit ÷ Revenue) × 100",
    example: "Net Profit ₹973 ÷ Revenue ₹3,068 = 31.7%.",
  },
  {
    id: "gst",
    title: "GST Collected",
    icon: Coins,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    what: "The GST charged to customers on their orders. It is calculated per product using its GST % at checkout (gstSnapshot) — if a snapshot is missing it falls back to the order's stored GST.",
    formula: "GST Collected = Σ item.gstSnapshot (fallback: order.gst)",
    example: "An 18% GST product sold for ₹1,000 contributes ₹180 of GST collected.",
  },
  {
    id: "refunds",
    title: "Refunds",
    icon: TrendingDown,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    what: "Money actually returned to customers for returned orders. It is read from the refund ledger — the exact refund amount you recorded when initiating the refund on a return request — not the full order value. Older REFUNDED orders that predate the ledger fall back to their order total so history stays consistent. Refunds reduce your effective revenue.",
    formula: "Refunds = Σ refund.amount (status = COMPLETED); fallback = order.totalAmount for legacy REFUNDED orders",
    example: "A ₹1,000 order is returned and you record a ₹950 refund → Refunds = ₹950, not ₹1,000.",
  },
  {
    id: "investment",
    title: "Total Inventory Investment",
    icon: Briefcase,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    what: "The capital currently tied up in your stock — what you paid for all the products sitting in inventory. Helps you decide when to reorder or run clearance sales.",
    formula: "Inventory Investment = Σ (product.costPrice × product.stock)",
    example: "100 items costing ₹250 each → ₹25,000 invested in inventory.",
  },
  {
    id: "settlement",
    title: "Settlement Summary",
    icon: Banknote,
    color: "text-white",
    bg: "bg-white/5",
    what: "Shows how much money your payment gateway has actually released to you. Settled = paid out, Pending = still held by the gateway. Net Settlements = what reached your bank after gateway fees.",
    formula: "Net Settlement = grossAmount − (gatewayFee + gatewayGST); Settled/Pending split by settlementStatus",
    example: "An order of ₹1,000 with ₹35 gateway charges settles ₹965 to your bank.",
  },
  {
    id: "cashflow",
    title: "Cash Flow",
    icon: Banknote,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    what: "Your actual cash movement: money coming IN (order revenue) vs. money going OUT (expenses + gateway charges). Net Cash Flow tells you if you're cash-positive over the period.",
    formula: "Net Cash Flow = Total Inflow − Total Outflow",
    example: "Inflow ₹10,000 − Outflow ₹3,500 = +₹6,500 net cash flow.",
  },
];

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState<string | null>("revenue");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/finance?period=${period}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [period]);

  if (loading) return <div className="p-8 text-slate-400">Loading finance data...</div>;
  if (!data) return <div className="p-8 text-red-400">Failed to load finance data.</div>;

  const cards: {
    label: string;
    value: number | string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
    isCount?: boolean;
    isPercent?: boolean;
  }[] = [
    { label: "Total Revenue", value: data.totalRevenue, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10", isCount: true },
    { label: "Cost of Goods (COGS)", value: data.totalCOGS, icon: Receipt, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Gross Profit", value: data.grossProfit, icon: DollarSign, color: data.grossProfit >= 0 ? "text-emerald-400" : "text-red-400", bg: data.grossProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "Gross Margin", value: `${fmtPercent(data.grossMargin)}`, icon: Percent, color: "text-emerald-400", bg: "bg-emerald-500/10", isPercent: true },
    { label: "Total Expenses", value: data.totalExpenses, icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Transaction Fees", value: data.totalTransactionFees, icon: Percent, color: "text-rose-400", bg: "bg-rose-500/10" },
    { label: "Gateway Charges", value: data.totalGatewayCharges, icon: Banknote, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Net Profit", value: data.netProfit, icon: DollarSign, color: data.netProfit >= 0 ? "text-emerald-400" : "text-red-400", bg: data.netProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "Net Margin", value: `${fmtPercent(data.netMargin)}`, icon: Percent, color: "text-emerald-400", bg: "bg-emerald-500/10", isPercent: true },
    { label: "GST Collected", value: data.totalGST, icon: Coins, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Refunds", value: data.refunds, icon: TrendingDown, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Finance Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track revenue, cost of goods, expenses, and net profit. COGS is calculated from product cost prices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/refunds"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Banknote size={16} /> View Refunds
          </Link>
          <Link
            href="/admin/finance/expenses"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Receipt size={16} /> Manage Expenses
          </Link>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${period === p ? "bg-amber-500 text-black" : "bg-[#111827] text-slate-400 hover:text-white"}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing data for: <span className="font-bold text-slate-300">{PERIOD_LABELS[period]}</span>
      </p>

      {/* ── GUIDE ── */}
      <div className="rounded-2xl border border-amber-500/25 bg-[#111827] overflow-hidden">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <BookOpen size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-white">Finance Guide — how every number is calculated</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Tap any metric to see what it means, its formula, and a worked example.
              </p>
            </div>
          </div>
          <ChevronDown size={20} className={`text-slate-400 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
        </button>

        {guideOpen && (
          <div className="border-t border-white/5 p-4 sm:p-6">
            <div className="grid gap-2 lg:grid-cols-3">
              {guideItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeGuide === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveGuide(isActive ? null : item.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-white/5 bg-[#0B1624] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg}`}>
                        <Icon size={14} className={item.color} />
                      </div>
                      <span className={`text-sm font-bold ${isActive ? "text-amber-300" : "text-slate-200"}`}>
                        {item.title}
                      </span>
                    </div>

                    {isActive && (
                      <div className="mt-3 space-y-3 text-xs leading-relaxed">
                        <p className="flex gap-2 text-slate-300">
                          <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
                          <span>{item.what}</span>
                        </p>
                        <div className="rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-300">
                          <div className="flex items-center gap-2 pb-1 font-sans text-[10px] uppercase tracking-wider text-slate-500">
                            <Calculator size={11} /> Formula
                          </div>
                          {item.formula}
                        </div>
                        <p className="flex gap-2 text-slate-400">
                          <span className="font-bold text-slate-300">Example:</span>
                          <span>{item.example}</span>
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/5 bg-[#111827] p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                <c.icon size={20} className={c.color} />
              </div>
              <span className="text-sm text-slate-400">{c.label}</span>
            </div>
            <p className={`mt-4 text-2xl font-black ${c.color}`}>
              {c.isCount
                ? Number(c.value || 0).toLocaleString("en-IN")
                : c.isPercent
                ? c.value
                : fmtCurrency(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Owner Insights */}
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Calculator size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Owner Insights</h2>
            <p className="text-xs text-slate-500">Quick ratios to judge how the business is really doing.</p>
          </div>
        </div>

        {data.totalOrders > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Order Value</p>
              <p className="mt-1 text-xl font-black text-white">{fmtCurrency(data.totalRevenue / data.totalOrders)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Revenue ÷ orders. How much a customer spends on average — raise it with bundles or free-shipping minimums.
              </p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profit per Order</p>
              <p className={`mt-1 text-xl font-black ${data.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtCurrency(data.netProfit / data.totalOrders)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Net profit ÷ orders. What each sale actually keeps after every cost.
              </p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">GST as % of Revenue</p>
              <p className="mt-1 text-xl font-black text-blue-400">{fmtPercent(data.totalRevenue > 0 ? (data.totalGST / data.totalRevenue) * 100 : 0)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {fmtCurrency(data.totalGST)} GST collected. This is not your money — set it aside to deposit with the government.
              </p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expense Ratio</p>
              <p className="mt-1 text-xl font-black text-red-400">{fmtPercent(data.totalRevenue > 0 ? (data.totalExpenses / data.totalRevenue) * 100 : 0)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Expenses ÷ revenue. How much of every rupee is consumed by operating costs. Below 30% is healthy for e-commerce.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No orders in this period yet — insights appear once you have sales data.
          </p>
        )}
      </div>

      {/* Total Investment */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#111827] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Briefcase size={20} className="text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">Total Inventory Investment</span>
          </div>
          <p className="text-2xl font-black text-amber-400">
            {fmtCurrency(data.totalInvestment)}
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-500 ml-[52px]">
          Cost price × stock of all products. Track your total capital invested in inventory.
        </p>
      </div>

      {/* Settlement Summary */}
      {data.settlementSummary && (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Settlement Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Settled</p>
              <p className="mt-1 text-lg font-bold text-white">{fmtCurrency(data.settlementSummary.totalSettled)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Gateway Fees</p>
              <p className="mt-1 text-lg font-bold text-rose-400">{fmtCurrency(data.settlementSummary.totalGatewayFees)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Net Settlements</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{fmtCurrency(data.settlementSummary.totalNetSettlements)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="mt-1 text-lg font-bold text-yellow-400">{fmtCurrency(data.settlementSummary.totalPending)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {data.cashFlow && (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Cash Flow</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Total Inflow</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{fmtCurrency(data.cashFlow.totalInflow)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Total Outflow</p>
              <p className="mt-1 text-lg font-bold text-red-400">{fmtCurrency(data.cashFlow.totalOutflow)}</p>
            </div>
            <div className="rounded-xl bg-[#0B1624] p-4">
              <p className="text-xs text-slate-500">Net Cash Flow</p>
              <p className={`mt-1 text-lg font-bold ${(data.cashFlow.netCashFlow ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtCurrency(data.cashFlow.netCashFlow)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expense by Category */}
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Expenses by Category</h2>
        {data.expensesByCategory.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {data.expensesByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between rounded-xl bg-[#0B1624] px-4 py-3">
                <span className="text-sm text-slate-300">{cat.name}</span>
                <span className="text-sm font-bold text-white">{fmtCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trend */}
      {data.monthlyData.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Monthly Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-slate-400">Month</th>
                  <th className="px-4 py-3 text-right text-slate-400">Revenue</th>
                  <th className="px-4 py-3 text-right text-slate-400">COGS</th>
                  <th className="px-4 py-3 text-right text-slate-400">Expenses</th>
                  <th className="px-4 py-3 text-right text-slate-400">Tx Fees</th>
                  <th className="px-4 py-3 text-right text-slate-400">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyData.map((m) => {
                  const netProfit = Number(m.netProfit ?? 0);
                  return (
                    <tr key={m.month} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium text-white">{m.month}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{fmtCurrency(m.grossRevenue)}</td>
                      <td className="px-4 py-3 text-right text-orange-400">{fmtCurrency(m.cogs)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{fmtCurrency(m.expenses)}</td>
                      <td className="px-4 py-3 text-right text-rose-400">{fmtCurrency(m.transactionFees)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtCurrency(netProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
