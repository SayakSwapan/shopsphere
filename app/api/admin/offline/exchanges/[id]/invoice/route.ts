import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { buildExchangeInvoicePdf } from "@/lib/orders/offline-invoice-pdf";
import { loadExchangeInvoicePdfInput } from "@/lib/orders/offline-invoice-data";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Downloads (or previews) the exchange / replacement invoice PDF. Renders the
 * exact same document that is attached to the exchange email.
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
    const input = await loadExchangeInvoicePdfInput(id);
    if (!input) {
      return NextResponse.json(
        { success: false, message: "Exchange not found." },
        { status: 404 },
      );
    }

    const pdf = await buildExchangeInvoicePdf(input);
    const { searchParams } = new URL(req.url);
    const inline = searchParams.get("inline") === "1";

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          inline ? "inline" : "attachment"
        }; filename="Exchange-${input.exchangeNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("OFFLINE EXCHANGE INVOICE PDF ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate exchange invoice PDF." },
      { status: 500 },
    );
  }
}
