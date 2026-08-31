import Link from "next/link";
import { Plus } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import OfflineSalesTable from "@/components/admin/offline-sales/offline-sales-table";
import OfflineSalesGuide from "@/components/admin/offline-sales/offline-sales-guide";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";

export const dynamic = "force-dynamic";

export default async function OfflineSalesPage() {
  let orders;
  try {
    const rows = await prisma.order.findMany({
      where: { orderType: "OFFLINE" },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        _count: { select: { orderitem: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    orders = rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      fullName: o.fullName,
      phone: o.phone,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      paymentMethodLabel:
        PAYMENT_METHOD_LABELS[o.paymentMethod ?? ""] ?? o.paymentMethod,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
      isWalkIn: o.isWalkIn,
      user: o.user
        ? { name: o.user.name ?? "", phone: o.user.phone ?? "", email: o.user.email }
        : null,
      _count: { orderitem: o._count.orderitem },
    }));
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Offline Sales" subtitle="Point-of-sale orders" />
        <p className="text-red-400">
          Failed to load offline sales. Please try again later.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Offline Sales"
        subtitle={`${orders.length} offline (POS) orders`}
        description="Record and manage walk-in / point-of-sale sales. Offline sales share the same inventory and GST logic as online orders but allow controlled bargaining down to each product's Last Selling Price."
        action={
          <Link
            href="/admin/offline-sales/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Plus size={16} />
            Create Offline Sale
          </Link>
        }
      />

      <OfflineSalesGuide />

      <OfflineSalesTable orders={orders} />
    </PageContainer>
  );
}
