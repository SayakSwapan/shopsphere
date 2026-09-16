import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mark a single unpaid online order as abandoned (never paid). Called by the
 * client-side payment result screen when the buyer returns from Cashfree
 * without a confirmed payment. The order was never actually processed, so it
 * gets the distinct ABANDONED status — NOT CANCELLED, which is reserved for
 * orders that were really placed (paid / COD) and then cancelled. Ownership is
 * verified against the session cookie so an attacker can never touch someone
 * else's order.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { orderId } = await req.json();

    if (typeof orderId !== "string") {
      return NextResponse.json(
        { success: false, message: "orderId is required." },
        { status: 400 },
      );
    }

    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        user: { email: session.user.email },
        paymentStatus: { not: "PAID" },
      },
      data: {
        status: "ABANDONED",
        paymentStatus: "FAILED",
      },
    });

    return NextResponse.json({
      success: true,
      cancelled: result.count > 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
