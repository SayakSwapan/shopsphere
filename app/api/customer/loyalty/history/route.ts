import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerLoyaltyHistory, getLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const program = await getLoyaltyProgram();
    const history = await getCustomerLoyaltyHistory(user.id);

    return NextResponse.json({
      success: true,
      program,
      ...history,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load loyalty history" }, { status: 500 });
  }
}