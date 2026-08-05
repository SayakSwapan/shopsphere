import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRefundLedger } from "@/lib/finance/refund.service";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const rows = await getRefundLedger();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Admin refunds GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load refunds" }, { status: 500 });
  }
}
