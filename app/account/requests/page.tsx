import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import { ArrowLeft, RotateCcw, RefreshCw, ChevronRight } from "lucide-react";
import { statusColor, statusLabel } from "@/lib/return-replacement";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?redirectTo=/account/requests");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) redirect("/login?redirectTo=/account/requests");

  const [returns, replacements] = await Promise.all([
    prisma.return_request.findMany({
      where: { userId: user.id },
      include: { order: { select: { id: true, orderNumber: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.replacement_request.findMany({
      where: { userId: user.id },
      include: { order: { select: { id: true, orderNumber: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const all = [
    ...returns.map((r) => ({ id: r.id, type: "RETURN" as const, reason: r.reason, reasonOption: r.reasonOption, customText: r.customText, status: r.status, createdAt: r.createdAt, order: r.order })),
    ...replacements.map((r) => ({ id: r.id, type: "REPLACEMENT" as const, reason: r.reason, reasonOption: r.reasonOption, customText: r.customText, status: r.status, createdAt: r.createdAt, order: r.order })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "var(--t-text-muted-1)" }}>
          <ArrowLeft size={16} /> <span style={{ color: "var(--t-primary)" }}>Back to Account</span>
        </Link>
        <h1 className="text-3xl font-black mb-2" style={{ color: "var(--t-text-heading)" }}>My Returns &amp; Replacements</h1>
        <p className="text-sm mb-8" style={{ color: "var(--t-text-muted-1)" }}>{all.length} request{all.length !== 1 ? "s" : ""}</p>

        {all.length === 0 ? (
          <div
            className="border p-12 text-center"
            style={{
              borderRadius: "var(--t-radius-card)",
              borderColor: "var(--t-border-card)",
              background: "var(--t-bg-card)",
            }}
          >
            <p style={{ color: "var(--t-text-muted-1)" }}>No return or replacement requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {all.map((item) => (
              <Link
                key={item.id}
                href={`/account/requests/${item.id}`}
                className="border p-6 block transition hover:opacity-90"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  borderColor: "var(--t-border-card)",
                  background: "var(--t-bg-card)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center"
                      style={{
                        borderRadius: "var(--t-radius-card)",
                        background: item.type === "RETURN"
                          ? "color-mix(in srgb, var(--t-primary) 15%, transparent)"
                          : "color-mix(in srgb, var(--t-accent) 15%, transparent)",
                      }}
                    >
                      {item.type === "RETURN"
                        ? <RotateCcw size={18} style={{ color: "var(--t-primary)" }} />
                        : <RefreshCw size={18} style={{ color: "var(--t-accent)" }} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--t-primary)" }}>{item.type === "RETURN" ? "Return" : "Replacement"}</p>
                      <p className="font-bold text-sm" style={{ color: "var(--t-text-heading)" }}>{item.order.orderNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const colors = statusColor(item.status);
                      return (
                        <span
                          className="rounded-full px-4 py-1 text-xs font-bold"
                          style={{
                            background: `color-mix(in srgb, ${colors.bg} 25%, transparent)`,
                            color: colors.text,
                          }}
                        >
                          {statusLabel(item.status)}
                        </span>
                      );
                    })()}
                    <ChevronRight size={16} style={{ color: "var(--t-text-muted-3)" }} />
                  </div>
                </div>
                <div className="mt-4 text-sm space-y-1" style={{ color: "var(--t-text-muted-1)" }}>
                  <p><span style={{ color: "var(--t-text-muted-2)" }}>Reason:</span> {item.reasonOption || item.reason}</p>
                  {item.customText && <p><span style={{ color: "var(--t-text-muted-2)" }}>Details:</span> {item.customText}</p>}
                  <p className="text-xs" style={{ color: "var(--t-text-muted-3)" }}>Submitted on {item.createdAt.toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
