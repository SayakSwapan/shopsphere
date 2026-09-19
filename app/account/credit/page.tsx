import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import { getCreditSummary } from "@/lib/customer-credit";
import { formatCurrency } from "@/lib/format";
import {
  Wallet,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Info,
} from "lucide-react";

export const metadata = {
  title: "My Store Credit",
};

const TYPE_META: Record<
  string,
  { label: string; icon: typeof ArrowDownLeft; cls: string }
> = {
  CREDIT: {
    label: "Added",
    icon: ArrowDownLeft,
    cls: "bg-green-500/10 text-green-600",
  },
  DEBIT: {
    label: "Used",
    icon: ArrowUpRight,
    cls: "bg-blue-500/10 text-blue-600",
  },
  ADJUSTMENT: {
    label: "Adjusted",
    icon: SlidersHorizontal,
    cls: "bg-amber-500/10 text-amber-600",
  },
};

export default async function CreditPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?redirectTo=/account/credit");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?redirectTo=/account/credit");
  }

  const summary = await getCreditSummary(user.id);

  return (
    <div
      className="min-h-screen bg-bg-page"
      style={{ fontFamily: "var(--t-font-body)" }}
    >
      <NavbarWrapper />

      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p
            className="uppercase tracking-[0.3em] text-xs text-primary font-bold"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Wallet
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            My Store Credit
          </h1>
          <p className="mt-3 text-text-muted-1 max-w-xl">
            When a replacement at the store is cheaper, the difference is kept
            as store credit on your account. Use it on any future purchase.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Balance card */}
        <div
          className="relative overflow-hidden border border-border-card bg-bg-card p-6 sm:p-8"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center bg-primary/10"
              style={{ borderRadius: "var(--t-radius-button)" }}
            >
              <Wallet size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted-1">
                Available Balance
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-black text-text-heading">
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs text-text-muted-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            Store credit has no cash value and cannot be refunded as cash. It is
            applied by our staff at the counter on your next purchase.
          </p>
        </div>

        {/* Ledger */}
        <div
          className="border border-border-card bg-bg-card overflow-hidden"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <div className="flex items-center gap-3 px-5 sm:px-8 py-4 sm:py-5 border-b border-border-subtle">
            <Wallet size={20} className="text-primary" />
            <h2
              className="text-lg font-bold text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Credit History
            </h2>
          </div>

          {summary.entries.length === 0 ? (
            <div className="px-5 sm:px-8 py-12 text-center">
              <Wallet size={40} className="mx-auto text-text-muted-3" />
              <p className="mt-4 text-sm text-text-muted-1">
                No store credit activity yet.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
              >
                Start Shopping <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {summary.entries.map((entry) => {
                const meta = TYPE_META[entry.type] ?? {
                  label: entry.type,
                  icon: ArrowDownLeft,
                  cls: "bg-slate-500/10 text-slate-500",
                };
                const Icon = meta.icon;
                const signed =
                  entry.type === "DEBIT" ? -entry.amount : entry.amount;
                return (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-4 hover:bg-bg-card-nested transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center ${meta.cls}`}
                        style={{ borderRadius: "var(--t-radius-button)" }}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-heading truncate">
                          {entry.reason}
                        </p>
                        <p className="text-xs text-text-muted-2">
                          {new Date(entry.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                          {entry.recordedByName && ` · ${entry.recordedByName}`}
                          {entry.orderId && (
                            <>
                              {" · "}
                              <Link
                                href={`/account/orders/${entry.orderId}`}
                                className="text-primary hover:opacity-80"
                              >
                                View order
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          signed >= 0 ? "text-green-600" : "text-blue-600"
                        }`}
                      >
                        {signed >= 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(entry.amount))}
                      </p>
                      <p className="text-[11px] text-text-muted-2">
                        Balance {formatCurrency(entry.balanceAfter)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold"
            style={{
              color: "var(--t-bg-page)",
              borderRadius: "var(--t-radius-button)",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
