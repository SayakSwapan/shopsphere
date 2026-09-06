import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getCustomerLoyaltyStatus, getCustomerLoyaltyHistory } from "@/lib/loyalty";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    const [status, history] = await Promise.all([
      getCustomerLoyaltyStatus(id),
      getCustomerLoyaltyHistory(id),
    ]);

    // Eligible purchases (orders that counted toward loyalty)
    const purchases = await prisma.loyaltyPurchase.findMany({
      where: { customerId: id },
      orderBy: { countedAt: "desc" },
      take: 100,
      include: {
        loyaltyCycle: { select: { cycleNumber: true } },
      },
    });

    const purchaseDetails = await Promise.all(
      purchases.map(async (p) => {
        const order = await prisma.order.findUnique({
          where: { id: p.orderId },
          select: { orderNumber: true, totalAmount: true, status: true, orderType: true, createdAt: true },
        });
        return {
          id: p.id,
          orderNumber: order?.orderNumber ?? "N/A",
          orderTotal: Number(order?.totalAmount ?? p.purchaseAmount),
          orderStatus: order?.status ?? "UNKNOWN",
          source: p.source,
          amount: Number(p.purchaseAmount),
          countedAt: p.countedAt,
          cycleNumber: p.loyaltyCycle.cycleNumber,
        };
      })
    );

    const redemptions = await prisma.loyaltyRewardRedemption.findMany({
      where: { customerId: id },
      orderBy: { redeemedAt: "desc" },
      take: 50,
      include: {
        loyaltyCycle: { select: { cycleNumber: true } },
      },
    });

    const redemptionDetails = await Promise.all(
      redemptions.map(async (r) => {
        const order = await prisma.order.findUnique({
          where: { id: r.orderId },
          select: { orderNumber: true, totalAmount: true, status: true, orderType: true },
        });
        return {
          id: r.id,
          orderNumber: order?.orderNumber ?? "N/A",
          orderAmount: Number(order?.totalAmount ?? r.orderAmount),
          source: r.source,
          discountAmount: Number(r.discountAmount),
          redeemedAt: r.redeemedAt,
          cycleNumber: r.loyaltyCycle.cycleNumber,
        };
      })
    );

    const auditLogs = await prisma.loyaltyAuditLog.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer,
      loyalty: status,
      history,
      purchases: purchaseDetails,
      redemptions: redemptionDetails,
      auditLogs: auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        previousValue: l.previousValue,
        newValue: l.newValue,
        reason: l.reason,
        createdAt: l.createdAt,
        adminName: l.customer?.name,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load customer loyalty" }, { status: 500 });
  }
}