import { getAdminSession } from "@/lib/admin-auth";
import { getLoyaltyDashboard } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const dashboard = await getLoyaltyDashboard();
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load loyalty dashboard" }, { status: 500 });
  }
}