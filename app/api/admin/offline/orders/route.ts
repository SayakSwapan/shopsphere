import { getAdminSession } from "@/lib/admin-auth";
import {
  createOfflineOrder,
  OfflineOrderInput,
} from "@/lib/orders/offline-sale";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      mode?: "draft" | "complete";
      customer?: OfflineOrderInput["customer"];
      paymentMethod?: string;
      items?: OfflineOrderInput["items"];
      notes?: string;
    };

    const input: OfflineOrderInput = {
      mode: body.mode === "draft" ? "draft" : "complete",
      customer: body.customer ?? { kind: "walkin" },
      paymentMethod: body.paymentMethod || "CASH",
      items: Array.isArray(body.items) ? body.items : [],
      notes: body.notes,
    };

    const result = await createOfflineOrder({
      adminId: session.user.id,
      input,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create offline sale.";
    const status = error instanceof Error && (error as unknown as { status?: number }).status
      ? (error as unknown as { status: number }).status
      : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
