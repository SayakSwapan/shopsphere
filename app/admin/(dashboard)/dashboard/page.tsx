import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import RevenueChart from "@/components/admin/dashboard/charts/revenue-chart";
import OrdersChart from "@/components/admin/dashboard/charts/order-chart";
import TopProducts from "@/components/admin/dashboard/top-products";
import LatestCustomers from "@/components/admin/dashboard/latest-customers";
import InventoryStatus from "@/components/admin/dashboard/inventory-status";
import { getDashboardAnalytics } from "@/lib/dashboard";
import StatsCard from "@/components/admin/dashboard/stats-card";
import DashboardHeader from "@/components/admin/dashboard/dashboard-header";
import QuickActions from "@/components/admin/dashboard/quick-actions";
import LowStock from "@/components/admin/dashboard/low-stock";
import RecentOrders from "@/components/admin/dashboard/recent-orders";
import PendingItems from "@/components/admin/dashboard/pending-items";

export default async function DashboardPage() {
  let totalProducts = 0;
  let totalOrders = 0;
  let totalCustomers = 0;
  let totalRevenue = 0;
  let todayOrders = 0;
  let todayRevenue = 0;
  let chartData = null;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [products, orders, customers, revenue, tOrders, tRevenue, refundSum, tRefundSum] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: { status: { notIn: ["CANCELLED"] } } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ["CANCELLED"] } } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { notIn: ["CANCELLED"] } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: todayStart }, status: { notIn: ["CANCELLED"] } } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED", completedAt: { not: null } } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED", completedAt: { gte: todayStart } } }),
    ]);

    totalProducts = products;
    totalOrders = orders;
    totalCustomers = customers;
    totalRevenue = Number(revenue._sum.totalAmount ?? 0) - Number(refundSum._sum.amount ?? 0);
    todayOrders = tOrders;
    todayRevenue = Number(tRevenue._sum.totalAmount ?? 0) - Number(tRefundSum._sum.amount ?? 0);

    chartData = await getDashboardAnalytics();
  } catch {
    // DB unavailable, show zeroed dashboard
  }

  return (
    <>
      <DashboardHeader />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6 sm:mb-8">
        <StatsCard
          title="Total Products"
          value={totalProducts}
          icon={<Package size={22} />}
          accent="amber"
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingCart size={22} />}
          accent="blue"
        />
        <StatsCard
          title="Customers"
          value={totalCustomers}
          icon={<Users size={22} />}
          accent="purple"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={22} />}
          accent="emerald"
        />
        <StatsCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString("en-IN")}`}
          subtitle={`${todayOrders} order${todayOrders !== 1 ? "s" : ""} today`}
          icon={<TrendingUp size={22} />}
          accent="amber"
        />
      </div>

      <div className="mb-4 sm:mb-6">
        <PendingItems />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <LowStock />
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {chartData && <RevenueChart data={chartData} />}
        {chartData && <OrdersChart data={chartData} />}
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <TopProducts />
        <LatestCustomers />
        <InventoryStatus />
      </div>
    </>
  );
}
