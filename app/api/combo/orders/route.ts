import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createComboOrder, ComboCheckoutError } from "@/lib/combo-checkout";
import { CashfreeError } from "@/lib/payment/cashfree";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const offerSlug = String(body?.offerSlug ?? "");
    const selections = Array.isArray(body?.selections) ? body.selections : [];
    const addressId = String(body?.addressId ?? "");
    const paymentMethod = String(body?.paymentMethod ?? "COD");

    if (!offerSlug) {
      return NextResponse.json({ success: false, message: "Offer is required." }, { status: 400 });
    }
    if (!addressId) {
      return NextResponse.json({ success: false, message: "Shipping address is required." }, { status: 400 });
    }
    if (paymentMethod !== "COD" && paymentMethod !== "CASHFREE") {
      return NextResponse.json({ success: false, message: "Invalid payment method." }, { status: 400 });
    }

    // Resolve user id from the session.
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const result = await createComboOrder({
      userId: user.id,
      offerSlug,
      selections,
      addressId,
      paymentMethod,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ComboCheckoutError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    if (error instanceof CashfreeError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ success: false, message: "Unable to create the combo order." }, { status: 500 });
  }
}
