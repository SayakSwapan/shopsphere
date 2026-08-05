import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { cartitem: true },
    });

    const count =
      cart?.cartitem.reduce(
        (total, item) => total + item.quantity,
        0
      ) || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ count: 0 });
  }
}
