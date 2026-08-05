import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Percent, Pencil, Trash2 } from "lucide-react";
import DeleteButton from "@/components/admin/common/delete-button";

export default async function TransactionChargesPage() {
  const charges = await prisma.transactionCharge.findMany({
    orderBy: [{ sortOrder: "asc" }, { minAmount: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Transaction Charges</h1>
          <p className="mt-1 text-sm text-slate-500">
            Define fee rules for payment transactions. Rules are evaluated in sort order &mdash; the first matching rule applies.
          </p>
        </div>
        <Link
          href="/admin/transaction-charges/new"
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-black hover:bg-amber-400"
        >
          <Plus size={16} />
          Add Charge Rule
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="px-6 py-4 font-semibold">#</th>
              <th className="px-6 py-4 font-semibold">Amount Range</th>
              <th className="px-6 py-4 font-semibold">Fee</th>
              <th className="px-6 py-4 font-semibold">Sort</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No transaction charge rules defined.{" "}
                  <Link href="/admin/transaction-charges/new" className="text-amber-400 underline">Add one</Link>
                </td>
              </tr>
            )}
            {charges.map((c, i) => (
              <tr key={c.id} className="border-t border-slate-700 hover:bg-[#0F172A]">
                <td className="px-6 py-4 text-slate-400">{i + 1}</td>
                <td className="px-6 py-4 text-white font-medium">
                  ₹{Number(c.minAmount).toLocaleString("en-IN")}
                  {" — "}
                  {c.maxAmount ? `₹${Number(c.maxAmount).toLocaleString("en-IN")}` : "∞"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                    <Percent size={11} />
                    {c.feeType === "PERCENT" ? `${Number(c.feeValue)}%` : `₹${Number(c.feeValue).toLocaleString("en-IN")}`}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{c.sortOrder}</td>
                <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{c.description || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/transaction-charges/${c.id}/edit`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton
                      id={c.id}
                      endpoint="/api/admin/transaction-charges"
                      redirectPath="/admin/transaction-charges"
                      label="Delete this charge rule?"
                    >
                      <Trash2 size={15} />
                    </DeleteButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
