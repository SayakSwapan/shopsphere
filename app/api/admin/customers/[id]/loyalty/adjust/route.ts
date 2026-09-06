import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  adminAdjustLoyaltyProgress,
  adminGrantReward,
  adminRevokeReward,
} from "@/lib/loyalty";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reason } = body;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    switch (action) {
      case "ADJUST_PROGRESS": {
        const newCount = Number(body.newPurchaseCount);
        if (!Number.isFinite(newCount) || newCount < 0) {
          return NextResponse.json({ success: false, message: "Invalid purchase count" }, { status: 400 });
        }
        await adminAdjustLoyaltyProgress({
          customerId: id,
          adminId: session.user.id,
          newPurchaseCount: Math.floor(newCount),
          reason: reason ?? "Manual adjustment",
        });
        break;
      }
      case "GRANT_REWARD": {
        await adminGrantReward({
          customerId: id,
          adminId: session.user.id,
          reason: reason ?? "Manual grant",
        });
        break;
      }
      case "REVOKE_REWARD": {
        await adminRevokeReward({
          customerId: id,
          adminId: session.user.id,
          reason: reason ?? "Manual revocation",
        });
        break;
      }
      default:
        return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Loyalty updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update loyalty" }, { status: 500 });
  }
}