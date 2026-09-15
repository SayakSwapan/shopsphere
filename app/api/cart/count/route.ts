import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    // Single query: resolve the caller's cart directly through the email
    // relation (no separate user lookup required).
    const cart = await prisma.cart.findFirst({
      where: { user: { email: session.user.email } },
      include: { cartitem: true },
    });

    const count =
      cart?.cartitem.reduce((total, item) => total + item.quantity, 0) || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ count: 0 });
  }
}
