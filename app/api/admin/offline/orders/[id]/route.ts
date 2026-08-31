import { getAdminSession } from "@/lib/admin-auth";
import {
  cancelOfflineOrder,
  completeOfflineOrder,
} from "@/lib/orders/offline-sale";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as { action?: string; paymentMethod?: string };

    if (body.action === "complete") {
      const result = await completeOfflineOrder({
        orderId: id,
        paymentMethod: body.paymentMethod || "CASH",
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "cancel") {
      const result = await cancelOfflineOrder({ orderId: id });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update offline sale.";
    const status = error instanceof Error && (error as unknown as { status?: number }).status
      ? (error as unknown as { status: number }).status
      : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
