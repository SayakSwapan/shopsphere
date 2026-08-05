import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import OrdersTable from "@/components/admin/orders/orders-table";
import {
  getAdminOrderRows,
  ARCHIVED_ORDER_FILTER,
} from "@/lib/order-archive";

export default async function ArchivedOrdersPage() {
  let rows;
  try {
    rows = await getAdminOrderRows(ARCHIVED_ORDER_FILTER);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Archived Orders" subtitle="Failed or unpaid orders" />
        <p className="text-red-400">Failed to load archived orders. Please try again later.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Archived Orders"
        subtitle={`${rows.length} failed / unsuccessful orders`}
        description="Orders where the online payment did not succeed in any way — cancelled, abandoned, or failed. These are not counted as successful orders."
        action={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
            <Archive size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-200">No archived orders</p>
            <p className="mt-1 text-sm text-slate-500">
              There are no failed or unsuccessful payments right now.
            </p>
          </div>
        </div>
      ) : (
        <OrdersTable orders={rows} />
      )}
    </PageContainer>
  );
}
