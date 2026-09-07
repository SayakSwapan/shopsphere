import { getAdminSession } from "@/lib/admin-auth";
import {
  computeOfflineComboAdjustments,
  OfflineLineItemInput,
} from "@/lib/orders/offline-sale";
import { NextResponse } from "next/server";

/**
 * Live combo-pricing preview for the Offline POS page.
 *
 * The POS UI calls this whenever the sale items change to show the exact
 * admin-managed (combo) prices that will be charged when an active combo is
 * satisfied — those lines are locked and not bargainable. This is display-only:
 * the authoritative pricing is re-derived inside `createOfflineOrder`.
 */
export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { items?: OfflineLineItemInput[] };
    const items = Array.isArray(body.items) ? body.items : [];

    const result = await computeOfflineComboAdjustments(items);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to compute combo pricing.";
    console.error("OFFLINE COMBO PRICING ERROR:", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}