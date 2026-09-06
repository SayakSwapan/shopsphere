import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerLoyaltyStatus } from "@/lib/loyalty";
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
    const loyalty = await getCustomerLoyaltyStatus(id);

    return NextResponse.json({ success: true, loyalty });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load customer loyalty" }, { status: 500 });
  }
}