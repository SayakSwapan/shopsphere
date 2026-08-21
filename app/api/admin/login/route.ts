import { NextResponse } from "next/server";

import { adminLogin } from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Per-IP throttle to slow credential stuffing.
    const limit = rateLimit(`admin-login:${ip}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const body = await req.json();

    const result = await adminLogin(body.email, body.password, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    if (result.locked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

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
