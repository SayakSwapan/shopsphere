import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import DueCollectionsTable from "@/components/admin/offline-sales/due-collections-table";
import DueGuide from "@/components/admin/offline-sales/due-guide";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";
import { getSiteSettings, getOfflinePolicy } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function hoursSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000));
}

export default async function DueCollectionsPage() {
  const settings = await getSiteSettings();
  const offlinePolicy = getOfflinePolicy(settings);
  const reminderHours = offlinePolicy.reminderHours;

  let rows;
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderType: "OFFLINE",
        paymentStatus: { in: ["PENDING", "PAID"] },
        OR: [{ isPartialPayment: true }, { dueAmount: { gt: 0 } }],
      },
      include: {
        user: { select: { name: true, phone: true, email: true, isWalkIn: true } },
        offlinepayment: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ dueAmount: "desc" }, { createdAt: "asc" }],
      take: 200,
    });

    rows = orders.filter((o) => Number(o.dueAmount ?? 0) > 0).map((o) => {
      const due = Number(o.dueAmount ?? 0);
      const paid = Number(o.paidAmount ?? 0);
      const total = Number(o.totalAmount);
      const lastPaymentAt = o.offlinepayment.length > 0 ? o.offlinepayment[0].createdAt : o.createdAt;
      const lastPaymentHoursAgo = hoursSince(lastPaymentAt);
      const customerName = o.user?.name || o.fullName || "Walk-in";
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName,
        phone: o.phone || o.user?.phone || "",
        total,
        paid,
        due,
        lastPaymentHoursAgo,
        overdue: lastPaymentHoursAgo >= reminderHours,
        createdAt: o.createdAt.toISOString(),
        isWalkIn: o.isWalkIn,
        paymentMethodLabel:
          PAYMENT_METHOD_LABELS[o.paymentMethod ?? ""] ?? o.paymentMethod ?? "—",
      };
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Due Collections" subtitle="Outstanding offline balances" />
        <p className="text-red-400">Failed to load due collections.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Due Collections"
        subtitle={`${rows.length} open due sale${rows.length !== 1 ? "s" : ""}`}
        description="Offline sales where the customer has not paid in full. A 24h reminder is shown for every open balance so you can follow up with the customer. No returns are accepted on any due sale."
      />

      <DueGuide />

      <DueCollectionsTable rows={rows} />
    </PageContainer>
  );
}
