import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LoyaltyCustomersTable } from "@/components/admin/loyalty/customer-loyalty-table";

export const metadata = { title: "Customer Loyalty" };

export const dynamic = "force-dynamic";

export default async function CustomerLoyaltyPage() {
  const rows = await prisma.customerLoyalty.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    take: 500,
  });

  return (
    <div className="max-w-6xl">
      <div className="px-6 py-4 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold text-white">Customer Loyalty</h1>
        <p className="text-sm text-slate-400 mt-1">
          Loyalty progress and rewards for all participating customers
        </p>
      </div>
      <div className="p-6">
        <LoyaltyCustomersTable
          customers={rows.map((r) => ({
            id: r.customer.id,
            name: r.customer.name ?? "Unknown",
            email: r.customer.email,
            phone: r.customer.phone,
            purchaseCount: r.currentPurchaseCount,
            cycleNumber: r.currentCycleNumber,
            availableReward: r.availableReward,
            earned: r.totalRewardsEarned,
            redeemed: r.totalRewardsRedeemed,
            discountReceived: Number(r.totalDiscountReceived),
            updatedAt: r.updatedAt,
          }))}
        />
      </div>
    </div>
  );
}