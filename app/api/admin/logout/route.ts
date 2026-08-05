import { NextResponse } from "next/server";
import { removeAdminCookie } from "@/lib/admin-cookie";

export async function POST() {
  try {
    await removeAdminCookie();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Logout failed." },
      { status: 500 }
    );
  }
}
