import { NextResponse } from "next/server";

import { adminLogin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await adminLogin(body.email, body.password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
