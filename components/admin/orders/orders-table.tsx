"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { OrderRow, orderHeaders } from "@/components/admin/orders/order-columns";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants/order-status";

interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  shipping: number | null;
  discount: number | null;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { name: string; email: string } | null;
  _count: { orderitem: number };
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <FilterableTable
      data={orders}
      searchFields={["orderNumber", "fullName", "user.name", "user.email"]}
      headers={orderHeaders}
      pageSize={20}
      filters={[
        {
          key: "status",
          label: "Status",
          options: ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
        },
      ]}
      renderRow={(order) => (
        <OrderRow key={order.id} order={order} />
      )}
    />
  );
}
