import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import { LoyaltyProgressCard, LoyaltyStars } from "@/components/loyalty/loyalty-badge-card";
import {
  getLoyaltyProgram,
  getCustomerLoyaltyStatus,
  getCustomerLoyaltyHistory,
} from "@/lib/loyalty";
import {
  Award,
  Gift,
  ShoppingBag,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "My Loyalty Rewards",
};

export default async function LoyaltyPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?redirectTo=/account/loyalty");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });

  if (!user) {
    redirect("/login?redirectTo=/account/loyalty");
  }

  const [program, status, history] = await Promise.all([
    getLoyaltyProgram(),
    getCustomerLoyaltyStatus(user.id),
    getCustomerLoyaltyHistory(user.id),
  ]);

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{ background: "color-mix(in srgb, var(--t-primary) 8%, transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p
            className="uppercase tracking-[0.3em] text-xs text-primary font-bold"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Rewards
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            My Loyalty Rewards
          </h1>
          <p className="mt-3 text-text-muted-1 max-w-xl">
            Earn rewards with every purchase. Complete your purchase goal and unlock exclusive discounts.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!program.isActive ? (
          <div className="rounded-2xl border border-border-card bg-bg-card p-10 text-center">
            <Award size={48} className="mx-auto text-text-muted-3" />
            <h3 className="mt-4 text-lg font-bold text-text-heading">Loyalty Program Paused</h3>
            <p className="mt-2 text-sm text-text-muted-1">
              Our loyalty rewards program is currently not accepting new activity. Check back soon!
            </p>
          </div>
        ) : status ? (
          <div className="space-y-8">
            {/* Progress Card */}
            <LoyaltyProgressCard
              purchaseCount={status.currentPurchaseCount}
              requiredPurchases={status.requiredPurchases}
              availableReward={status.hasAvailableReward}
              discountLabel={
                status.discountType === "PERCENTAGE"
                  ? `${status.discountValue}% discount`
                  : `₹${status.discountValue} off`
              }
              design={{
                badgeName: status.badgeName,
                badgeBackgroundColor: status.badgeBackgroundColor,
                badgeTextColor: status.badgeTextColor,
                badgeBorderColor: status.badgeBorderColor,
                badgeIcon: status.badgeIcon,
                badgeImage: status.badgeImage,
                badgeDescription: status.badgeDescription,
              }}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Rewards Earned",
                  value: status.totalRewardsEarned,
                  icon: Award,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Rewards Redeemed",
                  value: status.totalRewardsRedeemed,
                  icon: Gift,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                },
                {
                  label: "Discount Received",
                  value: `₹${status.totalDiscountReceived.toLocaleString("en-IN")}`,
                  icon: TrendingDown,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Current Cycle",
                  value: `#${status.currentCycleNumber}`,
                  icon: TrendingUp,
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-border-card bg-bg-card p-4 sm:p-5"
                  style={{ borderRadius: "var(--t-radius-card)" }}
                >
                  <div className={`h-9 w-9 flex items-center justify-center ${stat.bg}`} style={{ borderRadius: "var(--t-radius-button)" }}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <p className="mt-3 text-2xl font-black text-text-heading">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-text-muted-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="border border-border-card bg-bg-card overflow-hidden" style={{ borderRadius: "var(--t-radius-card)" }}>
              <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-border-subtle flex items-center gap-3">
                <Star size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                  How It Works
                </h2>
              </div>
              <div className="px-5 sm:px-8 py-6 grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                  <div>
                    <p className="font-semibold text-sm text-text-heading">Shop &amp; Complete Purchases</p>
                    <p className="mt-1 text-xs text-text-muted-2 leading-relaxed">
                      Every eligible online or offline purchase counts toward your progress.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                  <div>
                    <p className="font-semibold text-sm text-text-heading">Unlock Your Reward</p>
                    <p className="mt-1 text-xs text-text-muted-2 leading-relaxed">
                      Complete {status.requiredPurchases} purchases and your reward badge is unlocked automatically.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                  <div>
                    <p className="font-semibold text-sm text-text-heading">Enjoy Your Discount</p>
                    <p className="mt-1 text-xs text-text-muted-2 leading-relaxed">
                      The discount is applied automatically on your next eligible purchase. New cycle starts instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty History */}
            <div className="border border-border-card bg-bg-card overflow-hidden" style={{ borderRadius: "var(--t-radius-card)" }}>
              <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift size={20} className="text-primary" />
                  <h2 className="text-lg font-bold text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                    My Loyalty History
                  </h2>
                </div>
              </div>

              {history.cycles.length === 0 ? (
                <div className="px-5 sm:px-8 py-10 text-center">
                  <ShoppingBag size={36} className="mx-auto text-text-muted-3" />
                  <p className="mt-4 text-sm text-text-muted-1">No loyalty cycles yet. Start shopping to begin earning!</p>
                  <Link
                    href="/products"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
                  >
                    Start Shopping <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wider text-text-muted-2">
                        <th className="px-5 sm:px-8 py-3 font-semibold">Cycle</th>
                        <th className="px-4 py-3 font-semibold">Purchases</th>
                        <th className="px-4 py-3 font-semibold">Reward</th>
                        <th className="px-4 py-3 font-semibold">Source</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {history.cycles.map((cycle) => (
                        <tr key={cycle.cycleNumber} className="hover:bg-bg-card-nested transition-colors">
                          <td className="px-5 sm:px-8 py-4 font-semibold text-text-heading">
                            Cycle #{cycle.cycleNumber}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <LoyaltyStars
                                purchaseCount={cycle.completedPurchases}
                                requiredPurchases={cycle.requiredPurchases}
                                color={status.badgeBackgroundColor}
                              />
                            </div>
                            <p className="mt-1 text-xs text-text-muted-2">
                              {cycle.completedPurchases} / {cycle.requiredPurchases}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {cycle.discountType === "PERCENTAGE"
                              ? `${cycle.discountValue}%`
                              : `₹${cycle.discountValue.toLocaleString("en-IN")}`}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1.5">
                              {cycle.sourceBreakdown.online > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
                                  Online ×{cycle.sourceBreakdown.online}
                                </span>
                              )}
                              {cycle.sourceBreakdown.offline > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">
                                  Offline ×{cycle.sourceBreakdown.offline}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={cycle.status} />
                          </td>
                          <td className="px-4 py-4 text-text-muted-2 whitespace-nowrap">
                            {new Date(cycle.startedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {status.totalDiscountReceived > 0 && (
                <div className="px-5 sm:px-8 py-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-text-muted-2">
                    Total savings from loyalty rewards
                  </p>
                  <p className="text-lg font-black text-green-500">
                    −₹{status.totalDiscountReceived.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold"
                style={{ color: "var(--t-bg-page)", borderRadius: "var(--t-radius-button)" }}
              >
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border-card bg-bg-card p-10 text-center">
            <Award size={48} className="mx-auto text-text-muted-3" />
            <h3 className="mt-4 text-lg font-bold text-text-heading">No Loyalty Activity Yet</h3>
            <p className="mt-2 text-sm text-text-muted-1">
              Complete purchases to start earning loyalty rewards.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    IN_PROGRESS: { label: "In Progress", cls: "bg-blue-500/10 text-blue-400" },
    REWARD_AVAILABLE: { label: "Reward Ready", cls: "bg-amber-500/10 text-amber-400" },
    REDEEMED: { label: "Redeemed", cls: "bg-green-500/10 text-green-400" },
    EXPIRED: { label: "Expired", cls: "bg-red-500/10 text-red-400" },
    CANCELLED: { label: "Cancelled", cls: "bg-slate-500/10 text-slate-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/10 text-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>
      <ChevronRight size={12} className="rotate-180" />
      {s.label}
    </span>
  );
}