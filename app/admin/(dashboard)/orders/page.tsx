import Link from "next/link";
import { Archive } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import OrdersTable from "@/components/admin/orders/orders-table";
import {
  getAdminOrderRows,
  SUCCESSFUL_ORDER_FILTER,
} from "@/lib/order-archive";

export default async function OrdersPage() {
  let rows;
  try {
    rows = await getAdminOrderRows(SUCCESSFUL_ORDER_FILTER);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Orders" subtitle="Manage all orders" />
        <p className="text-red-400">Failed to load orders. Please try again later.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        subtitle={`${rows.length} successful orders`}
        description="View and manage successful customer orders. Update order status, track payments, print invoices, and handle returns. Failed or unpaid orders are moved to the archived list."
        action={
          <Link
            href="/admin/orders/archived"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Archive size={16} />
            Archived Orders
          </Link>
        }
      />

      <OrdersTable orders={rows} />
    </PageContainer>
  );
}
