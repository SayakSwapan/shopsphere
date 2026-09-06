import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CustomerActions from "@/components/admin/customers/customer-actions";
import { getCustomerLoyaltyStatus } from "@/lib/loyalty";
import { formatCurrency } from "@/lib/format";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const customer =
    await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        addresses: {
          orderBy: {
            isDefault: "desc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        review: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        wishlist: {
          include: {
            wishlistitem: {
              include: {
                product: true,
              },
            },
          },
        },
        cart: {
          include: {
            cartitem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

  if (!customer) {
    notFound();
  }

  const loyaltyStatus = await getCustomerLoyaltyStatus(customer.id);

  const [loyaltyPurchasesCount, loyaltyRedemptionsCount] = await Promise.all([
    prisma.loyaltyPurchase.count({
      where: { customerId: customer.id },
    }),
    prisma.loyaltyRewardRedemption.count({
      where: { customerId: customer.id },
    }),
  ]);

  const rewardStatus = loyaltyStatus?.availableReward ?? "PENDING";
  const rewardBadge: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: "Reward Available", cls: "bg-emerald-500/20 text-emerald-400" },
    PENDING: { label: "In Progress", cls: "bg-slate-500/20 text-slate-400" },
    REDEED: { label: "Redeemed", cls: "bg-blue-500/20 text-blue-400" },
    EXPIRED: { label: "Expired", cls: "bg-red-500/20 text-red-400" },
    REVOKED: { label: "Revoked", cls: "bg-orange-500/20 text-orange-400" },
  };
  const lb = rewardBadge[rewardStatus] ?? rewardBadge.PENDING;
  const progressPct = loyaltyStatus
    ? Math.min(
        100,
        (loyaltyStatus.currentPurchaseCount / loyaltyStatus.requiredPurchases) *
          100
      )
    : 0;

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Customer Details
          </h1>

          <p className="text-slate-400">
            {customer.email}
          </p>

        </div>

        <CustomerActions
          customerId={customer.id}
          isVerified={customer.isVerified}
          isActive={customer.isActive}
          phone={customer.phone}
        />

      </div>

      {/* CUSTOMER INFO */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-5">
          Basic Information
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <Info
            title="Name"
            value={customer.name ?? "-"}
          />

          <Info
            title="Email"
            value={customer.email}
          />

          <Info
            title="Phone"
            value={customer.phone ?? "-"}
          />

          <Info
            title="Joined"
            value={customer.createdAt.toLocaleDateString()}
          />

          <Info
            title="Email Verified"
            value={
              customer.emailVerified
                ? "Yes"
                : "No"
            }
          />

          <Info
            title="Phone Verified"
            value={
              customer.phoneVerified
                ? "Yes"
                : "No"
            }
          />

          <Info
            title="Status"
            value={
              customer.isActive
                ? "Active"
                : "Inactive"
            }
          />

          <Info
            title="Verified"
            value={
              customer.isVerified
                ? "Verified"
                : "Pending"
            }
          />

        </div>

      </div>

      {/* LOYALTY & REWARDS */}
      {loyaltyStatus && (
        <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">
              Loyalty &amp; Rewards
            </h2>
            <Link
              href={`/admin/loyalty/customers/${customer.id}`}
              className="rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/25"
            >
              Manage Loyalty →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="rounded-xl bg-slate-900 p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Reward Status</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${lb.cls}`}>
                  {lb.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {loyaltyStatus.badgeName || "Loyalty Member"}
              </p>
              {loyaltyStatus.hasAvailableReward &&
              loyaltyStatus.rewardExpiresAt ? (
                <p className="mt-1 text-xs text-slate-400">
                  Expires {loyaltyStatus.rewardExpiresAt.toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Cycle #{loyaltyStatus.currentCycleNumber}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-900 p-5 border border-slate-700">
              <p className="text-sm text-slate-500">Cycle Progress</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-black text-white">
                  {loyaltyStatus.currentPurchaseCount}
                </span>
                <span className="text-slate-400 mb-0.5 text-sm">
                  / {loyaltyStatus.requiredPurchases} purchases
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {loyaltyStatus.totalRewardsEarned} earned ·{" "}
                {loyaltyStatus.totalRewardsRedeemed} redeemed
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 p-5 border border-slate-700">
              <p className="text-sm text-slate-500">Discount Received</p>
              <p className="mt-2 text-2xl font-black text-emerald-400">
                {formatCurrency(loyaltyStatus.totalDiscountReceived)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Lifetime savings across cycles
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 p-5 border border-slate-700">
              <p className="text-sm text-slate-500">Activity</p>
              <p className="mt-2 text-2xl font-black text-white">
                {loyaltyPurchasesCount}
                <span className="text-sm text-slate-400 font-semibold">
                  {" "}
                  counted purchase{loyaltyPurchasesCount !== 1 ? "s" : ""}
                </span>
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {loyaltyRedemptionsCount}
                <span className="text-sm text-slate-400 font-semibold">
                  {" "}
                  redemption{loyaltyRedemptionsCount !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESSES */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-6">
          Saved Addresses
        </h2>

        <div className="grid lg:grid-cols-2 gap-5">

          {customer.addresses.map((address) => (

            <div
              key={address.id}
              className="rounded-xl bg-slate-900 p-5 border border-slate-700"
            >

              <div className="flex justify-between">

                <h3 className="font-bold text-white">
                  {address.fullName}
                </h3>

                {address.isDefault && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                    Default
                  </span>
                )}

              </div>

              <div className="mt-3 text-slate-400 space-y-1">

                <p>{address.phone}</p>

                <p>{address.addressLine1}</p>

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {address.city},{" "}
                  {address.state}
                </p>

                <p>{address.pincode}</p>

                <p>{address.country}</p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* ORDERS */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-5">
          Recent Orders
        </h2>

        <div className="space-y-4">

          {customer.orders.map((order) => (

            <div
              key={order.id}
              className="rounded-xl bg-slate-900 p-4 flex justify-between"
            >

              <div>

                <p className="text-white font-semibold">
                  {order.orderNumber}
                </p>

                <p className="text-slate-400">
                  {order.status}
                </p>

              </div>

              <div className="text-right">

                <p className="font-bold text-amber-400">
                  ₹{Number(order.totalAmount)}
                </p>

                <p className="text-slate-500 text-sm">
                  {order.createdAt.toLocaleDateString()}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-white font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}