import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  SHIPPED: "bg-purple-500/15 text-purple-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
  RETURNED: "bg-orange-500/15 text-orange-400",
};

export default async function RecentOrders() {
  const orders = await prisma.order.findMany({
    take: 6,
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Recent Orders</h2>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-xs font-bold text-amber-400 transition hover:text-amber-300"
        >
          View all <ExternalLink size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-left text-xs font-semibold text-slate-500">Order</th>
                <th className="pb-3 text-left text-xs font-semibold text-slate-500">Customer</th>
                <th className="pb-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                  <td className="py-3.5 font-semibold text-white">{order.orderNumber}</td>
                  <td className="py-3.5 text-slate-400">{order.user.name || "—"}</td>
                  <td className="py-3.5">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || "bg-slate-500/15 text-slate-400"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-amber-400">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
