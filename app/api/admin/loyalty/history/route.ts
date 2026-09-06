import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const take = 20;
    const pageNum = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const skip = (pageNum - 1) * take;

    const [redemptions, total] = await Promise.all([
      prisma.loyaltyRewardRedemption.findMany({
        orderBy: { redeemedAt: "desc" },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          loyaltyCycle: { select: { cycleNumber: true } },
        },
      }),
      prisma.loyaltyRewardRedemption.count(),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / take)),
      redemptions: redemptions.map((r) => ({
        id: r.id,
        customerId: r.customer.id,
        customerName: r.customer.name ?? "Unknown",
        customerEmail: r.customer.email,
        discountAmount: Number(r.discountAmount),
        orderAmount: Number(r.orderAmount),
        source: r.source,
        cycleNumber: r.loyaltyCycle.cycleNumber,
        redeemedAt: r.redeemedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load reward history" }, { status: 500 });
  }
}