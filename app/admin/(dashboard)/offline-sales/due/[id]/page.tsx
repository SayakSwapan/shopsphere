import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import DueOrderDetail from "@/components/admin/offline-sales/due-order-detail";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, getInvoiceBusiness, getOfflinePolicy } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DueSaleDetailPage({ params }: Props) {
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, isWalkIn: true },
        },
        createdBy: { select: { name: true, email: true } },
        orderitem: {
          include: { product: { select: { id: true, name: true, category: { select: { name: true } } } } },
        },
        offlinepayment: {
          orderBy: { createdAt: "desc" },
          include: { recordedBy: { select: { name: true } } },
        },
        stockmovement: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getSiteSettings(),
  ]);

  if (!order || order.orderType !== "OFFLINE") notFound();
  if (!(Number(order.dueAmount ?? 0) > 0)) notFound();

  const business = getInvoiceBusiness(settings);
  const offlinePolicy = getOfflinePolicy(settings);

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/offline-sales/due"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Due Collections
        </Link>
      </div>

      <DueOrderDetail order={order} business={business} offlinePolicy={offlinePolicy} />
    </PageContainer>
  );
}
