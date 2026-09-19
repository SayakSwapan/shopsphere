import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { buildOfflineInvoicePdf } from "@/lib/orders/offline-invoice-pdf";
import { loadSaleInvoicePdfInput } from "@/lib/orders/offline-invoice-data";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Downloads (or previews) the sale invoice PDF for an offline order. Renders
 * the exact same document that is attached to the completion email.
 */
export async function GET(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const input = await loadSaleInvoicePdfInput(id);
    if (!input) {
      return NextResponse.json(
        { success: false, message: "Offline order not found." },
        { status: 404 },
      );
    }

    const pdf = await buildOfflineInvoicePdf(input);
    const { searchParams } = new URL(req.url);
    const inline = searchParams.get("inline") === "1";

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          inline ? "inline" : "attachment"
        }; filename="Invoice-${input.orderNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("OFFLINE SALE INVOICE PDF ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate invoice PDF." },
      { status: 500 },
    );
  }
}
