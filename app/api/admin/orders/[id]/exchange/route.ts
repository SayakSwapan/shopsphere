import { getAdminSession } from "@/lib/admin-auth";
import { getExchangeOptions, postExchange } from "@/lib/orders/exchange-api";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

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
    const search = new URL(req.url).searchParams.get("search")?.trim() ?? "";
    return getExchangeOptions(id, "ONLINE", search);
  } catch (error) {
    console.error("ONLINE EXCHANGE OPTIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load replacement options." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id } = await params;
    return postExchange(id, session.user.id, "ONLINE", await req.json());
  } catch (error) {
    console.error("ONLINE EXCHANGE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to record replacement." },
      { status: 500 },
    );
  }
}
