import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const [totalOrders, pendingOrders, deliveredOrders, wishlistCount] =
    await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.order.count({
        where: { userId: user.id, status: "PENDING" },
      }),
      prisma.order.count({
        where: { userId: user.id, status: "DELIVERED" },
      }),
      prisma.wishlistitem.count({
        where: { wishlist: { userId: user.id } },
      }),
      prisma.address.count({ where: { userId: user.id } }),
    ]);

  const recentOrders = await prisma.order.findMany({
    where: { userId: user.id },
    take: 3,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PAID: "bg-blue-100 text-blue-700",
    PACKED: "bg-indigo-100 text-indigo-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{ background: "color-mix(in srgb, var(--t-primary) 8%, transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <p
            className="uppercase tracking-[0.3em] text-xs text-primary font-bold"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            My Account
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Welcome Back
          </h1>
          <p className="mt-3 text-text-muted-1 max-w-xl">
            Manage your orders, profile, addresses and
            account settings from one place.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* User Card + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* User Info Card */}
          <div className="lg:col-span-4">
            <div
              className="border border-border-card bg-bg-card p-5 sm:p-8"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shrink-0" style={{ color: "var(--t-bg-page)" }}>
                  <User size={30} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-text-heading truncate">
                    {user.name || "Customer"}
                  </h2>
                  <p className="text-sm text-text-muted-1 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                {user.isVerified ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-green-100 text-green-700"
                    style={{ borderRadius: "var(--t-radius-badge)" }}
                  >
                    <CheckCircle size={12} />
                    Verified
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700"
                    style={{ borderRadius: "var(--t-radius-badge)" }}
                  >
                    <Clock size={12} />
                    Unverified
                  </span>
                )}
                {user.phone && (
                  <span
                    className="bg-bg-card-nested px-3 py-1 text-xs text-text-muted-2"
                    style={{ borderRadius: "var(--t-radius-badge)" }}
                  >
                    {user.phone}
                  </span>
                )}
              </div>

              {/* Quick Links */}
              <div className="mt-8 space-y-2">
                {[
                  {
                    label: "My Orders",
                    href: "/account/orders",
                    icon: ShoppingBag,
                  },
                  {
                    label: "Profile Settings",
                    href: "/account/profile",
                    icon: User,
                  },
                  {
                    label: "Saved Addresses",
                    href: "/account/addresses",
                    icon: MapPin,
                  },
                  {
                    label: "Wishlist",
                    href: "/wishlist",
                    icon: Heart,
                  },
                  {
                    label: "My Returns & Replacements",
                    href: "/account/requests",
                    icon: RotateCcw,
                  },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-bg-card-nested transition-colors group"
                    style={{ borderRadius: "var(--t-radius-card)" }}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon
                        size={18}
                        className="text-text-muted-2 group-hover:text-primary transition-colors"
                      />
                      <span className="text-sm font-medium text-text-muted-1 group-hover:text-text-heading transition-colors">
                        {link.label}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-muted-3 group-hover:text-text-muted-1 transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Stats + Recent Orders */}
          <div className="lg:col-span-8 space-y-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: totalOrders,
                  icon: Package,
                  color: "text-blue-600",
                  bg: "bg-blue-100",
                },
                {
                  label: "Pending",
                  value: pendingOrders,
                  icon: Clock,
                  color: "text-yellow-600",
                  bg: "bg-yellow-100",
                },
                {
                  label: "Delivered",
                  value: deliveredOrders,
                  icon: CheckCircle,
                  color: "text-green-600",
                  bg: "bg-green-100",
                },
                {
                  label: "Wishlist",
                  value: wishlistCount,
                  icon: Heart,
                  color: "text-pink-600",
                  bg: "bg-pink-100",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-border-card bg-bg-card p-5"
                  style={{ borderRadius: "var(--t-radius-card)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted-1 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <div
                      className={`h-9 w-9 flex items-center justify-center ${stat.bg}`}
                      style={{ borderRadius: "var(--t-radius-button)" }}
                    >
                      <stat.icon size={18} className={stat.color} />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-black text-text-heading">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="border border-border-card bg-bg-card overflow-hidden" style={{ borderRadius: "var(--t-radius-card)" }}>
              <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-primary" />
                  <h2
                    className="text-lg font-bold text-text-heading"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    Recent Orders
                  </h2>
                </div>
                <Link
                  href="/account/orders"
                  className="text-xs font-semibold text-primary hover:opacity-80 transition-colors uppercase tracking-wider"
                >
                  View All
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                  <ShoppingBag size={40} className="mx-auto text-text-muted-3" />
                  <p className="mt-4 text-sm text-text-muted-1">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 inline-block text-sm font-bold text-primary hover:opacity-80 transition-colors"
                  >
                    Start Shopping &rarr;
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 hover:bg-bg-card-nested transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center bg-bg-card-nested"
                          style={{ borderRadius: "var(--t-radius-button)" }}
                        >
                          <Package size={18} className="text-text-muted-2" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-heading">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-text-muted-2 mt-0.5">
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px] font-bold ${statusColors[order.status] || "bg-slate-500/15 text-slate-400"}`}
                          style={{ borderRadius: "var(--t-radius-badge)" }}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <p className="text-sm font-bold text-text-heading">
                          ₹
                          {Number(
                            order.totalAmount
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Browse Products",
                  href: "/products",
                  icon: ShoppingBag,
                  description: "Discover our latest collection",
                },
                {
                  label: "Track Orders",
                  href: "/account/orders",
                  icon: Package,
                  description: "Check your order status",
                },
                {
                  label: "Edit Profile",
                  href: "/account/profile",
                  icon: User,
                  description: "Update your information",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group border border-border-card bg-bg-card p-6 hover:border-primary/30 transition-colors"
                  style={{ borderRadius: "var(--t-radius-card)" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors"
                    style={{ borderRadius: "var(--t-radius-button)" }}
                  >
                    <action.icon size={20} className="text-primary" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-text-heading">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted-2">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
