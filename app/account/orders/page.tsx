import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import OrderCard from "@/components/store/orders/order-card";
import { ShoppingBag } from "lucide-react";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?redirectTo=/account/orders");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?redirectTo=/account/orders");
  }

  const rawOrders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      coupon: {
        select: {
          code: true,
        },
      },
      orderitem: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              gstPercentage: true,
              productimage: true,
              isReturnable: true,
              isReplaceable: true,
              returnDays: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = rawOrders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal ? Number(order.subtotal) : 0,
    gst: order.gst ? Number(order.gst) : 0,
    shipping: order.shipping ? Number(order.shipping) : 0,
    discount: order.discount ? Number(order.discount) : 0,
    orderitem: order.orderitem.map((item) => ({
      ...item,
      price: Number(item.price),
      total: Number(item.total),
    })),
  }));

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top right, color-mix(in srgb, var(--t-primary) 8%, transparent), transparent 35%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <p className="uppercase tracking-[0.3em] text-xs text-primary font-bold">
            Customer Dashboard
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            My Orders
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-text-muted-1 max-w-xl">
            Track your orders, view details, and download invoices.
          </p>
        </div>
      </section>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {orders.length === 0 ? (
          <div
            className="border border-border-card bg-bg-card p-10 sm:p-16 text-center"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-bg-card-nested">
              <ShoppingBag size={32} className="text-text-muted-2" />
            </div>
            <h2
              className="mt-5 sm:mt-6 text-xl sm:text-2xl font-black text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              No Orders Yet
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-text-muted-1">
              Start shopping to see your orders here.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block bg-primary px-8 py-3 font-bold transition hover:opacity-90"
              style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)" }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
