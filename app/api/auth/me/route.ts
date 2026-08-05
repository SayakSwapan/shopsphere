import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  verifyToken,
} from "@/lib/jwt";

import {
  cookies,
} from "next/headers";

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "token"
      )?.value;

    if (!token) {
      return NextResponse.json(
        null
      );
    }

    const payload =
  verifyToken(token) as {
    userId: string;
  };

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            payload.userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

    return NextResponse.json(
      user
    );
  } catch {
    return NextResponse.json(
      null
    );
  }
}