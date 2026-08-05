"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Clock,
  TriangleAlert,
  BadgeCheck,
  Globe,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: string;
  provider: string;
  domain: string;
  service: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  dueDate: string;
  paidDate: string | null;
  status: string;
  autoRenew: boolean;
  notes: string | null;
}

interface PaymentForm {
  provider: string;
  domain: string;
  service: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  dueDate: string;
  paidDate: string;
  status: string;
  autoRenew: boolean;
  notes: string;
}

const EMPTY_FORM: PaymentForm = {
  provider: "",
  domain: "",
  service: "DOMAIN",
  amount: "",
  currency: "INR",
  paymentMethod: "",
  dueDate: "",
  paidDate: "",
  status: "UNPAID",
  autoRenew: false,
  notes: "",
};

const SERVICES = ["DOMAIN", "HOSTING", "SSL", "EMAIL", "OTHER"];
const PAYMENT_METHODS = ["UPI", "CARD", "NETBANKING", "BANK_TRANSFER", "PAYPAL", "AUTO_RENEW", "OTHER"];

function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
  return `${currency} ${Number(amount).toLocaleString("en-IN")}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function toDateInputValue(d: string): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StatusBadge({ payment }: { payment: Payment }) {
  if (payment.status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
        <BadgeCheck size={12} /> Paid
      </span>
    );
  }

  const days = daysUntil(payment.dueDate);

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-400">
        <TriangleAlert size={12} /> {Math.abs(days)}d overdue
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
        <Clock size={12} /> Due in {days}d
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-300">
      <Clock size={12} /> Due in {days}d
    </span>
  );
}

export default function DomainPaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/domain-payments")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setPayments(d.payments);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load payments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    try {
      const res = await fetch("/api/admin/domain-payments");
      const data = await res.json();
      if (data.success) setPayments(data.payments);
    } catch {
      toast.error("Failed to load payments.");
    }
  }

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let unpaidTotal = 0;
    let overdueTotal = 0;
    let dueSoonTotal = 0;
    let paidYear = 0;
    let nextDue: Payment | null = null;

    for (const p of payments) {
      const amount = Number(p.amount) || 0;
      if (p.status === "PAID") {
        const paidDate = new Date(p.paidDate ?? "");
        if (!Number.isNaN(paidDate.getTime()) && paidDate.getFullYear() === today.getFullYear()) {
          paidYear += amount;
        }
        continue;
      }

      const days = daysUntil(p.dueDate);
      unpaidTotal += amount;
      if (days < 0) overdueTotal += amount;
      if (days >= 0 && days <= 7) dueSoonTotal += amount;
      if (days >= 0 && (!nextDue || new Date(p.dueDate) < new Date(nextDue.dueDate))) {
        nextDue = p;
      }
    }

    return { unpaidTotal, overdueTotal, dueSoonTotal, paidYear, nextDue };
  }, [payments]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(p: Payment) {
    setEditingId(p.id);
    setForm({
      provider: p.provider,
      domain: p.domain,
      service: p.service,
      amount: String(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod ?? "",
      dueDate: toDateInputValue(p.dueDate),
      paidDate: p.paidDate ? toDateInputValue(p.paidDate) : "",
      status: p.status,
      autoRenew: p.autoRenew,
      notes: p.notes ?? "",
    });
    setFormOpen(true);
  }

  async function saveForm() {
    if (!form.provider.trim() || !form.domain.trim() || !form.dueDate) {
      toast.error("Provider, domain and due date are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount) || 0,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        paidDate: form.paidDate ? new Date(form.paidDate).toISOString() : null,
      };

      const res = editingId
        ? await fetch(`/api/admin/domain-payments/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/domain-payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to save.");
        return;
      }

      toast.success(editingId ? "Payment updated." : "Payment added.");
      setFormOpen(false);
      await reload();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(id: string) {
    try {
      const res = await fetch(`/api/admin/domain-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to update.");
        return;
      }
      toast.success("Marked as paid.");
      await reload();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  async function deletePayment(id: string) {
    try {
      const res = await fetch(`/api/admin/domain-payments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to delete.");
        return;
      }
      toast.success("Payment deleted.");
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Domains &amp; Bills</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track domain renewals, hosting and other recurring charges — never miss a due date.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#0A0F1E] transition hover:bg-amber-400"
        >
          <Plus size={18} /> Add Payment
        </button>
      </div>

      {summary.nextDue && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Next upcoming charge: <strong>{summary.nextDue.provider}</strong> ({summary.nextDue.domain}) —{" "}
          <strong>{formatMoney(Number(summary.nextDue.amount), summary.nextDue.currency)}</strong> due on{" "}
          {new Date(summary.nextDue.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
          ({daysUntil(summary.nextDue.dueDate)} days).
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding</p>
            <Wallet size={16} className="text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{formatMoney(summary.unpaidTotal, "INR")}</p>
          <p className="mt-1 text-xs text-slate-500">Unpaid + overdue</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue</p>
            <TriangleAlert size={16} className="text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-400">{formatMoney(summary.overdueTotal, "INR")}</p>
          <p className="mt-1 text-xs text-slate-500">Past due date</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due within 7 days</p>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{formatMoney(summary.dueSoonTotal, "INR")}</p>
          <p className="mt-1 text-xs text-slate-500">Pay these soon</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Paid this year</p>
            <BadgeCheck size={16} className="text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{formatMoney(summary.paidYear, "INR")}</p>
          <p className="mt-1 text-xs text-slate-500">Year to date</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-slate-400">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-12 text-center">
          <Globe size={40} className="mx-auto mb-4 text-slate-600" />
          <p className="text-lg font-semibold text-white">No payments tracked yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your domain registrar, hosting and other recurring charges.</p>
          <button onClick={openCreate} className="mt-5 text-sm font-bold text-amber-400 hover:text-amber-300">
            Add your first payment →
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-4 text-left text-slate-400">Provider</th>
                  <th className="px-5 py-4 text-left text-slate-400">Service</th>
                  <th className="px-5 py-4 text-right text-slate-400">Amount</th>
                  <th className="px-5 py-4 text-left text-slate-400">Payment Method</th>
                  <th className="px-5 py-4 text-left text-slate-400">Due Date</th>
                  <th className="px-5 py-4 text-left text-slate-400">Status</th>
                  <th className="px-5 py-4 text-right text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className={`border-b border-white/5 transition hover:bg-white/[0.02] ${p.status === "PAID" ? "opacity-70" : ""}`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{p.provider}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.domain}
                        {p.autoRenew && <span className="ml-2 text-blue-400">auto-renew</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                        {p.service}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-white">
                      {formatMoney(Number(p.amount), p.currency)}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {p.paymentMethod ? (
                        p.paymentMethod.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {p.paidDate && (
                        <p className="text-xs text-emerald-400">
                          Paid {new Date(p.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge payment={p} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== "PAID" && (
                          <button
                            onClick={() => markPaid(p.id)}
                            title="Mark as paid"
                            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/25"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit"
                          className="rounded-lg bg-slate-500/15 p-2 text-slate-300 transition hover:bg-slate-500/25"
                        >
                          <Pencil size={14} />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button title="Delete" className="rounded-lg bg-red-500/15 p-2 text-red-400 transition hover:bg-red-500/25">
                              <Trash2 size={14} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-slate-700 bg-[#111827] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                {p.provider} — {p.domain}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePayment(p.id)} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Edit Payment" : "Add Payment"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 transition hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Provider *</label>
                  <input
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder="GoDaddy, Namecheap, BigRock..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Domain *</label>
                  <input
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    placeholder="myshop.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Service</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  >
                    {SERVICES.map((s) => (
                      <option key={s} value={s} className="bg-[#111827]">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1499"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  >
                    <option value="INR" className="bg-[#111827]">INR (₹)</option>
                    <option value="USD" className="bg-[#111827]">USD ($)</option>
                    <option value="EUR" className="bg-[#111827]">EUR (€)</option>
                    <option value="GBP" className="bg-[#111827]">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  >
                    <option value="" className="bg-[#111827]">— Select —</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m} className="bg-[#111827]">{m.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  >
                    <option value="UNPAID" className="bg-[#111827]">Unpaid</option>
                    <option value="PAID" className="bg-[#111827]">Paid</option>
                  </select>
                </div>
              </div>

              {form.status === "PAID" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Paid Date</label>
                  <input
                    type="date"
                    value={form.paidDate}
                    onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Registrar account #, renewal cycle..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.autoRenew}
                  onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })}
                  className="h-4 w-4 accent-amber-500"
                />
                Auto-renew is enabled on this plan
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveForm}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#0A0F1E] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Payment"}
                </button>
                <button
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
