import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import OfflineOrderDetail from "@/components/admin/offline-sales/offline-order-detail";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, getInvoiceBusiness } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OfflineSaleDetailPage({ params }: Props) {
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
        stockmovement: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getSiteSettings(),
  ]);

  if (!order || order.orderType !== "OFFLINE") notFound();

  const business = getInvoiceBusiness(settings);

  return (
    <PageContainer>
      <Link
        href="/admin/offline-sales"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Offline Sales
      </Link>

      <OfflineOrderDetail order={order} business={business} />
    </PageContainer>
  );
}
