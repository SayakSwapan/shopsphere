import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "./lib/admin-jwt";

async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    const payload = await verifyAdminToken(token);

    if (!payload) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }
  }

  return NextResponse.next();
}

export { proxy };

export const config = {
  matcher: ["/admin/:path*"],
};
